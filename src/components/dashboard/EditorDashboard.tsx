import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileClock, 
  BookOpen, 
  CheckSquare, 
  XSquare, 
  PenTool, 
  Calendar, 
  Clock, 
  Sparkles,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useStore, SuggestionStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function EditorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    articles, 
    suggestions, 
    resolveSuggestion, 
    publishArticle,
    currentUser 
  } = useStore();

  // Filter articles submitted for editorial moderation
  const pendingArticles = articles.filter(a => a.status === "pending_review");
  const activeSuggestions = suggestions.filter(s => s.status === "pending");

  const handlePublish = async (id: string, title: string) => {
    try {
      await publishArticle(id);
      toast({
        title: "Article Published 🎉",
        description: `"${title}" has been launched live in the public magazine homepage!`,
        variant: "success"
      });
    } catch (err: any) {
      toast({ title: "Publish Failed", description: err?.message || "Failed to publish article.", variant: "destructive" });
    }
  };

  const handleResolveSuggestion = async (id: string, status: SuggestionStatus, commentTitle: string) => {
    try {
      await resolveSuggestion(id, status, `Moderated by senior editor ${currentUser?.name || "Marcus"}`);
      toast({
        title: status === "approved" ? "Suggestion Accepted ✅" : "Suggestion Declined ❌",
        description: `Edit suggestion for "${commentTitle}" has been resolved.`,
        variant: status === "approved" ? "success" : "destructive"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to resolve suggestion", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Senior Editorial Console</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Editor Dashboard</h1>
        <p className="text-muted-foreground text-xs">Verify pending drafts, moderate text replacements, and manage active issues.</p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 select-none">
        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Articles Awaiting Review</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{pendingArticles.length}</h3>
            </div>
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 border border-purple-500/20">
              <FileClock className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pending Text Revisions</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{activeSuggestions.length}</h3>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
              <PenTool className="h-5 w-5 animate-float-slow" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 1. DRAFTS AWAITING MODERATION SECTION */}
      <Card className="border border-border/50 shadow-premium text-left">
        <CardHeader className="select-none border-b border-border/10 pb-4">
          <CardTitle>Articles Awaiting Verification</CardTitle>
          <CardDescription>Review raw drafts, coordinate rollback points, and launch articles to readers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {pendingArticles.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10 select-none font-semibold">
              No drafts awaiting review. Outstanding job keeping the queue clear!
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                  <th className="p-4">Article Title</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-jakarta">
                {pendingArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-accent/10 transition-colors">
                    
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground" dangerouslySetInnerHTML={{ __html: art.title }} />
                        <span className="text-[10px] text-muted-foreground mt-0.5">Submitted {art.createdAt}</span>
                      </div>
                    </td>

                    <td className="p-4 select-none">
                      <div className="flex items-center gap-2">
                        <img src={art.authorAvatar} className="h-6 w-6 rounded-full object-cover" alt="" />
                        <span className="font-semibold text-xs">{art.authorName}</span>
                      </div>
                    </td>

                    <td className="p-4 select-none">
                      <Badge variant="outline" className="text-[10px] font-bold">{art.category}</Badge>
                    </td>

                    <td className="p-4 text-right select-none">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                          onClick={() => navigate(`/app/suggestion-review/${art.id}`)}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Review Diffs</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                          onClick={() => navigate(`/app/editor-tool/${art.id}`)}
                        >
                          <PenTool className="h-3.5 w-3.5" />
                          <span>Direct Edit</span>
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer shadow-premium"
                          onClick={() => handlePublish(art.id, art.title)}
                        >
                          <span>Publish Article</span>
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 2. PENDING REVISIONS LIST */}
      <Card className="border border-border/50 shadow-premium text-left">
        <CardHeader className="select-none border-b border-border/10 pb-4">
          <CardTitle>Active Text Revisions Queue</CardTitle>
          <CardDescription>Collaborators raised these suggestions on live articles. Approve to auto-inject corrections.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {activeSuggestions.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6 select-none font-semibold">
              No pending text revision items found in the queue.
            </p>
          ) : (
            <div className="space-y-4">
              {activeSuggestions.map((sug) => (
                <div key={sug.id} className="p-5 rounded-xl border border-border bg-card shadow-premium space-y-4">
                  
                  {/* Suggestion Info Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 select-none border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Revision on:</span>
                      <span className="font-extrabold text-xs text-primary">{sug.articleTitle}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <span className="text-[10px] text-muted-foreground">{sug.timestamp}</span>
                      <Badge variant="purple" className="text-[9px] uppercase">{sug.category}</Badge>
                    </div>
                  </div>

                  {/* Suggestion comparison boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-jakarta">
                    <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                      <span className="block font-bold text-rose-600 mb-1 select-none">Original Phrase:</span>
                      <p className="italic text-muted-foreground leading-relaxed line-clamp-3">
                        "{sug.originalText}"
                      </p>
                    </div>
                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <span className="block font-bold text-emerald-600 mb-1 select-none">Suggested replacement:</span>
                      <p className="font-semibold text-foreground leading-relaxed line-clamp-3">
                        "{sug.suggestedText}"
                      </p>
                    </div>
                  </div>

                  {/* Suggestion Author note */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-bold select-none">Recommended by:</span>
                      <Badge variant="secondary" className="capitalize text-[10px] font-bold">{sug.authorName} ({sug.authorRole})</Badge>
                      <span className="text-xs italic text-muted-foreground font-jakarta ml-2">"{sug.comment}"</span>
                    </div>

                    <div className="flex items-center gap-2 select-none shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-600"
                        onClick={() => handleResolveSuggestion(sug.id, "rejected", sug.articleTitle)}
                      >
                        <XSquare className="h-4 w-4" />
                        <span>Decline</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600"
                        onClick={() => handleResolveSuggestion(sug.id, "approved", sug.articleTitle)}
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>Accept & Inject</span>
                      </Button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
