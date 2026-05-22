import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, Mail, ExternalLink, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getNotificationsForCurrentUser, markNotificationAsRead, markAllNotificationsRead } = useStore();
  const notifications = getNotificationsForCurrentUser();

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    toast({
      title: "Notification Read",
      description: "Marked item as read.",
      variant: "success"
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    toast({
      title: "Clean Slate",
      description: "All pending notifications were marked as read.",
      variant: "success"
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Inboxes Feed</span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-xs">Stay informed on peer suggestion approvals, comment threads, and review results.</p>
        </div>

        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="rounded-xl h-9 text-xs font-semibold cursor-pointer">
            <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      <div className="space-y-4 text-left font-jakarta">
        {notifications.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl select-none">
            <Bell className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3 animate-pulse" />
            <h3 className="font-bold text-foreground">Inboxes are clear</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You're fully up to date. New review logs will appear here.
            </p>
          </div>
        ) : (
          notifications.map((not) => (
            <Card 
              key={not.id} 
              className={`border-border/50 hover:shadow-premium transition-all overflow-hidden ${
                not.read ? "bg-card/40 opacity-70" : "bg-card/90 ring-1 ring-primary/10 shadow-premium"
              }`}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                  not.category === "suggestion" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                  not.category === "approval" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  not.category === "comment" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-accent text-muted-foreground border-border/80"
                }`}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-3 select-none">
                    <span className="font-bold text-sm text-foreground truncate">{not.title}</span>
                    <span className="text-[9px] text-muted-foreground">{not.timestamp.split(",")[0]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/90 leading-relaxed font-jakarta">
                    {not.description}
                  </p>

                  <div className="flex items-center gap-2 pt-2 select-none">
                    {!not.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarkRead(not.id)}
                        className="h-7 px-2.5 rounded text-[10px] font-semibold text-primary hover:bg-primary/5 cursor-pointer"
                      >
                        Mark Read
                      </Button>
                    )}
                    {not.actionLink && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(not.actionLink!)}
                        className="h-7 px-2.5 rounded text-[10px] font-semibold text-muted-foreground hover:bg-accent cursor-pointer flex items-center gap-1"
                      >
                        <span>Inspect Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
