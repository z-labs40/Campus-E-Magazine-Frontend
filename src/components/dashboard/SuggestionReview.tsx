import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  FileCheck2, 
  Sparkles, 
  ArrowLeft, 
  ThumbsUp, 
  Check, 
  X,
  Clock,
  Layers
} from "lucide-react";
import { useStore, SuggestionStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SuggestionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    articles, 
    suggestions, 
    resolveSuggestion,
    currentUser
  } = useStore();

  // If no specific article ID is provided, look for the first article with pending suggestions
  const pendingSugs = suggestions.filter(s => s.status === "pending");
  const targetArticleId = id || pendingSugs[0]?.articleId || articles[0]?.id;

  const article = articles.find(a => a.id === targetArticleId);
  const articleSuggestions = suggestions.filter(s => s.articleId === targetArticleId && s.status === "pending");

  const handleResolve = (sugId: string, status: SuggestionStatus) => {
    resolveSuggestion(sugId, status, `Moderated by ${currentUser?.name || "Marcus Thorne"}`);
    toast({
      title: status === "approved" ? "Suggestion Accepted ✅" : "Suggestion Declined ❌",
      description: `The recommended change has been successfully ${status} and applied.`,
      variant: status === "approved" ? "success" : "destructive"
    });
  };

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
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=80" className="h-6 w-6 rounded-full object-cover" alt="" />
                        <span className="font-bold text-xs">{sug.authorName}</span>
                        <Badge variant="purple" className="text-[9px] uppercase">{sug.category}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{sug.timestamp}</span>
                    </div>

                    {/* Comparatives side by side diff cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-jakarta">
                      
                      {/* Left: Original red block */}
                      <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-rose-600 select-none">Original text</span>
                        <p className="line-through text-muted-foreground leading-relaxed italic">
                          "{sug.originalText}"
                        </p>
                      </div>

                      {/* Right: Suggested green block */}
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-emerald-600 select-none">Suggested replacement</span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          "{sug.suggestedText}"
                        </p>
                      </div>

                    </div>

                    {/* Editorial note description */}
                    <div className="p-3 bg-accent/40 rounded-lg text-xs italic text-muted-foreground border border-border/30">
                      <span className="block font-bold text-[10px] text-foreground uppercase tracking-wider mb-1 select-none">Explanation Note</span>
                      "{sug.comment}"
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
        </div>

        {/* RIGHT COLUMN: SELECT OTHER STORIES */}
        <div className="lg:col-span-4 space-y-6 select-none">
          <Card className="p-6 text-left">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
              <Layers className="h-4.5 w-4.5 text-primary" />
              <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider">Publications Catalog</h3>
            </div>

            <div className="space-y-3">
              {articles.map((art) => {
                const sugsCount = suggestions.filter(s => s.articleId === art.id && s.status === "pending").length;
                return (
                  <div 
                    key={art.id} 
                    onClick={() => navigate(`/app/suggestion-review/${art.id}`)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      art.id === targetArticleId 
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
                    {sugsCount > 0 && (
                      <Badge variant="purple" className="shrink-0 font-extrabold text-[10px] ml-2">
                        {sugsCount}
                      </Badge>
                    )}
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
