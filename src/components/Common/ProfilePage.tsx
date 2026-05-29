import * as React from "react";
import { useStore } from "@/lib/store";
import { getEffectiveRole, roleDisplayName } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadImageToCloudinary } from "@/lib/imageUpload";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/modal";
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Key, 
  CheckCircle,
  Eye
} from "lucide-react";

export default function ProfilePage() {
  const { currentUser, updateProfile, changePassword, updateAvatar } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const [avatarUploading, setAvatarUploading] = React.useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const uploaded = await uploadImageToCloudinary(file, "avatars");
      updateAvatar(uploaded.url);
      toast({
        title: "Profile image updated",
        description: "Your image was uploaded successfully.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err?.response?.data?.error || err.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };
  const { toast } = useToast();

  const [name, setName] = React.useState(currentUser?.name || "");
  const [bio, setBio] = React.useState(currentUser?.bio || "");
  const [dept, setDept] = React.useState(currentUser?.department || "");

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [currentPass, setCurrentPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  // Sync state if current user loads late
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio || "");
      setDept(currentUser.department || "");
    }
  }, [currentUser]);

  const activeUser = currentUser || {
    id: "u-3",
    name: "Aria Chen",
    role: "user" as const,
    avatar: "https://ui-avatars.com/api/?name=Aria+Chen&background=6c47ff&color=fff&size=150&bold=true",
    email: "aria.chen@campus.edu",
    bio: "Computer Science major, tech journalist.",
    department: "Computer Science"
  };

  const effectiveRole = getEffectiveRole(activeUser);
  const roleDisplay = roleDisplayName(effectiveRole);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, bio, dept);
    toast({
      title: "Profile Saved",
      description: "Your user settings and bio were updated successfully.",
      variant: "success"
    });
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Not Signed In",
        description: "Please log in to change your password.",
        variant: "destructive",
      });
      return;
    }

    if (!currentPass || !newPass || !confirmPass) {
      toast({
        title: "Validation Error",
        description: "Please fill in all the password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPass !== confirmPass) {
      toast({
        title: "Mismatch Password",
        description: "New password and Confirm password fields do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPass.length < 6) {
      toast({
        title: "Weak Password",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(currentPass, newPass);
      if (res.success) {
        toast({
          title: "Password Updated",
          description: "Your password was updated successfully. Use it the next time you sign in.",
          variant: "success",
        });
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
        setIsPasswordModalOpen(false);
      } else {
        toast({
          title: "Password Update Failed",
          description: res.error || "Incorrect current password.",
          variant: "destructive",
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const isPowerRole = activeUser.role === "admin" || activeUser.role === "co-admin";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      
      {/* Page Title Header */}
      <div className="text-left space-y-1 select-none">
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Workspace Profile</h1>
        <p className="text-muted-foreground text-xs">Configure your editorial persona, departments, and credentials.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
        
        {/* LEFT COLUMN: Visual Profile Summary & Password Control */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 text-center space-y-5 border border-border shadow-sm bg-card relative overflow-hidden">
            {/* Elegant upper backdrop glow */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
              isPowerRole ? "from-rose-500 to-indigo-600" : "from-teal-500 to-indigo-600"
            }`} />

                        <div className="flex justify-center pt-2">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/30 to-white/40 opacity-75 blur-sm" />
                <img 
                  src={activeUser.avatar} 
                  className="h-24 w-24 rounded-full object-cover border-4 border-card relative z-10 shadow-md cursor-pointer" 
                  alt={activeUser.name} 
                  onClick={handleAvatarClick}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
              


            <div className="space-y-1">
              <span className="font-sora font-extrabold text-base text-foreground block flex items-center justify-center gap-1.5">
                {activeUser.name}
                <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
              </span>
              <span className="text-xs text-muted-foreground block">{activeUser.email}</span>
            </div>

            <div className="flex justify-center pt-1">
              <Badge variant="outline" className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                isPowerRole ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20"
              }`}>
                {roleDisplay} Level
              </Badge>
            </div>

            <div className="h-px bg-border/50 my-2" />

            {/* Quick Change Password Trigger */}
            <div className="pt-2">
              <Button 
                onClick={() => setIsPasswordModalOpen(true)}
                variant="outline"
                className="w-full rounded-xl gap-2 font-bold text-xs h-10 shadow-sm border border-border hover:bg-accent/40"
              >
                <Key className="h-3.5 w-3.5 text-primary" />
                <span>Change Password</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Editorial Persona Settings form */}
        <div className="lg:col-span-8">
          <Card className="p-6 border border-border shadow-sm bg-card">
            <h3 className="font-sora font-semibold text-sm text-foreground mb-4">
              Editorial Persona Details
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Full Name</span>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Enter full name"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Department Wing</span>
                <Input 
                  type="text" 
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                  placeholder="e.g. Computer Science, Journalism & Media"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Short Bio / Editorial Intro</span>
                <Textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Share a short bio summarizing your editorial journey..."
                  className="h-24 rounded-xl resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="rounded-xl px-6 text-xs font-semibold shadow-premium h-10 pt-0.5">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>

      {/* MODAL DIALOG: CHANGE PASSWORD */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-premium">
          <DialogHeader className="text-left space-y-1 pb-2">
            <DialogTitle className="text-lg font-sora font-extrabold flex items-center gap-2 text-foreground">
              <Key className="h-5 w-5 text-primary shrink-0" />
              <span>Update Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              Enter your current authorization password along with a new one to secure your platform access.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5 text-left relative">
              <span className="text-xs font-semibold text-muted-foreground">Current Password</span>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={currentPass} 
                  onChange={(e) => setCurrentPass(e.target.value)} 
                  required 
                  placeholder="Enter current password"
                  className="h-10 rounded-xl pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-xs font-semibold text-muted-foreground">New Strong Password</span>
              <Input 
                type="password" 
                value={newPass} 
                onChange={(e) => setNewPass(e.target.value)} 
                required 
                placeholder="At least 6 characters"
                className="h-10 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-xs font-semibold text-muted-foreground">Confirm New Password</span>
              <Input 
                type="password" 
                value={confirmPass} 
                onChange={(e) => setConfirmPass(e.target.value)} 
                required 
                placeholder="Confirm password"
                className="h-10 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="flex gap-2.5 pt-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-xl h-10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-10 text-xs font-bold px-6 shadow-premium"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
