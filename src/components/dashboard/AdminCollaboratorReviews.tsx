import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileEdit, Loader2 } from "lucide-react";

export default function AdminCollaboratorReviews() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pendingCollaborators, setPendingCollaborators] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/pending");
        const editions = res.data.data || [];
        // Only show editions that have pending suggestions
        setPendingCollaborators(editions.filter((e: any) => e.pendingSuggestions > 0));
      } catch (err) {
        console.error("Failed to fetch pending suggestions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  return (
    <div className="space-y-8 pt-6">
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Collaborations Moderation</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Suggested Revisions Queue</h1>
        <p className="text-muted-foreground text-xs">Review layout and content edits suggested by collaborators before merging them into live issues.</p>
      </div>

      <Card className="border-border/50 shadow-premium">
        <CardHeader className="select-none border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-amber-500" />
            <span>Collaborator Suggested Revisions</span>
          </CardTitle>
          <CardDescription>
            Suggested updates submitted strictly to Admin queue for moderation. Approve/Merge to apply them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : pendingCollaborators.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <FileEdit className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No collaborator suggested revisions currently awaiting moderation review.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                  <th className="p-4 text-left">Target Magazine</th>
                  <th className="p-4 text-left">Collaborator</th>
                  <th className="p-4 text-left">Suggested Edit Detail</th>
                  <th className="p-4 text-right">Moderations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-jakarta">
                {pendingCollaborators.map((edit) => (
                  <tr key={edit.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{edit.title}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Last updated {new Date(edit.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-500">
                          {(edit.authorName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-xs">{edit.authorName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <div className="max-w-[200px] font-semibold text-amber-500 text-xs">
                        {edit.pendingSuggestions} pending {edit.pendingSuggestions === 1 ? 'edit' : 'edits'}
                      </div>
                    </td>
                    <td className="p-4 text-right select-none space-x-2 shrink-0">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-premium bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => navigate(`/app/admin/suggestions/${edit.id}`)}
                      >
                        <span>Audit Suggestions</span>
                      </Button>
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
