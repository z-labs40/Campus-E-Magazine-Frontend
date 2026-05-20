import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, ShieldAlert, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useStore, Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useStore();
  const { toast } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("writer");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = login(email, role);
      setLoading(false);
      
      if (user) {
        toast({
          title: "Logged In Successfully",
          description: `Welcome back, ${user.name}! Switched role to ${user.role}.`,
          variant: "success"
        });

        // Smart redirect depending on logged in role
        if (user.role === "admin") navigate("/app/admin");
        else if (user.role === "editor") navigate("/app/editor");
        else navigate("/app");
      }
    }, 800);
  };

  // Instant demo-switcher for easy testing
  const handleQuickLogin = (demoEmail: string, demoRole: Role) => {
    setLoading(true);
    setTimeout(() => {
      const user = login(demoEmail, demoRole);
      setLoading(false);
      if (user) {
        toast({
          title: "Quick-Auth Bypassed",
          description: `Access granted as ${user.name} (${user.role.toUpperCase()})`,
          variant: "success"
        });
        if (user.role === "admin") navigate("/app/admin");
        else if (user.role === "editor") navigate("/app/editor");
        else navigate("/app");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      
      {/* LEFT PANEL: CINEMATIC EDITORIAL HERO COVER */}
      <div className="hidden lg:flex lg:col-span-7 bg-sidebar text-sidebar-foreground relative overflow-hidden flex-col justify-between p-12 select-none border-r border-border/10">
        
        {/* Abstract background graphics */}
        <div className="absolute top-[-20%] left-[-20%] h-[80%] w-[80%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[70%] w-[70%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 grid-bg-editorial opacity-[0.03] pointer-events-none" />

        <Link to="/" className="flex items-center gap-3 relative z-10 self-start">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-sora font-extrabold tracking-tight text-lg text-white">Campus E-Mag</span>
        </Link>

        <div className="max-w-xl space-y-6 relative z-10 my-auto text-left">
          <h2 className="text-4xl lg:text-5xl font-sora font-extrabold text-white leading-tight">
            The Hub for <br />
            Collaborative Student Voice.
          </h2>
          <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
            Write immersive stories, highlight text to suggest revisions, and participate in a premium college-level editing review cycle that replicates real product structures.
          </p>

          <div className="flex flex-col gap-3.5 pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs text-sidebar-foreground font-semibold">Google-Docs style selection tools</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs text-sidebar-foreground font-semibold">Slash commands block formatting editor</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs text-sidebar-foreground font-semibold">Side-by-side comparative revision diffs</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 relative z-10">
          © {new Date().getFullYear()} Campus E-Magazine publishing suite. Powered by Clean Architecture.
        </p>

      </div>

      {/* RIGHT PANEL: INTERACTIVE FORM & QUICK SELECT */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-sora font-extrabold text-foreground">Sign In</h1>
            <p className="text-muted-foreground text-xs">
              Welcome back! Access your campus writer or editor dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Campus Email Address</span>
              <Input 
                type="email" 
                placeholder="aria.chen@campus.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Access Password</span>
                <Link to="/forgot-password" className="text-[11px] text-primary font-bold hover:underline">Forgot password?</Link>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Select Active Workspace Role</span>
              <div className="grid grid-cols-3 gap-2">
                {(["writer", "editor", "admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-9 rounded-lg border text-xs font-bold capitalize transition-all select-none cursor-pointer ${
                      role === r 
                        ? "bg-primary border-primary text-primary-foreground font-extrabold shadow-sm" 
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full rounded-xl gap-2 font-semibold h-11 shadow-premium pt-1" disabled={loading}>
              <span>{loading ? "Verifying..." : "Sign In to Workspace"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* 1-CLICK DEMO AUTH PANEL FOR EASY EVALUATION */}
          <div className="border border-border/80 bg-accent/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-primary select-none">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              <span className="text-xs font-extrabold tracking-wider uppercase font-sora">Demo Quick-Auth Ports</span>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-normal">
              Click below to switch users and explore each dashboard layout instantly:
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[11px] justify-between h-9 rounded-lg hover:border-emerald-500/30 hover:bg-emerald-500/5 select-none"
                onClick={() => handleQuickLogin("aria.chen@campus.edu", "writer")}
                type="button"
              >
                <span>Aria Chen (Writer View)</span>
                <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">Writer</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[11px] justify-between h-9 rounded-lg hover:border-amber-500/30 hover:bg-amber-500/5 select-none"
                onClick={() => handleQuickLogin("marcus.t@campus.edu", "editor")}
                type="button"
              >
                <span>Marcus Thorne (Editor View)</span>
                <span className="text-[9px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">Editor</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[11px] justify-between h-9 rounded-lg hover:border-rose-500/30 hover:bg-rose-500/5 select-none"
                onClick={() => handleQuickLogin("evelyn.vance@campus.edu", "admin")}
                type="button"
              >
                <span>Dr. Evelyn Vance (Admin View)</span>
                <span className="text-[9px] text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">Admin</span>
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground select-none">
            Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up now</Link>
          </p>

        </div>
      </div>

    </div>
  );
}
