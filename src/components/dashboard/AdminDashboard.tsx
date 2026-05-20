import * as React from "react";
import { useStore, Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  ShieldAlert, 
  Database,
  Lock,
  UserCheck
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function AdminDashboard() {
  const { users, articles, login } = useStore();
  const { toast } = useToast();

  const [activeUsers, setActiveUsers] = React.useState(users);
  const [anonComments, setAnonComments] = React.useState(true);
  const [autoApproveSuggestions, setAutoApproveSuggestions] = React.useState(false);
  const [allowPublicDownloads, setAllowPublicDownloads] = React.useState(true);

  // Sync state if users update
  React.useEffect(() => {
    setActiveUsers(users);
  }, [users]);

  const handleRoleChange = (id: string, newRole: Role, name: string) => {
    setActiveUsers((s) => s.map((u) => u.id === id ? { ...u, role: newRole } : u));
    toast({
      title: "Role Modified",
      description: `Successfully updated ${name} to ${newRole.toUpperCase()} privilege level.`,
      variant: "success"
    });
  };

  const handleSettingToggle = (setting: string) => {
    if (setting === "anon") {
      setAnonComments(prev => !prev);
      toast({
        title: "Configuration Saved",
        description: `Anonymous comment blocks are now ${!anonComments ? "enabled" : "disabled"}.`,
        variant: "success"
      });
    } else if (setting === "auto") {
      setAutoApproveSuggestions(prev => !prev);
      toast({
        title: "Configuration Saved",
        description: `Automatic correction injects are now ${!autoApproveSuggestions ? "enabled" : "disabled"}.`,
        variant: "success"
      });
    } else if (setting === "down") {
      setAllowPublicDownloads(prev => !prev);
      toast({
        title: "Configuration Saved",
        description: `PDF archives download access is now ${!allowPublicDownloads ? "enabled" : "disabled"}.`,
        variant: "success"
      });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">System Command Console</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Global Admin Dashboard</h1>
        <p className="text-muted-foreground text-xs">Configure platforms guidelines, manage credentials roles, and moderate workspace settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE USERS MANAGER */}
        <div className="lg:col-span-8 space-y-6 text-left">
          <Card className="border-border/50 shadow-premium">
            <CardHeader className="select-none border-b border-border/10 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>User Privilege Center</span>
              </CardTitle>
              <CardDescription>Adjust authorization levels for authors, moderators, and administration managers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                    <th className="p-4">User</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Role Badge</th>
                    <th className="p-4 text-right">Moderations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10 font-jakarta">
                  {activeUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatar} className="h-8 w-8 rounded-full object-cover border border-border" alt="" />
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 select-none">
                        <span className="text-xs font-semibold text-muted-foreground">{u.department || "General Academics"}</span>
                      </td>

                      <td className="p-4 select-none">
                        <Badge 
                          variant={
                            u.role === "admin" ? "danger" :
                            u.role === "editor" ? "warning" : "success"
                          }
                          className="capitalize text-[10px] font-bold"
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="p-4 text-right select-none">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer">
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Switch Role</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40" align="end">
                            {(["writer", "editor", "admin"] as Role[]).map((r) => (
                              <DropdownMenuItem 
                                key={r} 
                                onClick={() => handleRoleChange(u.id, r, u.name)}
                                className="capitalize font-bold text-xs"
                              >
                                {r}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: CORE GUIDELINES CONFIG */}
        <div className="lg:col-span-4 space-y-6 text-left select-none">
          <Card className="border-border/50 shadow-premium">
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Feature Flags</span>
              </CardTitle>
              <CardDescription>Toggle collaborative settings globally.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Flag 1 */}
              <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => handleSettingToggle("anon")}>
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold text-foreground">Anonymous Comments</span>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Allow readers without campus email profiles to write discussion comments.
                  </p>
                </div>
                <div>
                  {anonComments ? (
                    <ToggleRight className="h-8 w-8 text-primary shrink-0" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

              {/* Flag 2 */}
              <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => handleSettingToggle("auto")}>
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold text-foreground">Auto-Approve Suggestions</span>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Approve spelling edit recommendations instantly without requiring Senior Editor verification checks.
                  </p>
                </div>
                <div>
                  {autoApproveSuggestions ? (
                    <ToggleRight className="h-8 w-8 text-primary shrink-0" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

              {/* Flag 3 */}
              <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => handleSettingToggle("down")}>
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold text-foreground">Public PDF Downloads</span>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Allow public readers to export published magazine issues as full-quality workflow PDFs.
                  </p>
                </div>
                <div>
                  {allowPublicDownloads ? (
                    <ToggleRight className="h-8 w-8 text-primary shrink-0" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
