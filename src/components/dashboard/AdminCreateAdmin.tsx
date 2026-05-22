import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldPlus, UserPlus } from "lucide-react";

export default function AdminCreateAdmin() {
  const { createAdmin } = useStore();
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [asCoAdmin, setAsCoAdmin] = React.useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const user = createAdmin(name, email, department, asCoAdmin);
    if (user) {
      toast({
        title: asCoAdmin ? "Co-Admin Created" : "Admin Created",
        description: `${user.name} has full publishing and moderation access.`,
        variant: "success",
      });
      setName("");
      setEmail("");
      setDepartment("");
    } else {
      toast({
        title: "Creation Failed",
        description: `A user with email ${email} already exists.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-6">
      <div className="text-left space-y-1 select-none mb-8">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Access Management</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Create Admin / Co-Admin</h1>
        <p className="text-muted-foreground text-xs">Co-Admins have the same full access as main administrators.</p>
      </div>

      <Card className="border-border/50 shadow-premium">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <span>Administrator Details</span>
          </CardTitle>
          <CardDescription>
            Enter the details for the new global administrator. They will have access to all moderation tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Full Name</label>
              <Input
                id="name"
                placeholder="e.g. Dr. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Campus Email</label>
              <Input
                id="email"
                type="email"
                placeholder="sarah.jenkins@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-accent/10">
              <input
                id="coAdmin"
                type="checkbox"
                checked={asCoAdmin}
                onChange={(e) => setAsCoAdmin(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="coAdmin" className="text-sm font-semibold cursor-pointer">
                Create as Co-Admin (same permissions as Admin)
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Department (Optional)</label>
              <Input
                id="department"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10"
              />
            </div>

            <Button type="submit" className="w-full h-10 mt-6 gap-2" variant="default">
              <UserPlus className="h-4 w-4" />
              <span>{asCoAdmin ? "Provision Co-Admin" : "Provision Admin"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
