import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminPendingReviews() {
  const navigate = useNavigate();
  const [pendingArticles, setPendingArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/pending");
        setPendingArticles(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch pending reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  return (
    <div className="space-y-8 pt-6">
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Content Moderation</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Pending Reviews Queue</h1>
        <p className="text-muted-foreground text-xs">Review submitted drafts before they are published to the public magazine.</p>
      </div>

      <Card className="border-border/50 shadow-premium">
        <CardHeader className="select-none border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span>Publishing Queue</span>
          </CardTitle>
          <CardDescription>
            Audits requested by authors. Click "Audit Workspace" to review layouts, leave suggestions, or approve.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingArticles.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No submissions awaiting review. Outstanding job keeping the campus clean!
              </p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                  <th className="p-4 text-left">Magazine Draft</th>
                  <th className="p-4 text-left">Author</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-jakarta">
                {pendingArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{art.title}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Submitted {new Date(art.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(art.authorName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-xs">{art.authorName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <Badge variant="outline" className="text-[10px] font-bold">{art.category || 'Magazine'}</Badge>
                    </td>
                    <td className="p-4 text-right select-none">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-premium"
                        onClick={() => navigate(`/app/admin/review/${art.id}`)}
                      >
                        <span>Review Changes</span>
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
