import type { Article, ArticleStatus, Notification, User } from "@/lib/store";
import type { AccountRole } from "@/lib/roles";

const DEFAULT_COVER = "";

function avatarUrl(name: string): string {
  const encoded = encodeURIComponent(name || "U");
  return `https://ui-avatars.com/api/?name=${encoded}&background=6c47ff&color=fff&size=150&bold=true`;
}

export function mapBackendStatus(status: string): ArticleStatus {
  if (status === "pending_review") return "pending_review";
  if (status === "draft") return "draft";
  if (status === "published" || status === "suggestions_pending") return "published";
  return "draft";
}

export function syncPublishedSnapshot(art: Pick<Article, "title" | "subtitle" | "content" | "coverImage" | "category" | "status">) {
  if (art.status !== "published") return {};
  return {
    publishedTitle: art.title,
    publishedSubtitle: art.subtitle,
    publishedContent: art.content,
    publishedCoverImage: art.coverImage,
    publishedCategory: art.category,
  };
}

export function mapMagazine(mag: any, currentUser?: User | null): Article {
  const content = mag.content ?? "";
  const status = mapBackendStatus(mag.status);
  const authorId = mag.createdById || mag.createdBy?.id || "";
  const authorName =
    mag.authorName ||
    mag.createdBy?.name ||
    (currentUser && currentUser.id === authorId ? currentUser.name : "Unknown Author");

  const base: Article = {
    id: mag.id,
    title: mag.title,
    subtitle: mag.subtitle ?? "",
    content,
    status,
    authorId,
    authorName,
    authorAvatar: avatarUrl(authorName),
    readTime: `${Math.max(2, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))} min read`,
    coverImage: mag.coverImage || DEFAULT_COVER,
    category: mag.category ?? "General",
    views: mag.views ?? 0,
    likes: mag.likes ?? 0,
    shares: mag.shares ?? 0,
    commentsCount: mag.commentsCount ?? 0,
    createdAt: mag.createdAt
      ? new Date(mag.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
  };

  if (status === "published" && content) {
    return { ...base, ...syncPublishedSnapshot(base) };
  }
  return base;
}

export function mapNotification(n: any): Notification {
  const type = n.type || "system";
  let category: Notification["category"] = "system";
  if (type.includes("suggestion")) category = "suggestion";
  else if (type.includes("approval") || type.includes("published") || type.includes("draft")) category = "approval";

  return {
    id: n.id,
    title: type.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    description: n.message,
    category,
    read: n.read ?? false,
    timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : new Date().toLocaleString(),
    articleId: n.editionId,
  };
}

export function mapBackendUser(backendUser: {
  id: string;
  email: string;
  name: string;
  role: string;
}): User {
  const mappedRole: AccountRole =
    backendUser.role === "admin"
      ? "admin"
      : backendUser.role === "co-admin"
        ? "co-admin"
        : "user";

  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    role: mappedRole,
    avatar: avatarUrl(backendUser.name),
    bio: `Campus ${mappedRole}.`,
    department: "General Academics",
    publishedCount: 0,
    activeSuggestionsCount: 0,
  };
}
