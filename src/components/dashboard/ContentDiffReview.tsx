import * as React from "react";
import { diffWords, plainTextFromHtml } from "@/lib/diff";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ContentDiffReviewProps {
  beforeTitle: string;
  afterTitle: string;
  beforeContent: string;
  afterContent: string;
  beforeSubtitle?: string;
  afterSubtitle?: string;
}

function DiffLine({ before, after, label }: { before: string; after: string; label: string }) {
  const segments = diffWords(before, after);
  const changed = before !== after;

  return (
    <div className="space-y-2">
      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
      <div
        className={`rounded-lg border p-3 text-sm leading-relaxed font-jakarta ${
          changed ? "border-primary/30 bg-card" : "border-border/40 bg-muted/20"
        }`}
      >
        {segments.map((seg, i) => (
          <span
            key={`${seg.type}-${i}`}
            className={
              seg.type === "add"
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-0.5 rounded"
                : seg.type === "remove"
                  ? "bg-rose-500/20 text-rose-800 dark:text-rose-200 line-through px-0.5 rounded"
                  : ""
            }
          >
            {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ContentDiffReview({
  beforeTitle,
  afterTitle,
  beforeContent,
  afterContent,
  beforeSubtitle = "",
  afterSubtitle = "",
}: ContentDiffReviewProps) {
  const beforePlain = plainTextFromHtml(beforeContent);
  const afterPlain = plainTextFromHtml(afterContent);

  return (
    <Card className="border-border/50 shadow-premium">
      <CardHeader className="border-b border-border/10 pb-4">
        <CardTitle className="text-base">Highlighted Change Review</CardTitle>
        <CardDescription>
          Green = added content · Red strikethrough = removed content (Google Docs / PR diff style)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-rose-500/30 border border-rose-500/50" />
            <span className="text-muted-foreground font-semibold">Removed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
            <span className="text-muted-foreground font-semibold">Added</span>
          </div>
        </div>

        <DiffLine before={beforeTitle} after={afterTitle} label="Title" />
        {(beforeSubtitle || afterSubtitle) && (
          <DiffLine before={beforeSubtitle} after={afterSubtitle} label="Subtitle" />
        )}
        <DiffLine before={beforePlain} after={afterPlain} label="Body Content" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-border/10">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Before (live)</span>
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-rose-500/20 bg-rose-500/5 p-4"
              dangerouslySetInnerHTML={{ __html: beforeContent }}
            />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">After (proposed)</span>
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"
              dangerouslySetInnerHTML={{ __html: afterContent }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
