import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      const token = response.data.data.token;
      toast({
        title: "OTP Code Sent",
        description: "A 6-digit verification code has been sent to your campus email.",
        variant: "success"
      });
      navigate("/verify-otp", { state: { email, token } });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.response?.data?.message || error.message || "Failed to send OTP code. Please check your email.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background grid-bg-editorial">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-premium glass-card text-center space-y-6">
        
        <div className="flex justify-center select-none">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 animate-float-slow">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-sora font-extrabold text-foreground">Recover Password</h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
            Enter your registered college email and we will send you a 6-digit OTP passcode to securely reset your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">College Email</span>
            <Input 
              type="email" 
              placeholder="aria.chen@campus.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full rounded-xl gap-2 font-semibold h-10 shadow-premium pt-1" disabled={loading}>
            <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="pt-2 flex items-center justify-center select-none">
          <Link to="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
