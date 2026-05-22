import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  PenTool, 
  Settings, 
  Users, 
  Bell, 
  History, 
  User, 
  Moon, 
  Sun, 
  Compass, 
  Archive, 
  LogOut, 
  Menu, 
  X,
  FileCheck,
  CheckSquare,
  ChevronDown,
  Layers
} from "lucide-react";
import { useStore, Role } from "@/lib/store";
import { getEffectiveRole, isAdminRole, roleDisplayName } from "@/lib/roles";
import { useTheme } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function AppShell() {
  const { currentUser, login, logout, getNotificationsForCurrentUser, pendingSubmissions } = useStore();
  const userNotifications = getNotificationsForCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const unreadNotifications = userNotifications.filter((n) => !n.read).length;
  const effectiveRole = getEffectiveRole(currentUser);

  const currentPath = location.pathname;

  type NavItem = { name: string; path: string; icon: any; role: Role[]; badgeCount?: number };
  
  // Sidebar navigation links grouped logically
  const navigationItems: { title: string; items: NavItem[] }[] = [
    {
      title: "Workspace",
      items: [
        { name: "Editor Dashboard", path: "/app", icon: PenTool, role: ["user"] },
        { name: "Admin Dashboard", path: "/app/admin", icon: Settings, role: ["admin", "co-admin"] },
      ]
    },
    {
      title: "Admin Workflow",
      items: [
        { name: "Pending Reviews", path: "/app/admin/pending", icon: CheckSquare, role: ["admin", "co-admin"], badgeCount: pendingSubmissions.length || undefined },
        { name: "Collaborator Revisions", path: "/app/admin/collaborator", icon: FileCheck, role: ["admin", "co-admin"] },
        { name: "Create Co-Admin", path: "/app/admin/create", icon: User, role: ["admin", "co-admin"] },
      ]
    },
    {
      title: "Tools & Collaboration",
      items: [
        { name: "Magazine Hub", path: "/app/magazines", icon: Layers, role: ["user", "admin", "co-admin"] },
        { name: "Suggestions Queue", path: "/app/suggestion-review", icon: BookOpen, role: ["user"] },
        { name: "Notifications", path: "/app/notifications", icon: Bell, badgeCount: unreadNotifications || undefined, role: ["user", "admin", "co-admin"] },
      ]
    },
    {
      title: "Personal",
      items: [
        { name: "My Profile", path: "/app/profile", icon: User, role: ["user", "admin", "co-admin"] },
      ]
    }
  ];

  // Auto switch dashboard depending on role to preview cleanly
  const handleRoleChange = (role: Role) => {
    const defaultEmails: Record<string, string> = {
      admin: "evelyn.vance@campus.edu",
      "co-admin": "marcus.t@campus.edu",
      user: "aria.chen@campus.edu",
    };
    login(defaultEmails[role] || defaultEmails.user, role);
    
    if (isAdminRole(role)) navigate("/app/admin");
    else navigate("/app");
  };

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activeUser = currentUser || {
    name: "Guest Writer",
    email: "guest@campus.edu",
    role: "user" as Role,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
  };

  const isLinkActive = (path: string) => {
    if (path === "/app") {
      return currentPath === "/app";
    }
    return currentPath.startsWith(path);
  };

  const renderNavSection = (section: typeof navigationItems[0]) => {
    const visibleItems = section.items.filter((item) => item.role.includes(activeUser.role));
    if (visibleItems.length === 0) return null;

    return (
      <div key={section.title} className="mb-6">
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
          {section.title}
        </h4>
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group select-none ${
                  active 
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 ${active ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-white"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badgeCount ? (
                  <Badge variant={active ? "outline" : "purple"} className={active ? "border-primary-foreground text-primary-foreground font-semibold" : ""}>
                    {item.badgeCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border shrink-0 bg-sidebar text-sidebar-foreground">
        
        {/* Logo Container */}
        <div className="h-16 px-6 border-b border-sidebar-border flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-sora font-bold tracking-tight text-lg text-white">Campus E-Mag</span>
            <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">COLLABORATIVE PUBLISHER</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-none">
          {navigationItems.map(renderNavSection)}
          
          {/* <div className="mt-8 border-t border-sidebar-border pt-4">
            <Link to="/magazine" className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white transition-all">
              <Compass className="h-4.5 w-4.5 text-sidebar-foreground/60 group-hover:text-white transition-transform group-hover:scale-105" />
              <span>Public Magazine</span>
            </Link>
            <Link to="/discover" className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white transition-all">
              <Archive className="h-4.5 w-4.5 text-sidebar-foreground/60 group-hover:text-white transition-transform group-hover:scale-105" />
              <span>Discover & Archive</span>
            </Link>
          </div> */}
        </nav>

        {/* Desktop Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50 flex flex-col gap-3">
          
          {/* Quick Switch Role Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-sidebar-foreground/50 font-semibold uppercase tracking-wider px-1">Testing Role Controller</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" className="w-full justify-between h-9 px-3 border-sidebar-border text-white hover:bg-sidebar-accent">
                  <span className="capitalize font-semibold text-xs flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      isAdminRole(activeUser.role) ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                    {roleDisplayName(effectiveRole)} Preview
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Switch User View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleChange("user")}>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs">Aria Chen (User)</span>
                    <span className="text-[10px] text-muted-foreground">Submit drafts, suggest text edits</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs">Dr. Evelyn Vance (Admin)</span>
                    <span className="text-[10px] text-muted-foreground">Global settings, publish issues</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 select-none">
              <img src={activeUser.avatar} className="h-8.5 w-8.5 rounded-full object-cover border border-sidebar-border" alt="User avatar" />
              <div className="flex flex-col max-w-[120px] overflow-hidden">
                <span className="font-medium text-xs text-white truncate">{activeUser.name}</span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate">{activeUser.email}</span>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/login"); }} className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-white rounded-lg">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col"
            >
              <div className="h-16 px-6 border-b border-sidebar-border flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-sora font-bold tracking-tight text-lg text-white">Campus E-Mag</span>
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent text-white" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 p-4 overflow-y-auto">
                {navigationItems.map(renderNavSection)}
                <div className="mt-8 border-t border-sidebar-border pt-4">
                  <Link to="/magazine" className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white transition-all">
                    <Compass className="h-4.5 w-4.5 text-sidebar-foreground/60 group-hover:text-white transition-transform group-hover:scale-105" />
                    <span>Public Magazine</span>
                  </Link>
                  <Link to="/discover" className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white transition-all">
                    <Archive className="h-4.5 w-4.5 text-sidebar-foreground/60 group-hover:text-white transition-transform group-hover:scale-105" />
                    <span>Discover & Archive</span>
                  </Link>
                </div>
              </nav>

              <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50 flex flex-col gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="glass" className="w-full justify-between h-9 border-sidebar-border text-white">
                      <span className="capitalize font-semibold text-xs flex items-center gap-1.5">
                        Role: {activeUser.role}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">
                    <DropdownMenuItem onClick={() => handleRoleChange("user")}>Aria (User)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange("admin")}>Evelyn (Admin)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img src={activeUser.avatar} className="h-8 w-8 rounded-full object-cover border border-sidebar-border" alt="" />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-xs text-white">{activeUser.name}</span>
                      <span className="text-[10px] text-sidebar-foreground/60">{activeUser.role} view</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/login"); }} className="hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-white">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-sidebar-border bg-sidebar px-4 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 text-sidebar-foreground">
          
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary/90">CMS Platform Workspace</span>
              <h2 className="font-sora font-semibold text-sm capitalize text-white select-none">
                {roleDisplayName(effectiveRole)} / {location.pathname.split("/").pop() || "home"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Alert Trigger */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/notifications")} className="relative h-9 w-9 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent rounded-lg">
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 ? (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              ) : null}
            </Button>

            {/* Dark mode toggler */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent rounded-lg transition-transform active:rotate-45">
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            {/* Public Magazine Shortcut */}
            <Button variant="outline" className="hidden sm:flex h-9 rounded-lg gap-2 text-xs font-semibold border-sidebar-border bg-sidebar-accent/30 text-white hover:bg-sidebar-accent shadow-premium" onClick={() => navigate("/magazine")}>
              <BookOpen className="h-3.5 w-3.5" />
              <span>Read Magazine</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ring-2 ring-primary/30 hover:ring-primary/60">
                  <img src={activeUser.avatar} className="h-full w-full rounded-full object-cover" alt="" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Workspace Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  <User className="h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/notifications")}>
                  <Bell className="h-4 w-4" />
                  <span>Notification Center</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="text-rose-500 focus:text-rose-600 focus:bg-rose-500/5">
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Dashboard Workspace Nested Outlet */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth bg-accent/20 dark:bg-black/10">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
