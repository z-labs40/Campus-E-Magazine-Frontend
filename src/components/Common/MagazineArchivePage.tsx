import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, FolderArchive, ArrowLeft, Download, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export default function MagazineArchivePage() {
  const navigate = useNavigate();
  const { articles } = useStore();

  const published = articles.filter((a) => a.status === "published");

  const archiveVolumes = React.useMemo(() => {
    const byYear = new Map<string, typeof published>();
    for (const art of published) {
      const year = art.createdAt?.match(/\d{4}/)?.[0] || "Archive";
      const key = year;
      if (!byYear.has(key)) byYear.set(key, []);
      byYear.get(key)!.push(art);
    }
    return Array.from(byYear.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, issues], idx) => ({
        vol: `Volume ${byYear.size - idx}`,
        season: year,
        desc: `${issues.length} published issue${issues.length === 1 ? "" : "s"} from the campus magazine.`,
        cover: issues[0]?.coverImage,
        totalIssues: issues.length,
        firstId: issues[0]?.id,
      }));
  }, [published]);

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

          {archiveVolumes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              No published archives yet. Check back after the first issue goes live.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {archiveVolumes.map((vol) => (
                <Card 
                  key={vol.vol} 
                  className="hover:shadow-hover bg-card/60 transition-all border-border/50 overflow-hidden flex flex-col justify-between group cursor-pointer"
                  onClick={() => navigate(vol.firstId ? `/magazine/${vol.firstId}` : "/magazine")}
                >
                  <div className="space-y-4">
                    <div className="relative h-48 overflow-hidden select-none">
                      <img src={vol.cover} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-white" />
                        <span className="text-white text-xs font-bold">{vol.vol}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[9px]">{vol.season}</Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold">{vol.totalIssues} issues</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{vol.desc}</p>
                    </CardContent>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 flex-1">
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 flex-1">
                      <Bookmark className="h-3 w-3" /> Save
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 flex-1">
                      <Sparkles className="h-3 w-3" /> Read
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
