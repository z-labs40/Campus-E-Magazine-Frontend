import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  FileCheck2, 
  Sparkles, 
  ArrowLeft, 
  ThumbsUp, 
  Check, 
  X,
  Clock,
  Layers,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SuggestionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [article, setArticle] = React.useState<any>(null);
  const [articleSuggestions, setArticleSuggestions] = React.useState<any[]>([]);
  const [allArticles, setAllArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all magazines for the right sidebar
        const magsRes = await api.get("/magazines");
        setAllArticles(magsRes.data.data || []);

        if (id) {
          // Fetch specific edition and suggestions
          const sugRes = await api.get(`/admin/suggestions/${id}`);
          if (sugRes.data.data) {
            setArticle(sugRes.data.data.edition);
            setArticleSuggestions(sugRes.data.data.suggestions || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch suggestion data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleResolve = async (sugId: string, status: "approved" | "rejected") => {
    try {
      if (status === "approved") {
        await api.post(`/admin/merge/${id}`, { suggestionIds: [sugId] });
      } else {
        await api.post(`/admin/reject/${id}`, { suggestionIds: [sugId] });
      }
      
      // Remove resolved suggestion from local state
      setArticleSuggestions(prev => prev.filter(s => s.id !== sugId));

      toast({
        title: status === "approved" ? "Suggestion Accepted ✅" : "Suggestion Declined ❌",
        description: `The recommended change has been successfully ${status} and applied.`,
        variant: status === "approved" ? "success" : "destructive"
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.response?.data?.error || "Could not resolve suggestion",
        variant: "destructive"
      });
    }
  };

  const computeOriginalText = (htmlContent: string, range: any) => {
    // A simplified extraction from the full HTML content.
    // In a real robust implementation, we'd parse the HTML and slice by character offsets.
    if (!htmlContent || !range) return "Unable to extract original text.";
    const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
    return plainText.substring(range.start, range.end) || "Unable to extract original text.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <BookOpen className="h-10 w-10 text-primary mx-auto animate-bounce" />
          <h2 className="font-bold text-foreground">No suggestions found</h2>
          <Button variant="outline" onClick={() => navigate("/app/editor")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Google Docs-style Side-by-Side Review
          </span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Review Suggestions</h1>
          <p className="text-muted-foreground text-xs">Compare recommended replacements and merge revisions with one-click.</p>
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl cursor-pointer self-start" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* LEFT COLUMN: PENDING SUGGESTIONS FOR THIS ARTICLE */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 relative">
            <div className="border-b border-border/50 pb-4 mb-6 select-none flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Active story targeted</span>
                <span className="font-sora font-extrabold text-base text-foreground">{article.title}</span>
              </div>
              <Badge variant="purple">{articleSuggestions.length} Pending</Badge>
            </div>

            {articleSuggestions.length === 0 ? (
              <div className="text-center py-16 select-none">
                <FileCheck2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 animate-bounce" />
                <h3 className="font-bold text-foreground">Revisions completed</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  There are no pending edits for this article. All suggestions have been merged or declined.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {articleSuggestions.map((sug) => (
                  <div key={sug.id} className="p-5 rounded-xl border border-border bg-card shadow-premium space-y-4">
                    
                    {/* Visual metadata header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3 select-none">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(sug.contributor || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs">{sug.contributor}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(sug.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Comparatives side by side diff cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-jakarta">
                      
                      {/* Left: Original red block */}
                      <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-rose-600 select-none">Original text target</span>
                        <p className="line-through text-muted-foreground leading-relaxed italic">
                          "{computeOriginalText(article.content, sug.range)}"
                        </p>
                      </div>

                      {/* Right: Suggested green block */}
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-emerald-600 select-none">Suggested replacement</span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          "{sug.suggestion}"
                        </p>
                      </div>

                    </div>

                    {/* Editorial note description */}
                    <div className="p-3 bg-accent/40 rounded-lg text-xs italic text-muted-foreground border border-border/30">
                      <span className="block font-bold text-[10px] text-foreground uppercase tracking-wider mb-1 select-none">Explanation Note</span>
                      "Please review and merge if appropriate."
                    </div>

                    {/* Actions button port */}
                    <div className="flex justify-end gap-2 pt-2 select-none">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 rounded-lg text-xs font-semibold cursor-pointer border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-600"
                        onClick={() => handleResolve(sug.id, "rejected")}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline Suggestion</span>
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 gap-1 rounded-lg text-xs font-semibold cursor-pointer shadow-premium"
                        onClick={() => handleResolve(sug.id, "approved")}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept & Merge</span>
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Removed Mock Collaboration History Block */}
        </div>

        {/* RIGHT COLUMN: SELECT OTHER STORIES */}
        <div className="lg:col-span-4 space-y-6 select-none">
          <Card className="p-6 text-left">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
              <Layers className="h-4.5 w-4.5 text-primary" />
              <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider">Publications Catalog</h3>
            </div>

            <div className="space-y-3">
              {allArticles.map((art) => {
                return (
                  <div 
                    key={art.id} 
                    onClick={() => navigate(`/app/admin/suggestions/${art.id}`)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      art.id === id 
                        ? "bg-primary/5 border-primary/30" 
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                        {art.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">{art.status} status</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
