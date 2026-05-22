import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileEdit } from "lucide-react";

export default function AdminCollaboratorReviews() {
  const { collaboratorEdits, rejectCollaboratorEdit } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const pendingCollaborators = collaboratorEdits.filter(e => e.status === "pending_admin_review");

  return (
    <div className="space-y-8 pt-6">
      <div className="text-left space-y-1 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Collaborations Moderation</span>
        <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Suggested Revisions Queue</h1>
        <p className="text-muted-foreground text-xs">Review layout and content edits suggested by collaborators before merging them into live issues.</p>
      </div>

      <Card className="border-border/50 shadow-premium">
        <CardHeader className="select-none border-b border-border/10 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-amber-500" />
            <span>Collaborator Suggested Revisions</span>
          </CardTitle>
          <CardDescription>
            Suggested updates submitted strictly to Admin queue for moderation. Approve/Merge to apply them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {pendingCollaborators.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <FileEdit className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No collaborator suggested revisions currently awaiting moderation review.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/10 bg-accent/10 select-none text-muted-foreground font-bold">
                  <th className="p-4 text-left">Target Magazine</th>
                  <th className="p-4 text-left">Collaborator</th>
                  <th className="p-4 text-left">Suggested Edit Detail</th>
                  <th className="p-4 text-right">Moderations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-jakarta">
                {pendingCollaborators.map((edit) => (
                  <tr key={edit.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{edit.articleTitle}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Submitted {edit.timestamp}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <div className="flex items-center gap-2">
                        <img src={edit.collaboratorAvatar} className="h-6 w-6 rounded-full object-cover" />
                        <span className="font-semibold text-xs">{edit.collaboratorName}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={edit.changeSummary}>
                        {edit.changeSummary || "No summary provided"}
                      </div>
                    </td>
                    <td className="p-4 text-right select-none space-x-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-destructive/20 text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          rejectCollaboratorEdit(edit.id, "Declined proposed changes.");
                          toast({
                            title: "Revision Declined ❌",
                            description: "Successfully declined collaborator suggestion.",
                            variant: "destructive"
                          });
                        }}
                      >
                        <span>Decline</span>
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-premium bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => navigate(`/app/editor-tool/${edit.articleId}?reviewEditId=${edit.id}`)}
                      >
                        <span>Audit & Merge</span>
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
