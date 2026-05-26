import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowLeft, CheckCircle, XCircle, PenTool, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ContentDiffReview from "./ContentDiffReview";

export default function AdminArticleReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rejectReason, setRejectReason] = React.useState("");
  const [showReject, setShowReject] = React.useState(false);
  const [article, setArticle] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/magazines/${id}`);
        setArticle(res.data.data);
      } catch (err) {
        console.error("Failed to fetch article", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Article not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/admin/pending")}>
          Back to queue
        </Button>
      </div>
    );
  }

  const beforeTitle = article.title;
  const beforeSubtitle = article.subtitle || "";
  const beforeContent = article.content || "";
  const afterTitle = article.title;
  const afterSubtitle = article.subtitle || "";
  const afterContent = article.content || "";

  const handleApprove = async () => {
    try {
      await api.patch(`/admin/publish/${article.id}`);
      toast({
        title: "Approved & Published",
        description: `"${afterTitle}" is now live on the public magazine.`,
        variant: "success",
      });
      navigate("/app/admin/pending");
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.response?.data?.error || "Could not publish draft.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a rejection reason for the author.", variant: "destructive" });
      return;
    }
    try {
      await api.patch(`/admin/reject-draft/${article.id}`, { reason: rejectReason.trim() });
      toast({
        title: "Changes Rejected",
        description: "The author has been notified with your feedback.",
        variant: "destructive",
      });
      navigate("/app/admin/pending");
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.response?.data?.error || "Could not reject draft.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 pt-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <Button variant="ghost" size="sm" className="h-8 -ml-2 mb-2" onClick={() => navigate("/app/admin/pending")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Pending queue
          </Button>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Editorial Review</span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">{afterTitle}</h1>
          <p className="text-muted-foreground text-xs">
            Submitted by {article.createdBy?.name || "Author"}
            {article.createdAt ? ` · ${new Date(article.createdAt).toLocaleString()}` : ""}
          </p>
        </div>
        <Badge variant="purple">Pending Review</Badge>
      </div>

      <ContentDiffReview
        beforeTitle={beforeTitle}
        afterTitle={afterTitle}
        beforeSubtitle={beforeSubtitle}
        afterSubtitle={afterSubtitle}
        beforeContent={beforeContent}
        afterContent={afterContent}
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Moderation Actions</CardTitle>
          <CardDescription>Approve to publish live, or reject with feedback for the editor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4" />
              Approve & Publish
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/app/editor-tool/${article.id}`)}>
              <PenTool className="h-4 w-4" />
              Open Full Editor
            </Button>
            <Button variant="outline" className="gap-2 border-destructive/30 text-destructive" onClick={() => setShowReject(!showReject)}>
              <XCircle className="h-4 w-4" />
              Reject Changes
            </Button>
          </div>

          {showReject && (
            <div className="space-y-3 pt-2 border-t border-border/10">
              <label className="text-xs font-bold uppercase text-muted-foreground">Rejection reason (sent to author)</label>
              <Textarea
                placeholder='e.g. "Please improve grammar in paragraph 2."'
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[80px]"
              />
              <Button variant="destructive" size="sm" onClick={handleReject}>
                Confirm Rejection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
