import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants for OTP verification security
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Hash the OTP using SHA-256 to compare with stored hash
 */
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate OTP format (6 digits)
 */
function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();
    console.log("OTP verification request for email:", email?.substring(0, 3) + "***");

    // Validate inputs
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      console.log("Invalid email format");
      return new Response(
        JSON.stringify({ error: "Invalid verification request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp || typeof otp !== "string" || !isValidOTP(otp)) {
      console.log("Invalid OTP format");
      return new Response(
        JSON.stringify({ error: "Invalid verification code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the most recent unused OTP for this email
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.log("No valid OTP found or fetch error:", fetchError.code);
      // Generic error to prevent email enumeration
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    
    if (now > expiresAt) {
      console.log("OTP has expired");
      // Mark as used to prevent reuse attempts
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);
        
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      console.log("Max verification attempts exceeded");
      // Invalidate the OTP
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);
        
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the provided OTP and compare
    const providedOtpHash = await hashOTP(otp);
    
    if (providedOtpHash !== otpRecord.otp_hash) {
      console.log("OTP mismatch, incrementing attempt counter");
      // Increment attempts counter
      await supabase
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
        
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts - 1;
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid verification code",
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - mark as used immediately to prevent reuse
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    console.log("OTP verified successfully");

    // Create or sign in the user using Supabase Auth Admin API
    // First, check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    if (existingUser) {
      console.log("Existing user found, generating session");
      // Generate a session for existing user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
      });

      if (sessionError) {
        console.error("Failed to generate session:", sessionError);
        throw new Error("Failed to create session");
      }

      userId = existingUser.id;
      
      // Create a direct session using signInWithPassword alternative
      // Since we've verified OTP, we'll use admin to create session tokens
      const sessionToken = generateSessionToken();
      
      // Use admin to update user metadata to track OTP verification
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { 
          last_otp_verified: now.toISOString(),
          otp_verified: true
        }
      });

      // Generate proper session tokens
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          redirectTo: `${Deno.env.get("SUPABASE_URL")}`
        }
      });

      if (signInError) throw signInError;

      accessToken = signInData.properties?.hashed_token || sessionToken;
      refreshToken = sessionToken;

    } else {
      console.log("Creating new user");
      // Create new user with a random password (they'll use OTP to login)
      const randomPassword = generateSessionToken();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: randomPassword,
        email_confirm: true, // Auto-confirm since we verified via OTP
        user_metadata: {
          otp_verified: true,
          last_otp_verified: now.toISOString()
        }
      });

      if (createError) {
        console.error("Failed to create user:", createError);
        throw new Error("Failed to create account");
      }

      userId = newUser.user.id;
      
      // Create profile for new user
      await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          email: normalizedEmail,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });

      accessToken = generateSessionToken();
      refreshToken = generateSessionToken();
    }

    // Generate a magic link for the user to complete authentication
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkError) {
      console.error("Failed to generate auth link:", linkError);
      throw new Error("Failed to complete authentication");
    }

    // Clean up rate limits for this email
    await supabase
      .from("otp_rate_limits")
      .delete()
      .eq("email", normalizedEmail);

    console.log("Authentication successful for user:", userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification successful",
        userId: userId,
        // Return the token hash which can be used for session creation
        token: linkData.properties?.hashed_token,
        actionLink: linkData.properties?.action_link
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    
    // Return generic error message to prevent information leakage
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
