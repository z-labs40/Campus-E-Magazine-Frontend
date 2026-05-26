import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, ArrowRight, Check } from "lucide-react";
import { useStore, Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useStore();
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please complete all fields to sign up.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const user = await register(name, email, password, "user");
      if (user) {
        toast({
          title: "Account Registered",
          description: `Welcome to the publishing workspace, ${user.name}!`,
          variant: "success"
        });
        navigate("/app");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || error.message || "Email address may already be registered.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      <div className="hidden lg:flex lg:col-span-6 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between select-none relative overflow-hidden border-r border-border/10">
        <div className="absolute top-[-20%] left-[-20%] h-[80%] w-[80%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[70%] w-[70%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <Link to="/" className="flex items-center gap-3 relative z-10 self-start">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-sora font-extrabold tracking-tight text-lg text-white">Campus E-Mag</span>
        </Link>

        <div className="max-w-md space-y-6 relative z-10 my-auto text-left">
          <h2 className="text-4xl font-sora font-extrabold text-white leading-tight">Join the editorial circle.</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Create an account to submit articles, review drafts, and collaborate on e-magazine issues.
          </p>

          <div className="space-y-3 pt-4">
            {["Premium tip-tap based slash commands editor", "Comprehensive mock notification feeds", "Dynamic visual diff suggestion comparison tools"].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-4.5 w-4.5 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-sidebar-foreground/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 relative z-10">
          © {new Date().getFullYear()} Campus E-Magazine. Designed for premium performances.
        </p>
      </div>

      <div className="lg:col-span-6 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-sora font-extrabold text-foreground">Get Started</h1>
            <p className="text-muted-foreground text-xs">Create your collegiate publisher profile.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Full Professional Name</span>
              <Input 
                type="text" 
                placeholder="Aria Chen" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Campus Email</span>
              <Input 
                type="email" 
                placeholder="aria.chen@campus.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Access Password</span>
              <Input 
                type="password" 
                placeholder="Create secure password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <p className="text-[11px] text-muted-foreground rounded-lg border border-border/40 bg-accent/20 p-3 leading-relaxed">
              🎓 New accounts start as <strong>Readers</strong>. Once you submit your first edit suggestion, your account is automatically promoted to <strong>Editor</strong> access.
            </p>

            <Button type="submit" className="w-full rounded-xl gap-2 font-semibold h-11 shadow-premium pt-1 animate-pulse-slow" disabled={loading}>
              <span>{loading ? "Registering..." : "Create Account"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground select-none">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
