import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  History, 
  ArrowLeft, 
  Clock, 
  RotateCcw, 
  User, 
  Sparkles,
  FileCheck2
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function VersionHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { articles, revisions, rollbackVersion } = useStore();

  const article = articles.find(a => a.id === id);
  const articleRevisions = revisions.filter(r => r.articleId === id);

  const handleRollback = (revId: string, revNum: number) => {
    if (!article) return;
    
    rollbackVersion(article.id, revId);
    toast({
      title: "Revision Restored 🔄",
      description: `Successfully rolled back "${article.title}" to Revision Checkpoint #${revNum}.`,
      variant: "success"
    });
  };

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <History className="h-10 w-10 text-primary mx-auto animate-bounce" />
          <h2 className="font-bold text-foreground">Timeline not found</h2>
          <Button variant="outline" onClick={() => navigate("/app")}>Return to Workspace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
            <History className="h-3 w-3" />
            Chronological Revision timelines
          </span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Version History</h1>
          <p className="text-muted-foreground text-xs">Rollback drafts and track edits across the collaborative workspace.</p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(`/app/editor-tool/${article.id}`)} className="rounded-xl h-9 text-xs font-semibold cursor-pointer self-start">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Exit Timeline</span>
        </Button>
      </div>

      <Card className="border border-border/50 shadow-premium p-4 select-none">
        <div className="flex flex-wrap items-center justify-between gap-4 text-left">
          <div>
            <span className="text-[9px] font-extrabold text-muted-foreground uppercase">currently viewing logs for:</span>
            <h3 className="font-sora font-extrabold text-base text-foreground leading-snug" dangerouslySetInnerHTML={{ __html: article.title }} />
          </div>
          <Badge variant="success">Active Status: {article.status.toUpperCase()}</Badge>
        </div>
      </Card>

      {/* CHRONOLOGICAL TIMELINE CHIPS */}
      <div className="space-y-6 text-left relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        
        {articleRevisions.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10 pl-6 select-none font-semibold">
            No revision logs found. Save this document to compile checkpoints.
          </p>
        ) : (
          articleRevisions.map((rev) => (
            <div key={rev.id} className="relative pl-12 flex items-start gap-4">
              
              {/* Central node bubble */}
              <div className="absolute left-3.5 top-1.5 h-5 w-5 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-sm select-none z-10">
                <div className="h-2 w-2 bg-primary rounded-full" />
              </div>

              {/* Revision visual card */}
              <Card className="flex-1 hover:shadow-premium bg-card/80 border-border/50">
                <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 select-none">
                      <span className="font-sora font-extrabold text-xs text-primary">Revision #{rev.revisionNumber}</span>
                      <span className="text-[10px] text-muted-foreground">• {rev.timestamp}</span>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed font-semibold font-jakarta truncate max-w-sm">
                      {rev.patchSummary}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold select-none">
                      <User className="h-3 w-3" />
                      <span>Committed by {rev.authorName}</span>
                    </div>
                  </div>

                  {/* Rollback button port */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-primary/20 text-primary hover:bg-primary/5 select-none shrink-0 self-end sm:self-center"
                    onClick={() => handleRollback(rev.id, rev.revisionNumber)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Rollback</span>
                  </Button>

                </CardContent>
              </Card>

            </div>
          ))
        )}

      </div>

    </div>
  );
}
