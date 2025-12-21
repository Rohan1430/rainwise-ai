import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Mail, Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address").max(255);
const otpSchema = z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers");

// OTP expiry time in seconds (5 minutes)
const OTP_EXPIRY_SECONDS = 300;
// Resend cooldown in seconds
const RESEND_COOLDOWN_SECONDS = 60;

const Auth = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [expiryCountdown, setExpiryCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Resend countdown timer
  useEffect(() => {
    let timer: number;
    if (otpSent && resendCountdown > 0) {
      timer = window.setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [otpSent, resendCountdown]);

  // OTP expiry countdown timer
  useEffect(() => {
    let timer: number;
    if (otpSent && expiryCountdown > 0 && !verificationSuccess) {
      timer = window.setTimeout(() => {
        setExpiryCountdown(expiryCountdown - 1);
      }, 1000);
    } else if (expiryCountdown === 0 && otpSent) {
      toast({
        title: "OTP Expired",
        description: "Your verification code has expired. Please request a new one.",
        variant: "destructive",
      });
    }
    return () => clearTimeout(timer);
  }, [otpSent, expiryCountdown, verificationSuccess, toast]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Mask email for display
  const maskEmail = (email: string): string => {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return email;
    return `${local.substring(0, 2)}${"*".repeat(Math.min(local.length - 2, 5))}@${domain}`;
  };

  // Validate email on change
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (value) {
      const result = emailSchema.safeParse(value);
      setEmailError(result.success ? "" : result.error.errors[0].message);
    } else {
      setEmailError("");
    }
  }, []);

  // Send OTP request
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      toast({
        title: "Invalid email",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setEmailError("");

    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { email: email.toLowerCase().trim() },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send OTP");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setOtpSent(true);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setExpiryCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setOtp("");
      
      toast({
        title: "Verification code sent!",
        description: "Check your email for the 6-digit code",
      });
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate OTP
    const otpResult = otpSchema.safeParse(otp);
    if (!otpResult.success) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke("verify-otp", {
        body: { 
          email: email.toLowerCase().trim(),
          otp: otp 
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Verification failed");
      }

      if (response.data?.error) {
        if (response.data.remainingAttempts !== undefined) {
          throw new Error(`${response.data.error}. ${response.data.remainingAttempts} attempts remaining.`);
        }
        throw new Error(response.data.error);
      }

      setVerificationSuccess(true);
      
      toast({
        title: "Verification successful!",
        description: "Signing you in...",
      });

      // If we got an action link, use it to complete auth
      if (response.data?.actionLink) {
        // Extract the token from the action link and verify
        const url = new URL(response.data.actionLink);
        const token = url.searchParams.get("token");
        const type = url.searchParams.get("type") as "magiclink";
        
        if (token && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type,
          });
          
          if (verifyError) {
            // Fallback: use magic link flow
            const { error: signInError } = await supabase.auth.signInWithOtp({
              email: email.toLowerCase().trim(),
              options: {
                shouldCreateUser: true,
              }
            });
            
            if (!signInError) {
              toast({
                title: "Check your email",
                description: "Click the link to complete sign in",
              });
            }
          }
        }
      }

      // Navigate after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Reset to email input
  const handleBack = () => {
    setOtpSent(false);
    setOtp("");
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    setExpiryCountdown(OTP_EXPIRY_SECONDS);
    setCanResend(false);
    setVerificationSuccess(false);
  };

  // Success animation screen
  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Verified!</h1>
          <p className="text-muted-foreground">Redirecting you to the app...</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 animate-scale-in">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {otpSent ? "Enter Verification Code" : "Welcome"}
          </h1>
          <p className="text-muted-foreground mt-2 transition-all duration-300">
            {otpSent 
              ? `Code sent to ${maskEmail(email)}` 
              : "Sign in with your email to continue"
            }
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border animate-fade-in transition-all duration-300">
          {!otpSent ? (
            // Email Input Form
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  disabled={loading}
                  className={`transition-all duration-200 focus:scale-[1.01] ${
                    emailError ? "border-destructive" : ""
                  }`}
                  autoComplete="email"
                  autoFocus
                />
                {emailError && (
                  <p className="text-sm text-destructive animate-fade-in">{emailError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-[1.02]" 
                disabled={loading || !!emailError}
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Sending code...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Send Verification Code
                  </span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We'll send a 6-digit code to verify your email
              </p>
            </form>
          ) : (
            // OTP Input Form
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              {/* Expiry Timer */}
              <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  expiryCountdown <= 60 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  Code expires in {formatTime(expiryCountdown)}
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-4">
                <Label htmlFor="otp" className="text-center block">
                  Enter 6-digit code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={loading || expiryCountdown === 0}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index}
                          index={index} 
                          className="w-12 h-14 text-xl font-semibold transition-all duration-200 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Verify Button */}
              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-[1.02]" 
                disabled={loading || otp.length !== 6 || expiryCountdown === 0}
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Sign In
                  </span>
                )}
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 transition-all duration-200"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 transition-all duration-200"
                  onClick={() => handleSendOtp()}
                  disabled={loading || !canResend}
                >
                  {canResend ? "Resend Code" : `Resend (${resendCountdown}s)`}
                </Button>
              </div>

              {/* Security note */}
              <p className="text-xs text-muted-foreground text-center">
                Didn't receive the code? Check your spam folder
              </p>
            </form>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Secure OTP authentication • Codes expire in 5 minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
