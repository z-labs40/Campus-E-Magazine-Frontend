import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { User, CheckCircle, Shield } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, updateProfile } = useStore();
  const { toast } = useToast();

  const [name, setName] = React.useState(currentUser?.name || "");
  const [bio, setBio] = React.useState(currentUser?.bio || "");
  const [dept, setDept] = React.useState(currentUser?.department || "");

  // Sync state if current user loads late (local storage hydration)
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio || "");
      setDept(currentUser.department || "");
    }
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, bio, dept);
    toast({
      title: "Profile Saved",
      description: "Your user settings and bio were updated successfully.",
      variant: "success"
    });
  };

  const activeUser = currentUser || {
    name: "Aria Chen",
    role: "writer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    email: "aria.chen@campus.edu",
    bio: "Computer Science major, tech journalist.",
    department: "Computer Science"
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      <div className="text-left space-y-1 select-none">
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Workspace Profile</h1>
        <p className="text-muted-foreground text-xs">Configure your editorial persona, departments, and credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Left Visual Details */}
        <div className="md:col-span-4 space-y-4 select-none">
          <Card className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <img src={activeUser.avatar} className="h-24 w-24 rounded-full object-cover border-4 border-primary/10 shadow-premium" alt="" />
            </div>
            <div className="space-y-1">
              <span className="font-sora font-extrabold text-base text-foreground block">{activeUser.name}</span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">{activeUser.role} level</span>
            </div>
          </Card>
        </div>

        {/* Right Form Details */}
        <div className="md:col-span-8">
          <Card className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Full Name</span>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Department Wing</span>
                <Input 
                  type="text" 
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Short Bio / Editorial Intro</span>
                <Textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="h-24"
                />
              </div>

              <div className="pt-4 flex justify-end select-none">
                <Button type="submit" className="rounded-xl px-6 text-xs font-semibold shadow-premium h-9 pt-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>

    </div>
  );
}
