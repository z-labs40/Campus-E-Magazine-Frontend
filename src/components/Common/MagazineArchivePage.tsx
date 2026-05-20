import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, FolderArchive, ArrowLeft, Download, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MagazineArchivePage() {
  const navigate = useNavigate();

  // Simulated Archived Volume catalogs
  const archiveVolumes = [
    {
      vol: "Volume 12",
      season: "Spring 2026",
      desc: "Features structural reports regarding Artificial Intelligence classroom frameworks and ecological wild growth proposals.",
      cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400",
      totalIssues: 6
    },
    {
      vol: "Volume 11",
      season: "Fall 2025",
      desc: "Explores post-pandemic housing layouts, campus infrastructure budgets, and student mental wellness reporting.",
      cover: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400",
      totalIssues: 8
    },
    {
      vol: "Volume 10",
      season: "Spring 2025",
      desc: "Special centennial issue tracing 100 years of campus activism, historic quad arches, and speech rights history.",
      cover: "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&q=80&w=400",
      totalIssues: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      <header className="h-20 px-6 lg:px-16 border-b border-border/40 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-sora font-extrabold text-lg text-foreground">Campus E-Mag</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground select-none">
          <Link to="/magazine" className="hover:text-foreground transition-colors">Magazine Homepage</Link>
          <Link to="/discover" className="hover:text-foreground transition-colors">Search & Discover</Link>
          <Link to="/archive" className="text-foreground font-bold transition-colors">Issue Archives</Link>
        </nav>

        <Button variant="outline" className="rounded-xl h-9" onClick={() => navigate("/magazine")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Exit Archives</span>
        </Button>
      </header>

      <section className="px-6 lg:px-16 py-12 flex-1 grid-bg-editorial">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-left space-y-3">
            <Badge variant="purple" className="select-none">Historical Collections</Badge>
            <h1 className="font-sora font-extrabold text-3xl sm:text-5xl text-foreground tracking-tight text-glow">
              Issue Archives
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              Browse previous quarterly catalogs, printable newsletters, and student volumes from past scholastic years.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {archiveVolumes.map((vol) => (
              <Card 
                key={vol.vol} 
                className="hover:shadow-hover bg-card/60 transition-all border-border/50 overflow-hidden flex flex-col justify-between group cursor-pointer"
                onClick={() => navigate("/magazine")}
              >
                <div className="space-y-4">
                  <div className="relative h-48 overflow-hidden select-none">
                    <img src={vol.cover} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                    <div className="absolute inset-0 bg-black/20" />
                    <Badge variant="purple" className="absolute top-3 left-3">{vol.season}</Badge>
                  </div>

                  <div className="px-5 space-y-2 text-left">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{vol.vol}</span>
                    <h3 className="font-sora font-extrabold text-lg text-foreground leading-snug group-hover:text-primary transition-colors">
                      {vol.vol} Issue Catalog
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {vol.desc}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 mt-6 border-t border-border/10 flex items-center justify-between select-none">
                  <span className="text-[10px] text-muted-foreground font-bold">{vol.totalIssues} Articles</span>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/5 rounded-lg">
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </Button>
                </div>

              </Card>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
