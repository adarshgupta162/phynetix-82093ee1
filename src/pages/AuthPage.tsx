import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, CheckCircle2, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const phoneSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number"),
});

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'otp' | 'verify-otp';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  
  const [mode, setMode] = useState<AuthMode>(
    modeParam === 'signup' ? 'signup' : 
    modeParam === 'reset' ? 'forgot' : 
    modeParam === 'otp' ? 'otp' : 'login'
  );
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, isAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, authLoading, navigate]);

  const validateForm = () => {
    try {
      if (mode === 'signup') {
        signupSchema.parse({ email, password, fullName });
      } else if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else if (mode === 'otp') {
        phoneSchema.parse({ phone });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode !== 'forgot' && mode !== 'verify-otp' && !validateForm()) return;
    
    setIsLoading(true);
    setMessage("");
    
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({ title: "Signup failed", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Account created!", description: "Welcome to QuizMaster!" });
          navigate("/dashboard");
        }
      } else if (mode === 'login') {
        const { error, isAdmin: userIsAdmin } = await signIn(email, password);
        if (error) {
          toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
        } else {
          toast({
            title: "Welcome back!",
            description: userIsAdmin ? "Redirecting to admin dashboard..." : "You've been successfully logged in.",
          });
          navigate(userIsAdmin ? "/admin" : "/dashboard");
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setMessage("Password reset link sent to your email!");
          toast({ title: "Email sent", description: "Check your inbox for the reset link" });
        }
      } else if (mode === 'otp') {
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setMode('verify-otp');
          toast({ title: "OTP Sent", description: "Check your phone for the verification code" });
        }
      } else if (mode === 'verify-otp') {
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });
        if (error) {
          toast({ title: "Verification failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Success!", description: "You've been logged in" });
          navigate("/dashboard");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Access to 10,000+ practice questions",
    "Detailed performance analytics",
    "AI-powered study recommendations",
    "Track progress across subjects"
  ];

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      case 'otp': return 'Phone Login';
      case 'verify-otp': return 'Verify OTP';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Start your free trial today';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'otp': return 'Login with your phone number';
      case 'verify-otp': return 'Enter the code sent to your phone';
      default: return 'Enter your credentials to continue';
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-primary/30 top-20 -left-48" />
        <div className="floating-orb w-80 h-80 bg-accent/30 bottom-20 -right-40" style={{ animationDelay: '2s' }} />
      </div>

      {/* Left Side - Benefits (Signup only) */}
      {mode === 'signup' && (
        <div className="hidden lg:flex flex-col justify-center w-1/2 p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-2 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold font-display gradient-text">QuizMaster</span>
            </Link>

            <h1 className="text-4xl font-bold font-display mb-6">
              Start Your Journey to <span className="gradient-text">Success</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are already mastering their exams with our AI-powered platform.
            </p>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}

      {/* Form Side */}
      <div className={`flex-1 flex items-center justify-center p-4 lg:p-12 ${mode !== 'signup' ? 'w-full' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold font-display gradient-text">QuizMaster</span>
          </Link>

          {/* Form Card */}
          <div className="glass-card p-8">
            {/* Back button for sub-modes */}
            {(mode === 'forgot' || mode === 'otp' || mode === 'verify-otp') && (
              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            )}

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold font-display mb-2">{getTitle()}</h1>
              <p className="text-muted-foreground">{getSubtitle()}</p>
            </div>

            {message && (
              <div className="mb-6 p-4 rounded-lg bg-success/10 text-success text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              )}

              {(mode === 'otp' || mode === 'verify-otp') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12"
                      disabled={mode === 'verify-otp'}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              )}

              {mode === 'verify-otp' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {mode === 'signup' && "Create Account"}
                    {mode === 'login' && "Sign In"}
                    {mode === 'forgot' && "Send Reset Link"}
                    {mode === 'otp' && "Send OTP"}
                    {mode === 'verify-otp' && "Verify"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Alternative login methods */}
            {mode === 'login' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setMode('otp')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Login with Phone OTP
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-8">
              {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-primary hover:underline font-medium"
              >
                {mode === 'signup' ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
