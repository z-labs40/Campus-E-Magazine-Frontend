import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { isAdminRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Clock, FileEdit } from "lucide-react";

/** Strip HTML tags from contentEditable innerHTML and return plain text */
function stripHtml(html: string): string {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent?.trim() || "";
  } catch {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

export default function MagazineHub() {
  const { articles, currentUser } = useStore();
  const navigate = useNavigate();

  const myMagazines = isAdminRole(currentUser?.role)
    ? articles
    : articles.filter((a) => a.authorId === currentUser?.id);

  return (
    <div className="space-y-8 pt-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Content Creation</span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Magazine Hub</h1>
          <p className="text-muted-foreground text-xs">Manage your publications, drafts, and active edits.</p>
        </div>
        <Button onClick={() => navigate("/app/editor-tool/new")} className="gap-2 shadow-premium h-10 px-6">
          <Plus className="h-4 w-4" />
          <span>Create Magazine</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {myMagazines.map((mag) => (
          <Card 
            key={mag.id} 
            className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-premium overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm"
            onClick={() => navigate(`/app/editor-tool/${mag.id}`)}
          >
            <div className="h-40 w-full overflow-hidden relative bg-gradient-to-br from-primary/10 to-purple-500/10">
              {mag.coverImage ? (
                <img 
                  src={mag.coverImage} 
                  alt={mag.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] font-bold shadow-sm backdrop-blur-md bg-background/80">
                  {mag.category}
                </Badge>
                <Badge 
                  variant={mag.status === "published" ? "success" : mag.status === "pending_review" ? "warning" : mag.status === "draft" ? "secondary" : "danger"}
                  className="text-[10px] font-bold shadow-sm capitalize"
                >
                  {mag.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-foreground font-sora line-clamp-1 group-hover:text-primary transition-colors">{stripHtml(mag.title)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{stripHtml(mag.subtitle)}</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{mag.readTime}</span>
                </div>
                {isAdminRole(currentUser?.role) && (
                  <div className="flex items-center gap-1.5 truncate">
                    <FileEdit className="h-3 w-3" />
                    <span className="truncate">{mag.authorName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {myMagazines.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-xl">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-bold text-foreground mb-1">No Magazines Yet</h3>
            <p className="text-xs text-muted-foreground mb-4">You haven't created any magazines. Start your first publication!</p>
            <Button onClick={() => navigate("/app/editor-tool/new")} variant="outline" size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Magazine</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
