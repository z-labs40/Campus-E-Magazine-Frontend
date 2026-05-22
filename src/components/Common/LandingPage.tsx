import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { 
  BookOpen, 
  ArrowRight, 
  PenTool, 
  FileCheck, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  CheckCircle,
  Users,
  Code,
  Layers,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/modal";

export default function LandingPage() {
  const navigate = useNavigate();
  const { articles, currentUser, users } = useStore();
  const [showGateModal, setShowGateModal] = React.useState(false);

  const publishedMagazines = articles
    .filter(a => a.status === "published")
    .sort((a, b) => b.likes - a.likes);

  const isLoggedIn = !!currentUser;
  const visibleMagazines = isLoggedIn ? publishedMagazines : publishedMagazines.slice(0, 6);

  // Simulated live typing and cursors
  const [typedText, setTypedText] = React.useState("Artificial Intelligence is reshaping how ");
  const textOptions = [
    "Artificial Intelligence is reshaping how classrooms operate.",
    "Artificial Intelligence is reshaping how we write codes.",
    "Artificial Intelligence is reshaping how college magazines publish."
  ];
  const [optionIdx, setOptionIdx] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(typedText.length);

  React.useEffect(() => {
    const target = textOptions[optionIdx];
    let interval: NodeJS.Timeout;
    
    if (charIdx < target.length) {
      interval = setTimeout(() => {
        setTypedText(prev => prev + target.charAt(charIdx));
        setCharIdx(prev => prev + 1);
      }, 70);
    } else {
      interval = setTimeout(() => {
        setOptionIdx(prev => (prev + 1) % textOptions.length);
        setTypedText("");
        setCharIdx(0);
      }, 3500);
    }
    return () => clearTimeout(interval);
  }, [charIdx, optionIdx]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      
      {/* 1. PREMIUM HEADER */}
      <header className="h-20 px-6 lg:px-16 border-b border-border/40 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-sora font-extrabold tracking-tight text-lg text-foreground">Campus E-Mag</span>
            <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">THE EDITORIAL PLATFORM</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/magazine" className="hover:text-foreground transition-colors">Magazine Issues</Link>
          <Link to="/discover" className="hover:text-foreground transition-colors">Discover Articles</Link>
          <Link to="/archive" className="hover:text-foreground transition-colors">Archive</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Button onClick={() => navigate("/app")} className="rounded-xl gap-2 font-semibold h-10 shadow-premium">
            <span>Access Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative py-16 lg:py-24 px-6 lg:px-16 grid-bg-editorial flex flex-col items-center justify-center text-center border-b border-border/40 overflow-hidden">
        
        {/* Subtle glow elements */}
        <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl space-y-8 relative z-10">
          <Badge variant="purple" className="py-1 px-4 gap-1.5 shadow-premium text-xs rounded-full font-semibold animate-pulse select-none">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Collegiate Editorial System v2.0</span>
          </Badge>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sora font-extrabold tracking-tight text-foreground leading-[1.05] text-glow">
            Where Student Words <br />
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Meet Elite Synthesis</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            A premium, fully responsive college e-magazine CMS designed for immersive reading and seamless collaborative publishing. Highlight text to suggest edits, review changes in real-time, and manage archives with elegant simplicity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/magazine")} className="rounded-xl gap-2 text-base font-semibold shadow-premium h-12 px-8">
              <span>Read Latest Issues</span>
              <BookOpen className="h-4.5 w-4.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/app")} className="rounded-xl gap-2 text-base font-semibold shadow-premium h-12 px-8">
              <span>Collaborate Now</span>
              <PenTool className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        {/* 3. HERO FLOATING CMS COLLABORATIVE INTERACTION SIMULATOR */}
        <div className="w-full max-w-5xl mt-16 relative z-10 px-4">
          <div className="rounded-2xl border border-border bg-card shadow-hover p-1.5 md:p-3 overflow-hidden glass-card">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4 px-3">
              <div className="flex items-center gap-2 select-none">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground font-semibold ml-2 font-jakarta">collaborative-editor.workspace</span>
              </div>
              <Badge variant="success">Active Live Preview</Badge>
            </div>

            {/* Simulated Editor Window */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              {/* Writer Typing Console */}
              <div className="md:col-span-2 bg-background rounded-xl p-6 border border-border relative overflow-hidden min-h-[220px]">
                <div className="absolute top-2 right-3 flex items-center gap-1.5 select-none">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-bold text-muted-foreground">Aria (Writer) typing...</span>
                </div>
                <h3 className="font-sora font-semibold text-lg text-foreground mb-4">The Campus AI Revolution</h3>
                <div className="text-muted-foreground text-sm space-y-4 font-jakarta leading-relaxed">
                  <p>
                    {typedText}
                    <span className="w-2 h-4 bg-primary inline-block animate-pulse ml-0.5" />
                  </p>
                  <p className="opacity-40">
                    Students use generative assistants to synthesize preliminary boilerplates, freeing up hours to explore core algorithms...
                  </p>
                </div>

                {/* Simulated Moving Cursors */}
                <div className="absolute top-1/2 left-1/3 flex flex-col pointer-events-none select-none animate-float-slow">
                  <div className="flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-premium">
                    <span>Aria Chen</span>
                  </div>
                </div>
              </div>

              {/* Editor Side Review Comment */}
              <div className="bg-background rounded-xl p-5 border border-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-2 right-3 select-none">
                  <Badge variant="purple" className="text-[9px] uppercase">Editor Note</Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
                      className="h-8 w-8 rounded-full object-cover border border-border" 
                      alt="" 
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-xs">Marcus Thorne</span>
                      <span className="text-[9px] text-muted-foreground">Senior Editor</span>
                    </div>
                  </div>

                  <div className="bg-accent/40 rounded-lg p-3 text-xs leading-relaxed border border-border/30">
                    <span className="font-semibold block text-primary mb-1">Suggested Rephrase:</span>
                    Replace <span className="line-through text-rose-500">classrooms operate</span> with <span className="text-emerald-500 font-semibold">pedagogy evolves</span>.
                    <span className="block text-[10px] text-muted-foreground mt-2">"Provides a more modern academic feel."</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button variant="default" size="sm" className="w-full text-xs font-semibold rounded-lg">Approve Edit</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-lg">Reply</Button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 4. WORKFLOW / FEATURE GRID */}
      <section className="py-20 px-6 lg:px-16 border-b border-border/40 bg-accent/10">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-sora font-extrabold text-3xl sm:text-5xl text-foreground">A Complete Publishing Workflow</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Say goodbye to boring templates. Experience a publishing cycle modeled on elite product systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <Card className="shadow-premium shadow-hover-card bg-card/60 border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                  <PenTool className="h-5 w-5" />
                </div>
                <h3 className="font-sora font-bold text-lg">Slash-Command Editor</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Fast writing flow with markdown shortcuts and an intuitive slash menu (`/`) that builds code blocks, lists, and quotes seamlessly.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-premium shadow-hover-card bg-card/60 border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 border border-purple-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-sora font-bold text-lg">Inline Suggestions</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Double-click or highlight any paragraph while reading to suggest a quick replacement. It acts exactly like Google Docs suggestion mode.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-premium shadow-hover-card bg-card/60 border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-sora font-bold text-lg">Revision Timelines</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Track every merge, rollback drafts, and compare old vs new changes visually with a comprehensive side-by-side patch logger.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* 5. EDITORIAL SNEAK-PEEK (FEATURED MAGAZINE CARDS) */}
      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2 text-left">
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Active Publications</span>
              <h2 className="font-sora font-extrabold text-3xl sm:text-4xl text-foreground">Featured Campus Articles</h2>
            </div>
            <Button variant="outline" className="gap-2 rounded-xl shadow-premium h-10" onClick={() => navigate("/magazine")}>
              <span>Enter Magazine Hub</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleMagazines.map((art) => (
              <div 
                key={art.id} 
                className="group rounded-2xl overflow-hidden border border-border bg-card shadow-premium hover:shadow-hover transition-all duration-300 flex flex-col sm:flex-row cursor-pointer text-left" 
                onClick={() => navigate(`/magazine/${art.id}`)}
              >
                <div className="relative sm:w-2/5 h-48 sm:h-auto overflow-hidden select-none shrink-0 border-r border-border/10">
                  <img 
                    src={art.coverImage} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    alt="" 
                  />
                  <Badge className="absolute top-3 left-3" variant="purple">{art.category}</Badge>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {art.createdAt} • {art.likes} 👍 likes
                    </span>
                    <h3 className="font-sora font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                      {art.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-4 select-none">
                    <img src={art.authorAvatar} className="h-6 w-6 rounded-full object-cover border border-border" alt="" />
                    <span className="text-[11px] font-bold">{art.authorName}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Gating Lock Panel */}
            {!isLoggedIn && publishedMagazines.length > 6 && (
              <div className="col-span-1 md:col-span-2 p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-4 shadow-premium relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 pointer-events-none" />
                <div className="max-w-md mx-auto space-y-2 relative z-10">
                  <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse" />
                  <h3 className="font-sora font-extrabold text-xl text-foreground">Unlock Complete Campus Archives</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    You are viewing our featured highlights. Join {users.length * 14 + 120}+ campus readers to read more than {publishedMagazines.length} active issues, leave comments, and contribute edits!
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <Button size="sm" onClick={() => navigate("/register")} className="rounded-xl shadow-premium">Register Account</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowGateModal(true)} className="rounded-xl">Sign In</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. STATIC PRODUCTIVITY METRICS */}
      <section className="py-16 bg-sidebar text-sidebar-foreground border-b border-border/10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center select-none">
          <div className="space-y-1">
            <span className="font-sora text-3xl sm:text-4xl font-extrabold text-white">4,200+</span>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Monthly Readers</p>
          </div>
          <div className="space-y-1">
            <span className="font-sora text-3xl sm:text-4xl font-extrabold text-white">124</span>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Active Contributors</p>
          </div>
          <div className="space-y-1">
            <span className="font-sora text-3xl sm:text-4xl font-extrabold text-white">98.2%</span>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Suggestion Resolve Rate</p>
          </div>
          <div className="space-y-1">
            <span className="font-sora text-3xl sm:text-4xl font-extrabold text-white">12 Vol</span>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Archived Publications</p>
          </div>
        </div>
      </section>

      {/* 7. PREMIUM FOOTER */}
      <footer className="bg-background border-t border-border/40 py-12 px-6 lg:px-16 text-muted-foreground select-none mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-sora font-extrabold text-sm text-foreground">Campus E-Mag Platform</span>
          </div>

          <p className="text-xs text-center md:text-right">
            © {new Date().getFullYear()} Campus E-Magazine. Crafted with Next-level aesthetics, clean architecture, and pure performance.
          </p>
        </div>
      </footer>

      {/* 8. AUTHENTICATION SHIELD GATE MODAL */}
      <Dialog open={showGateModal} onOpenChange={setShowGateModal}>
        <DialogContent className="max-w-sm p-6 bg-card border-border shadow-premium rounded-2xl glass-card">
          <DialogHeader className="text-left space-y-2 select-none">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Members-Only Archive Vault</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              To browse all e-magazine issues beyond the first 6 articles, please join the campus network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 select-none">
            <Button className="w-full rounded-xl font-semibold h-11" onClick={() => { setShowGateModal(false); navigate("/register"); }}>
              Create a Free Account
            </Button>
            <Button variant="outline" className="w-full rounded-xl font-semibold h-11" onClick={() => { setShowGateModal(false); navigate("/login"); }}>
              Sign In with Campus Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
