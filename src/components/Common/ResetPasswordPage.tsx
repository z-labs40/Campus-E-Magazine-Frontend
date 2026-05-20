import * as React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Mismatch Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Password Updated",
        description: "Your new password is set. Please sign in.",
        variant: "success"
      });
      navigate("/login");
    }, 800);
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
