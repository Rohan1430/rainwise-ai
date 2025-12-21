import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants for OTP security
const OTP_EXPIRY_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Generate a number between 100000 and 999999
  return String(100000 + (array[0] % 900000));
}

/**
 * Hash the OTP using SHA-256 for secure storage
 */
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate email format using regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("OTP request received for email:", email?.substring(0, 3) + "***");

    // Validate email input
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      console.log("Invalid email format provided");
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting - max 3 OTP requests per 10 minutes
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from("otp_rate_limits")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (rateLimitError && rateLimitError.code !== "PGRST116") {
      console.error("Rate limit check error:", rateLimitError);
      throw new Error("Failed to check rate limits");
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    if (rateLimit) {
      const firstRequestTime = new Date(rateLimit.first_request_at);
      
      // Check if we're still within the rate limit window
      if (firstRequestTime > windowStart) {
        if (rateLimit.request_count >= MAX_REQUESTS_PER_WINDOW) {
          console.log("Rate limit exceeded for email");
          const resetTime = new Date(firstRequestTime.getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
          const waitSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
          
          return new Response(
            JSON.stringify({ 
              error: `Too many OTP requests. Please wait ${Math.ceil(waitSeconds / 60)} minutes.`,
              retryAfter: waitSeconds
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Update request count
        await supabase
          .from("otp_rate_limits")
          .update({ 
            request_count: rateLimit.request_count + 1,
            last_request_at: now.toISOString()
          })
          .eq("email", normalizedEmail);
      } else {
        // Reset the rate limit window
        await supabase
          .from("otp_rate_limits")
          .update({ 
            request_count: 1,
            first_request_at: now.toISOString(),
            last_request_at: now.toISOString()
          })
          .eq("email", normalizedEmail);
      }
    } else {
      // Create new rate limit record
      await supabase
        .from("otp_rate_limits")
        .insert({ 
          email: normalizedEmail,
          request_count: 1,
          first_request_at: now.toISOString(),
          last_request_at: now.toISOString()
        });
    }

    // Invalidate any existing unused OTPs for this email
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log("Generated new OTP, expires at:", expiresAt.toISOString());

    // Store hashed OTP in database
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        used: false,
        attempts: 0
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send OTP via email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: "RainWater Harvest <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #10b981); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">💧</span>
              </div>
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">Verification Code</h1>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 30px;">
              Enter this code to verify your email address:
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 0;">
              This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Email sending failed:", emailResponse.error);
      throw new Error("Failed to send verification email");
    }

    console.log("OTP email sent successfully");

    // Return success without revealing any sensitive information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If this email is registered, you will receive a verification code.",
        expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    
    // Return generic error message to prevent information leakage
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
