import * as React from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldPlus, UserPlus, Trash2, ToggleLeft, ToggleRight, Pencil, Loader2, Users } from "lucide-react";

interface CoAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function AdminCreateAdmin() {
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [coAdmins, setCoAdmins] = React.useState<CoAdmin[]>([]);
  const [listLoading, setListLoading] = React.useState(true);

  // Edit inline state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");

  const fetchCoAdmins = async () => {
    try {
      setListLoading(true);
      const res = await api.get("/admin/co-admins");
      setCoAdmins(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch co-admins:", err);
    } finally {
      setListLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCoAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Missing Fields", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/co-admins", { name, email, password });
      toast({
        title: "Co-Admin Created",
        description: `${res.data.data.name} now has full publishing and moderation access.`,
        variant: "success",
      });
      setName("");
      setEmail("");
      setPassword("");
      fetchCoAdmins();
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.response?.data?.error || err.message || "Could not create co-admin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch(`/admin/co-admins/${id}/status`);
      toast({
        title: "Status Updated",
        description: res.data.message,
        variant: "success",
      });
      fetchCoAdmins();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.error || "Failed to toggle status.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, adminName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${adminName}?`)) return;

    try {
      await api.delete(`/admin/co-admins/${id}`);
      toast({ title: "Co-Admin Deleted", description: `${adminName} has been removed.`, variant: "success" });
      fetchCoAdmins();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.error || "Failed to delete co-admin.", variant: "destructive" });
    }
  };

  const handleStartEdit = (admin: CoAdmin) => {
    setEditingId(admin.id);
    setEditName(admin.name);
    setEditEmail(admin.email);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await api.patch(`/admin/co-admins/${id}`, { name: editName, email: editEmail });
      toast({ title: "Co-Admin Updated", description: "Details have been saved.", variant: "success" });
      setEditingId(null);
      fetchCoAdmins();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.response?.data?.error || "Failed to update.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      {/* Header */}
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Access Management</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Co-Admin Management</h1>
        <p className="text-muted-foreground text-xs">Create, manage, and control access for co-administrators. Co-Admins have the same permissions as the main Admin.</p>
      </div>

      {/* Create Co-Admin Form */}
      <Card className="border-border/50 shadow-premium">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <span>Create New Co-Admin</span>
          </CardTitle>
          <CardDescription>
            Enter credentials for the new co-administrator. They will be able to log in and access all admin tools immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Full Name</label>
                <Input placeholder="e.g. Dr. Sarah Jenkins" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Campus Email</label>
                <Input type="email" placeholder="sarah.jenkins@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Initial Password</label>
              <Input type="password" placeholder="Create a secure password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10" />
            </div>
            <Button type="submit" className="w-full h-10 mt-2 gap-2" variant="default" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span>{loading ? "Creating..." : "Provision Co-Admin"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Co-Admins List */}
      <Card className="border-border/50 shadow-premium">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Existing Co-Admins</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{coAdmins.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : coAdmins.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground select-none">
              <ShieldPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No co-admins have been created yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {coAdmins.map((admin) => (
                <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:bg-accent/20 transition-colors">
                  {editingId === admin.id ? (
                    /* Inline Edit Mode */
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs flex-1" />
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-8 text-xs flex-1" />
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="default" className="h-7 text-[10px] px-3" onClick={() => handleSaveEdit(admin.id)}>Save</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-3" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{admin.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{admin.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{admin.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={admin.status === "active" ? "default" : "danger"}
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          {admin.status}
                        </Badge>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title={admin.status === "active" ? "Set Inactive" : "Set Active"}
                          onClick={() => handleToggleStatus(admin.id)}
                        >
                          {admin.status === "active" ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-rose-500" />}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit"
                          onClick={() => handleStartEdit(admin)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                          title="Delete"
                          onClick={() => handleDelete(admin.id, admin.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
