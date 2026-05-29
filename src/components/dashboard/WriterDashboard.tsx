import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  PenTool, 
  FileText, 
  FileClock, 
  Eye, 
  Trash2, 
  Plus, 
  ExternalLink, 
  CheckCircle,
  FileCheck2,
  BookOpen
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function WriterDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { articles, currentUser, createArticle, deleteArticle, submitForReview } = useStore();

  if (!currentUser) return null;

  const myArticles = articles.filter((a) => a.authorId === currentUser.id);

  // Statistics
  const totalDrafts = myArticles.filter(a => a.status === "draft").length;
  const totalPending = myArticles.filter(a => a.status === "pending_review").length;
  const totalPublished = myArticles.filter(a => a.status === "published").length;
  const totalRejected = myArticles.filter(a => a.status === "rejected").length;
  const totalViews = myArticles.filter(a => a.status === "published").reduce((s, a) => s + a.views, 0);
  const totalLikes = myArticles.filter(a => a.status === "published").reduce((s, a) => s + a.likes, 0);

  const handleCreateNew = async () => {
    try {
      // Initialize a beautiful blank template
      const newArt = await createArticle(
        "Untitled Workspace Draft", 
        "Click here to write an interesting subtitle...", 
        "Technology", 
        "",
        "<p>Start typing your collegiate masterpiece here...</p>"
      );
      toast({
        title: "Draft Created",
        description: "A blank document was created. Redirecting to Rich Editor.",
        variant: "success"
      });
      navigate(`/app/editor-tool/${newArt.id}`);
    } catch (err) {
      toast({ title: "Error", description: "Failed to create draft.", variant: "destructive" });
    }
  };

  const handleSubmitReview = async (id: string, title: string) => {
    try {
      await submitForReview(id);
      toast({
        title: "Submitted for Review",
        description: `"${title}" has been successfully pushed to the Editor moderated queue.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Submit Failed",
        description: "Could not submit this draft for review.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string, title: string) => {
    deleteArticle(id);
    toast({
      title: "Draft Removed",
      description: `"${title}" has been deleted from your workspace storage.`,
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Author Central Hub</span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Editor Dashboard</h1>
          <p className="text-muted-foreground text-xs">Create magazines, submit changes for admin approval, and track engagement.</p>
        </div>

        <Button onClick={handleCreateNew} className="rounded-xl gap-2 font-semibold h-10 shadow-premium self-start">
          <Plus className="h-4.5 w-4.5" />
          <span>New Article Draft</span>
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active Workspace Drafts</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{totalDrafts}</h3>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Awaiting Verification</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{totalPending}</h3>
            </div>
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 border border-purple-500/20">
              <FileClock className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Published</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{totalPublished}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rejected</span>
              <h3 className="font-sora text-3xl font-extrabold text-foreground">{totalRejected}</h3>
            </div>
            <div className="h-10 w-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium bg-card border-border/50">
          <CardContent className="pt-6 flex items-center justify-between text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Views / Likes</span>
              <h3 className="font-sora text-xl font-extrabold text-foreground">{totalViews} / {totalLikes}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED DRAFTS TABLE */}
      <Card className="border border-border/50 shadow-premium">
        <CardHeader className="text-left select-none border-b border-border/10 pb-4">
          <CardTitle>My Publications & Drafts</CardTitle>
          <CardDescription>A real-time overview of your collegiate writeups and approvals status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {myArticles.length === 0 ? (
            <div className="text-center py-16 select-none">
              <BookOpen className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3 animate-pulse" />
              <h3 className="font-bold text-foreground">Workspace is empty</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get started by clicking the "New Article Draft" button above to compose your first column!
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                  <th className="p-4">Cover & Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Likes / Shares</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-jakarta">
                {myArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-accent/10 transition-colors">
                    
                    {/* Visual Cover & Title */}
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded overflow-hidden shrink-0 select-none border border-border/40">
                          <img src={art.coverImage} className="h-full w-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground truncate" dangerouslySetInnerHTML={{ __html: art.title }} />
                          <span className="text-[10px] text-muted-foreground mt-0.5">Created {art.createdAt}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 select-none">
                      <Badge variant="outline" className="text-[10px] font-bold">{art.category}</Badge>
                    </td>

                    {/* Status badge */}
                    <td className="p-4 select-none">
                      {art.status === "published" ? (
                        <Badge variant="success">Published</Badge>
                      ) : art.status === "pending_review" ? (
                        <Badge variant="purple">Awaiting Review</Badge>
                      ) : art.status === "rejected" ? (
                        <Badge variant="danger">Rejected</Badge>
                      ) : art.status === "needs_corrections" ? (
                        <Badge variant="danger">Needs Corrections</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </td>

                    {/* Likes Count */}
                    <td className="p-4 text-center select-none font-semibold text-xs">
                      {art.status === "published" ? `${art.views} views · ${art.likes} likes` : "—"}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right select-none">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {art.status === "published" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                            onClick={() => navigate(`/magazine/${art.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Live</span>
                          </Button>
                        )}

                        {(art.status === "rejected" || art.status === "needs_corrections") && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer border-destructive/20 hover:bg-destructive/5 text-destructive animate-pulse"
                              onClick={() => handleSubmitReview(art.id, art.title)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Submit for Approval</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                              onClick={() => navigate(`/app/editor-tool/${art.id}`)}
                            >
                              <PenTool className="h-3.5 w-3.5 text-primary" />
                              <span>Fix & Edit</span>
                            </Button>
                          </>
                        )}

                        {art.status === "draft" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                              onClick={() => handleSubmitReview(art.id, art.title)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Submit for Approval</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                              onClick={() => navigate(`/app/editor-tool/${art.id}`)}
                            >
                              <PenTool className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-rose-500/5 hover:text-rose-500 rounded-md cursor-pointer"
                              onClick={() => handleDelete(art.id, art.title)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}

                        {art.status === "pending_review" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1 rounded-md text-[11px] font-semibold cursor-pointer"
                            onClick={() => navigate(`/app/editor-tool/${art.id}`)}
                          >
                            <PenTool className="h-3.5 w-3.5" />
                            <span>Refine Draft</span>
                          </Button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
