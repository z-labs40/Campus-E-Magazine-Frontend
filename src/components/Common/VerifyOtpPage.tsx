import * as React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { BookOpen, ShieldAlert, ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const email = (location.state as any)?.email || "your email";
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = React.useState(false);

  const handleChange = (idx: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);

    // Dynamic focus shifting to next input
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-${idx - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.join("");
    if (finalCode.length < 6) {
      toast({
        title: "Incomplete Code",
        description: "Please enter the entire 6-digit OTP code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Code Verified",
        description: "Credentials authenticated successfully. Please set a new password.",
        variant: "success"
      });
      navigate("/reset-password", { state: { email } });
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background grid-bg-editorial">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-premium glass-card text-center space-y-6">
        
        <div className="flex justify-center select-none">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 animate-float-slow">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-sora font-extrabold text-foreground">Verify OTP</h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
            We have sent a passcode to <span className="font-bold text-foreground">{email}</span>. Enter the digits below to authenticate:
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 select-none">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="h-12 w-10 sm:w-12 rounded-lg border border-input text-center text-lg font-bold font-sora bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            ))}
          </div>

          <Button type="submit" className="w-full rounded-xl gap-2 font-semibold h-10 shadow-premium pt-1 animate-pulse-slow" disabled={loading}>
            <span>{loading ? "Authenticating..." : "Verify & Continue"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="pt-2 flex items-center justify-center select-none">
          <Link to="/forgot-password" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Send code again</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
