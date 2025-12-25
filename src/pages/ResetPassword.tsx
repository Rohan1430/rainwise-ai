import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, KeyRound, AlertTriangle } from "lucide-react";
import { z } from "zod";

// Password validation schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

type ResetState = "loading" | "valid" | "invalid" | "expired" | "success";

const ResetPassword = () => {
  const [resetState, setResetState] = useState<ResetState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for valid reset token on mount
  useEffect(() => {
    const checkResetToken = async () => {
      // Get hash parameters from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      // Also check query params (Supabase sometimes uses these)
      const queryParams = new URLSearchParams(window.location.search);
      const error = queryParams.get("error");
      const errorDescription = queryParams.get("error_description");
      
      if (error) {
        console.error("Reset link error:", errorDescription);
        if (errorDescription?.toLowerCase().includes("expired")) {
          setResetState("expired");
        } else {
          setResetState("invalid");
        }
        return;
      }
      
      if (type === "recovery" && accessToken) {
        // Valid recovery token - set the session but don't navigate
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });
          
          if (sessionError || !data.session) {
            console.error("Session error:", sessionError);
            setResetState("invalid");
            return;
          }
          
          setResetState("valid");
        } catch (err) {
          console.error("Error setting session:", err);
          setResetState("invalid");
        }
      } else {
        // No valid token found
        setResetState("invalid");
      }
    };

    checkResetToken();
  }, []);

  // Validate password
  const validatePassword = (value: string) => {
    setPassword(value);
    if (value) {
      const result = passwordSchema.safeParse(value);
      setPasswordError(result.success ? "" : result.error.errors[0].message);
    } else {
      setPasswordError("");
    }
    // Check confirm password match
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Validate confirm password
  const validateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    if (value && value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Handle password reset submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setPasswordError(passwordResult.error.errors[0].message);
      return;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      // Sign out immediately after password reset - DO NOT auto-login
      await supabase.auth.signOut();
      
      setResetState("success");
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset. Please login with your new password.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (resetState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (resetState === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-2xl mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has already been used. Please request a new reset link.
          </p>
          <div className="bg-card p-6 rounded-2xl shadow-card border border-border">
            <Button
              className="w-full h-11 btn-animate"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired token state
  if (resetState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-warning/10 rounded-2xl mb-6">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Link Expired</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link has expired. Reset links are only valid for 10 minutes. Please request a new one.
          </p>
          <div className="bg-card p-6 rounded-2xl shadow-card border border-border">
            <Button
              className="w-full h-11 btn-animate"
              onClick={() => navigate("/auth")}
            >
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - redirect to login
  if (resetState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-2xl mb-6 shadow-success animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Password Reset Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully updated. Please sign in with your new password.
          </p>
          <div className="bg-card p-6 rounded-2xl shadow-card border border-border">
            <Button
              className="w-full h-11 btn-animate shadow-glow"
              onClick={() => navigate("/auth")}
            >
              <span className="flex items-center gap-2">
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
      {/* Decorative elements */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow hover:scale-105 transition-transform">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground mt-2">
            Create a strong password for your account
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card p-8 rounded-2xl shadow-card border border-border animate-fade-in stagger-1">
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-muted-foreground" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => validatePassword(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 pr-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {!passwordError && password && (
                <p className="text-xs text-secondary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Strong password requirements met
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => validateConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 pr-10 ${confirmPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordError && <p className="text-sm text-destructive">{confirmPasswordError}</p>}
            </div>

            {/* Password requirements */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className={password.length >= 8 ? "text-secondary" : ""}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? "text-secondary" : ""}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? "text-secondary" : ""}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? "text-secondary" : ""}>
                  • One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(password) ? "text-secondary" : ""}>
                  • One special character
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full h-11 btn-animate shadow-glow" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Updating password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Reset Password
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center animate-fade-in stagger-2">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/auth" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
