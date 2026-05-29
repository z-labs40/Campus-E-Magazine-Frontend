import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { isSuperAdmin } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Eye, ThumbsUp, MessageSquare, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const canManageCoAdmins = isSuperAdmin(currentUser?.role);

  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalMagazines: 0,
    pendingEditions: 0,
    pendingSuggestions: 0,
  });
  const [publishedArticles, setPublishedArticles] = React.useState<any[]>([]);
  const [coAdmins, setCoAdmins] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const requests = [
          api.get("/admin/stats"),
          api.get("/magazines"),
          ...(canManageCoAdmins ? [api.get("/admin/co-admins")] : []),
        ] as const;
        const [statsRes, magsRes, adminsRes] = await Promise.all(requests);

        setStats(statsRes.data.data || {});
        setPublishedArticles(magsRes.data.data || []);
        setCoAdmins(canManageCoAdmins && adminsRes ? adminsRes.data.data || [] : []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [canManageCoAdmins]);

  // Using defaults for missing stats in backend
  const pendingCount = stats.pendingEditions || 0;
  const rejectedCount = 0; // Not available in stats yet
  const draftCount = 0; // Not available in stats yet
  
  const totalViews = publishedArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalLikes = publishedArticles.reduce((sum, a) => sum + (a.likes || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      
      {/* HEADER SECTION */}
      <div className="text-left space-y-1 select-none mb-8">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">System Command Console</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Global Admin Dashboard</h1>
        <p className="text-muted-foreground text-xs">Monitor overall platform metrics and user statistics.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-premium border-border/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-3xl font-extrabold font-sora">{stats.totalUsers}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Total Users</span>
          </CardContent>
        </Card>
        
        <Card className="shadow-premium border-border/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-3xl font-extrabold font-sora">{stats.totalAdmins}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Admins & Co-Admins</span>
          </CardContent>
        </Card>

        <Card className="shadow-premium border-border/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-3xl font-extrabold font-sora">{publishedArticles.length}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Published Issues</span>
          </CardContent>
        </Card>

        <Card className="shadow-premium border-border/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6" />
            </div>
            <span className="text-3xl font-extrabold font-sora">{totalViews.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Total Page Views</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="border-border/50 cursor-pointer hover:bg-accent/10" onClick={() => navigate("/app/admin/pending")}>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-extrabold font-sora text-purple-600">{pendingCount}</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Pending Approvals</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-extrabold font-sora text-rose-600">{rejectedCount}</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Rejected</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-extrabold font-sora">{draftCount}</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">All Drafts</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-extrabold font-sora">{totalLikes.toLocaleString()}</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Total Likes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ANALYTICS TABLE */}
        <div className={`${canManageCoAdmins ? "lg:col-span-8" : "lg:col-span-12"} space-y-6 text-left`}>
          <Card className="border-border/50 shadow-premium">
            <CardHeader className="select-none border-b border-border/10 pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Magazine View History & Analytics</span>
              </CardTitle>
              <CardDescription>Metrics across all publicly published issues.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                    <th className="p-4 text-left">Magazine Issue</th>
                    <th className="p-4 text-right">Views</th>
                    <th className="p-4 text-right">Likes</th>
                    <th className="p-4 text-right">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10 font-jakarta">
                  {publishedArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-accent/10 transition-colors">
                      <td className="p-4 text-left">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground" dangerouslySetInnerHTML={{ __html: art.title }} />
                          <span className="text-[10px] text-muted-foreground mt-0.5">Author: {art.authorName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right select-none font-semibold">
                        <div className="flex items-center justify-end gap-1.5 text-blue-500">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{(art.views || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right select-none font-semibold text-muted-foreground">
                        <div className="flex items-center justify-end gap-1.5">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{(art.likes || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right select-none font-semibold text-muted-foreground">
                        <div className="flex items-center justify-end gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{(art.commentsCount || 0).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {publishedArticles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-muted-foreground text-xs">
                        No published articles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {canManageCoAdmins && (
          <div className="lg:col-span-4 space-y-6 text-left">
            <Card className="border-border/50 shadow-premium">
              <CardHeader className="select-none border-b border-border/10 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>User Roster</span>
                </CardTitle>
                <CardDescription>Current registered co-admin accounts.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                      <th className="p-4 text-left">User</th>
                      <th className="p-4 text-right">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 font-jakarta">
                    {coAdmins.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/10 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-xs">{u.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right select-none">
                          <Badge
                            variant="danger"
                            className="capitalize text-[10px] font-bold"
                          >
                            Co-Admin
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {coAdmins.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center p-8 text-muted-foreground text-xs">
                          No co-admins found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
