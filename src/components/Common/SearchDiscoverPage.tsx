import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Search, Compass, Sparkles, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SearchDiscoverPage() {
  const navigate = useNavigate();
  const { articles } = useStore();

  const [query, setQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState("All");

  const tags = ["All", "Technology", "Culture", "Environment", "History", "Campus Life", "Opinion"];

  const published = articles.filter(a => a.status === "published");

  const results = published.filter((art) => {
    const matchQ = art.title.toLowerCase().includes(query.toLowerCase()) || 
                   art.subtitle.toLowerCase().includes(query.toLowerCase()) ||
                   art.category.toLowerCase().includes(query.toLowerCase());
    const matchTag = selectedTag === "All" || art.category === selectedTag;
    return matchQ && matchTag;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      <header className="h-20 px-6 lg:px-16 border-b border-border/40 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-sora font-extrabold text-lg text-foreground">Campus E-Mag</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground select-none">
          <Link to="/magazine" className="hover:text-foreground transition-colors">Magazine Homepage</Link>
          <Link to="/discover" className="text-foreground font-bold transition-colors">Search & Discover</Link>
          <Link to="/archive" className="hover:text-foreground transition-colors">Issue Archives</Link>
        </nav>

        <Button variant="outline" className="rounded-xl h-9" onClick={() => navigate("/magazine")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Exit Search</span>
        </Button>
      </header>

      <section className="px-6 lg:px-16 py-12 flex-1">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-left space-y-3">
            <Badge variant="purple" className="select-none">Discover Campus Journalisms</Badge>
            <h1 className="font-sora font-extrabold text-3xl sm:text-5xl text-foreground tracking-tight text-glow">
              Explore the Archives
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              Search by titles, keywords, authors, or categories to unlock student reporting, opinions, essays, and campus reports.
            </p>
          </div>

          {/* Search Box & Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search articles by title, keywords, authors..." 
                className="pl-11 h-12 rounded-xl text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" className="h-12 rounded-xl gap-2 font-semibold shadow-premium select-none">
              <SlidersHorizontal className="h-4.5 w-4.5" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Tags Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 select-none border-b border-border/60 pb-6">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`h-8 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground font-extrabold shadow-sm"
                    : "bg-accent/40 border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Detailed results */}
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-bold select-none uppercase tracking-wider">
              <span>Search Results ({results.length})</span>
              <span>Sorted by Recency</span>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-2xl select-none">
                <Compass className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3 animate-pulse" />
                <h3 className="font-bold text-foreground">No matches found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Try typing a different keyword or checking other trending category badges above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((art) => (
                  <Card 
                    key={art.id} 
                    onClick={() => navigate(`/magazine/${art.id}`)}
                    className="hover:shadow-hover bg-card/60 transition-all border-border/50 cursor-pointer overflow-hidden group"
                  >
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                      <div className="sm:w-1/4 h-32 rounded-lg overflow-hidden select-none">
                        <img src={art.coverImage} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 select-none">
                            <Badge variant="outline" className="text-[10px] py-0">{art.category}</Badge>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">{art.createdAt}</span>
                          </div>
                          <h3 className="font-sora font-extrabold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                            {art.title}
                          </h3>
                          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                            {art.subtitle}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between select-none">
                          <div className="flex items-center gap-2">
                            <img src={art.authorAvatar} className="h-6 w-6 rounded-full object-cover border border-border" alt="" />
                            <span className="text-[11px] font-bold">{art.authorName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{art.readTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
