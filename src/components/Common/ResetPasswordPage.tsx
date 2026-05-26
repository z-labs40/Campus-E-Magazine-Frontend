import * as React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Mismatch Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    const email = (location.state as any)?.email;
    const code = (location.state as any)?.code;
    const token = (location.state as any)?.token;

    if (!email || !code || !token) {
      toast({
        title: "Session Expired",
        description: "Please restart the password recovery process.",
        variant: "destructive"
      });
      navigate("/forgot-password");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code, token, newPassword: password });
      toast({
        title: "Password Updated",
        description: "Your new password is set. Please sign in.",
        variant: "success"
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || error.message || "Failed to reset password. Please try again.",
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
            <Lock className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-sora font-extrabold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
            Choose a strong password containing letters, numbers, and symbols to protect your collaborative credentials.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">New Access Password</span>
            <Input 
              type="password" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Confirm New Password</span>
            <Input 
              type="password" 
              placeholder="••••••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full rounded-xl gap-2 font-semibold h-10 shadow-premium pt-1" disabled={loading}>
            <span>{loading ? "Updating Password..." : "Reset Access Password"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

      </div>
    </div>
  );
}
