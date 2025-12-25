import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Mail, Lock, User, MapPin, Eye, EyeOff, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address").max(255);
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100);

type AuthMode = "login" | "register" | "forgot-password" | "reset-success";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    // Check for password recovery event in URL hash - redirect to reset page
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      // Redirect to dedicated reset password page with the hash
      navigate(`/reset-password${window.location.hash}`);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // CRITICAL: Do NOT auto-login on PASSWORD_RECOVERY event
      if (event === "PASSWORD_RECOVERY") {
        // Redirect to reset password page instead of auto-login
        navigate(`/reset-password${window.location.hash}`);
        return;
      }
      
      if (session && event === "SIGNED_IN") {
        // Only track and redirect for actual sign-ins (not recovery)
        setTimeout(() => {
          trackActivity("login");
        }, 0);
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Track user activity
  const trackActivity = async (activityType: string, metadata: Record<string, unknown> = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_activity").insert({
          user_id: user.id,
          activity_type: activityType,
          metadata
        } as any);
      }
    } catch (error) {
      console.error("Failed to track activity:", error);
    }
  };

  // Validate email
  const validateEmail = (value: string) => {
    setEmail(value);
    if (value) {
      const result = emailSchema.safeParse(value);
      setEmailError(result.success ? "" : result.error.errors[0].message);
    } else {
      setEmailError("");
    }
  };

  // Validate password
  const validatePassword = (value: string) => {
    setPassword(value);
    if (value && mode === "register") {
      const result = passwordSchema.safeParse(value);
      setPasswordError(result.success ? "" : result.error.errors[0].message);
    } else {
      setPasswordError("");
    }
    // Also check confirm password match
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

  // Validate name
  const validateName = (value: string) => {
    setFullName(value);
    if (value) {
      const result = nameSchema.safeParse(value);
      setNameError(result.success ? "" : result.error.errors[0].message);
    } else {
      setNameError("");
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      setAuthSuccess(true);
      toast({
        title: "Welcome back!",
        description: "Signing you in...",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    const nameResult = nameSchema.safeParse(fullName);
    
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      return;
    }
    if (!passwordResult.success) {
      setPasswordError(passwordResult.error.errors[0].message);
      return;
    }
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName.trim(),
            location: location.trim() || null,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("An account with this email already exists. Please login instead.");
        }
        throw error;
      }

      // Update profile with additional data
      if (data.user) {
        await supabase.from("profiles").update({
          full_name: fullName.trim(),
          location: location.trim() || null,
        }).eq("user_id", data.user.id);
      }

      setAuthSuccess(true);
      toast({
        title: "Account created!",
        description: "Welcome to RainIQ",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMode("reset-success");
      toast({
        title: "Reset link sent!",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when switching modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setConfirmPasswordError("");
    setNameError("");
    if (newMode === "login" || newMode === "register") {
      setEmailError("");
    }
  };

  // Success animation screen
  if (authSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-2xl mb-6 shadow-success animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {mode === "register" ? "Account Created!" : "Welcome Back!"}
          </h1>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Reset success screen
  if (mode === "reset-success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-page p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-glow">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-2xl shadow-card border border-border">
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                The link will expire in 10 minutes. If you don't see the email, check your spam folder.
              </p>
              <Button
                variant="outline"
                className="w-full h-11 btn-animate"
                onClick={() => switchMode("login")}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "forgot-password" && "Reset Password"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" && "Sign in to your RainIQ account"}
            {mode === "register" && "Join RainIQ to start harvesting insights"}
            {mode === "forgot-password" && "Enter your email to receive a reset link"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card p-8 rounded-2xl shadow-card border border-border animate-fade-in stagger-1">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="email"
                  autoFocus
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                  onClick={() => switchMode("forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-11 btn-animate shadow-glow" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  onClick={() => switchMode("register")}
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => validateName(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 ${nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="name"
                  autoFocus
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="email"
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Location <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  autoComplete="address-level2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
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
                  Confirm Password
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

              <Button type="submit" className="w-full h-11 btn-animate bg-secondary hover:bg-secondary/90 shadow-success" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  onClick={() => switchMode("login")}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {mode === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  required
                  disabled={loading}
                  className={`h-11 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="email"
                  autoFocus
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              <Button type="submit" className="w-full h-11 btn-animate shadow-glow" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Sending link...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Reset Link
                    <Mail className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  onClick={() => switchMode("login")}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center animate-fade-in stagger-2">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to RainIQ's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
