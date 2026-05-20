import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ArrowUpRight,
  TrendingUp,
  Bookmark,
  Users,
  Compass,
  ArrowRight
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MagazineHomepage() {
  const navigate = useNavigate();
  const { articles, users } = useStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  // Categories list
  const categories = ["All", "Technology", "Environment", "Culture", "History"];

  // Filter only published articles for public readers
  const publishedArticles = articles.filter(a => a.status === "published");

  const filteredArticles = publishedArticles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Spotlight issue (first published article acts as current cover)
  const spotlightArticle = publishedArticles[0] || articles[0];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* 1. PUBLIC HEADER */}
      <header className="h-20 px-6 lg:px-16 border-b border-border/40 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-sora font-extrabold tracking-tight text-lg text-foreground">Campus E-Mag</span>
            <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">THE EDITORIAL HUB</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/magazine" className="text-foreground font-bold transition-colors">Magazine Homepage</Link>
          <Link to="/discover" className="hover:text-foreground transition-colors">Search & Discover</Link>
          <Link to="/archive" className="hover:text-foreground transition-colors">Issue Archives</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-semibold" onClick={() => navigate("/login")}>Sign In</Button>
          <Button onClick={() => navigate("/app")} className="rounded-xl font-semibold shadow-premium h-10">
            <span>Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. COVER HIGHLIGHT / SPOTLIGHT BANNER */}
      {spotlightArticle && (
        <section className="px-6 lg:px-16 pt-8 pb-12 bg-gradient-to-b from-accent/20 to-transparent">
          <div className="max-w-6xl mx-auto">
            
            <div className="rounded-2xl border border-border bg-card shadow-hover overflow-hidden flex flex-col lg:flex-row min-h-[460px] glass-card">
              
              {/* Cover Art Visual */}
              <div className="lg:w-3/5 relative h-64 lg:h-auto overflow-hidden">
                <img 
                  src={spotlightArticle.coverImage} 
                  className="h-full w-full object-cover select-none" 
                  alt="Cover item" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 flex items-center gap-3 relative z-10 select-none">
                  <img src={spotlightArticle.authorAvatar} className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-premium" alt="" />
                  <div className="text-white text-left">
                    <span className="font-bold text-xs block">{spotlightArticle.authorName}</span>
                    <span className="text-[10px] text-white/80 block">Featured Contributor</span>
                  </div>
                </div>
              </div>

              {/* Cover Details */}
              <div className="p-8 lg:p-12 flex-1 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 select-none">
                    <Badge variant="purple">{spotlightArticle.category}</Badge>
                    <span className="text-xs text-muted-foreground font-semibold">• {spotlightArticle.readTime}</span>
                  </div>

                  <h1 className="font-sora font-extrabold text-2xl lg:text-4xl text-foreground tracking-tight leading-tight">
                    {spotlightArticle.title}
                  </h1>

                  <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                    {spotlightArticle.subtitle}
                  </p>
                </div>

                <div className="pt-8 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider select-none">VOLUME 12 • ISSUE 4</span>
                  <Button onClick={() => navigate(`/magazine/${spotlightArticle.id}`)} className="rounded-xl gap-2 font-semibold h-11 shadow-premium">
                    <span>Read Immersive Article</span>
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* 3. DYNAMIC SEARCH INDEX & FILTERS */}
      <section className="px-6 lg:px-16 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-6">
            
            {/* Categories pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto py-1 select-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground font-extrabold shadow-sm"
                      : "bg-accent/40 border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search issues, topics..." 
                className="pl-9 h-10 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          {/* DYNAMIC ARTICLE GRIDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Articles List */}
            <div className="lg:col-span-8 space-y-8">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl select-none">
                  <Compass className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3 animate-pulse" />
                  <h3 className="font-bold text-foreground">No publications found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Try clearing filters or search terms. Check back later for fresh college entries.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                  {filteredArticles.map((art) => (
                    <article 
                      key={art.id} 
                      onClick={() => navigate(`/magazine/${art.id}`)}
                      className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col justify-between shadow-premium shadow-hover-card duration-300 cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="relative h-44 overflow-hidden select-none">
                          <img 
                            src={art.coverImage} 
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            alt="" 
                          />
                          <Badge variant="secondary" className="absolute top-3 left-3">{art.category}</Badge>
                        </div>

                        <div className="px-6 space-y-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{art.createdAt} • {art.readTime}</span>
                          <h3 className="font-sora font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                            {art.title}
                          </h3>
                          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                            {art.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 mt-4 border-t border-border/10 flex items-center justify-between select-none">
                        <div className="flex items-center gap-2">
                          <img src={art.authorAvatar} className="h-6.5 w-6.5 rounded-full object-cover border border-border" alt="" />
                          <span className="text-[11px] font-bold">{art.authorName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                          <span>{art.likes} likes</span>
                        </div>
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Side Trending / Archives widget */}
            <div className="lg:col-span-4 space-y-8 text-left select-none">
              
              {/* Trending side card */}
              <div className="rounded-2xl border border-border p-6 bg-card shadow-premium relative overflow-hidden glass-card">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                  <TrendingUp className="h-4.5 w-4.5 text-primary animate-pulse" />
                  <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider">Trending Articles</h3>
                </div>

                <div className="space-y-4">
                  {publishedArticles.slice(0, 3).map((art, idx) => (
                    <div 
                      key={art.id} 
                      onClick={() => navigate(`/magazine/${art.id}`)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <span className="text-2xl font-sora font-extrabold text-primary/30 group-hover:text-primary transition-colors">0{idx + 1}</span>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {art.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{art.authorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Author Highlight card */}
              <div className="rounded-2xl border border-border p-6 bg-card shadow-premium relative overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider">Author Highlights</h3>
                </div>

                <div className="space-y-3.5">
                  {users.slice(1, 4).map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <img src={u.avatar} className="h-8.5 w-8.5 rounded-full object-cover border border-border" alt="" />
                      <div className="text-left flex-1">
                        <span className="font-bold text-xs text-foreground block">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">{u.bio || "Campus contributor"}</span>
                      </div>
                      <Badge variant="purple" className="text-[9px] py-0">{u.publishedCount || 0} posts</Badge>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. PUBLIC FOOTER */}
      <footer className="bg-sidebar text-sidebar-foreground border-t border-border/10 py-12 px-6 lg:px-16 text-muted-foreground select-none mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-sora font-extrabold text-sm text-white">Campus E-Magazine Suite</span>
          </div>

          <p className="text-xs text-center md:text-right">
            © {new Date().getFullYear()} Campus E-Magazine. Crafted with Next-level aesthetics, clean architecture, and pure performance.
          </p>
        </div>
      </footer>

    </div>
  );
}
