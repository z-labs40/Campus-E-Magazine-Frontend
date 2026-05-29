import * as React from "react";
import { getEffectiveRole, isAdminRole, type AccountRole, type EffectiveRole } from "@/lib/roles";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import {
  mapBackendUser,
  mapMagazine,
  mapNotification,
  syncPublishedSnapshot,
} from "@/lib/mappers";

/** @deprecated Use AccountRole — kept for gradual migration */
export type Role = AccountRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  avatar: string;
  bio?: string;
  department?: string;
  activeSuggestionsCount?: number;
  publishedCount?: number;
  password?: string;
}

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "needs_corrections";

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string; // HTML-like structured rich text (working draft)
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  readTime: string;
  coverImage: string;
  category: string;
  views: number;
  likes: number;
  shares: number;
  commentsCount: number;
  createdAt: string;
  /** Live published snapshot — used for diff baseline when editors submit edits */
  publishedTitle?: string;
  publishedSubtitle?: string;
  publishedContent?: string;
  publishedCoverImage?: string;
  publishedCategory?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

/** Tracks a pending editorial submission with before/after snapshots for admin diff review */
export interface PendingSubmission {
  id: string;
  articleId: string;
  submittedById: string;
  submittedByName: string;
  submittedAt: string;
  baselineTitle: string;
  baselineSubtitle: string;
  baselineContent: string;
  baselineCoverImage: string;
  baselineCategory: string;
  proposedTitle: string;
  proposedSubtitle: string;
  proposedContent: string;
  proposedCoverImage: string;
  proposedCategory: string;
  isNewArticle: boolean;
}

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface EditSuggestion {
  id: string;
  articleId: string;
  articleTitle: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  originalText: string;
  suggestedText: string;
  comment: string;
  status: SuggestionStatus;
  editorFeedback?: string;
  timestamp: string;
  category: "grammar" | "formatting" | "content" | "spelling";
}

export interface Comment {
  id: string;
  targetId: string; // articleId or suggestionId
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorAvatar: string;
  text: string;
  at: string;
}

export interface Revision {
  id: string;
  articleId: string;
  revisionNumber: number;
  authorName: string;
  title: string;
  content: string;
  patchSummary: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  category: "suggestion" | "approval" | "comment" | "system";
  read: boolean;
  timestamp: string;
  actionLink?: string;
  /** Target user inbox; omit to broadcast via recipientRoles */
  recipientId?: string;
  recipientRoles?: EffectiveRole[];
  articleId?: string;
}

export interface CollaboratorEdit {
  id: string;
  articleId: string;
  articleTitle: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorAvatar: string;
  title: string;
  subtitle: string;
  category: string;
  coverImage: string;
  content: string;
  status: "draft" | "pending_admin_review" | "merged" | "rejected";
  changeSummary: string;
  timestamp: string;
  feedback?: string;
}

// ==========================================
// 2. STATE MANAGER & BUSINESS OPERATIONS
// ==========================================

const SESSION_KEY = "em.session.v1";
const ARTICLES_KEY = "em.articles.v1";
const SUGGESTIONS_KEY = "em.suggestions.v1";
const COMMENTS_KEY = "em.comments.v1";
const REVISIONS_KEY = "em.revisions.v1";
const NOTIFICATIONS_KEY = "em.notifications.v1";
const COLLABORATOR_EDITS_KEY = "em.collaboratorEdits.v1";
const SUBMISSIONS_KEY = "em.submissions.v1";

function getArticleBaseline(art: Article): Pick<
  PendingSubmission,
  "baselineTitle" | "baselineSubtitle" | "baselineContent" | "baselineCoverImage" | "baselineCategory"
> {
  const hasLive = Boolean(art.publishedContent && art.status === "published");
  if (hasLive) {
    return {
      baselineTitle: art.publishedTitle || art.title,
      baselineSubtitle: art.publishedSubtitle || art.subtitle,
      baselineContent: art.publishedContent || art.content,
      baselineCoverImage: art.publishedCoverImage || art.coverImage,
      baselineCategory: art.publishedCategory || art.category,
    };
  }
  if (art.publishedContent) {
    return {
      baselineTitle: art.publishedTitle || art.title,
      baselineSubtitle: art.publishedSubtitle || art.subtitle,
      baselineContent: art.publishedContent,
      baselineCoverImage: art.publishedCoverImage || art.coverImage,
      baselineCategory: art.publishedCategory || art.category,
    };
  }
  return {
    baselineTitle: art.title,
    baselineSubtitle: art.subtitle,
    baselineContent: art.content,
    baselineCoverImage: art.coverImage,
    baselineCategory: art.category,
  };
}

interface StoreContextValue {
  currentUser: User | null;
  users: User[];
  articles: Article[];
  suggestions: EditSuggestion[];
  comments: Comment[];
  revisions: Revision[];
  notifications: Notification[];
  collaboratorEdits: CollaboratorEdit[];
  pendingSubmissions: PendingSubmission[];
  
  // Auth Operations
  login: (email: string, password?: string, role?: AccountRole) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, password?: string, role?: AccountRole) => Promise<User | null>;
  createAdmin: (name: string, email: string, department: string, asCoAdmin?: boolean) => User | null;
  updateAvatar: (avatarUrl: string) => void;
  updateProfile: (name: string, bio: string, department: string) => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  // New: retrieve notifications for currently logged-in user
  getNotificationsForCurrentUser: () => Notification[];


  // Article Operations
  createArticle: (title: string, subtitle: string, category: string, coverImage: string, content: string) => Promise<any>;
  updateArticle: (id: string, patch: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  submitForReview: (id: string) => Promise<void>;
  refetchArticles: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  fetchArticleById: (id: string) => Promise<Article | null>;
  publishArticle: (id: string) => Promise<void>;
  approveSubmission: (articleId: string) => void;
  rejectSubmission: (articleId: string, reason: string) => Promise<void>;
  requestCorrections: (id: string, feedbackComment: string) => void;
  recordArticleView: (id: string) => void;
  getPublicArticleContent: (article: Article) => { title: string; subtitle: string; content: string; coverImage: string; category: string };

  // Suggestions Operations
  addSuggestion: (
    articleId: string,
    originalText: string,
    suggestedText: string,
    comment: string,
    category: EditSuggestion["category"],
    range?: { start: number; end: number }
  ) => Promise<any>;
  resolveSuggestion: (id: string, status: SuggestionStatus, feedback?: string) => Promise<void>;

  // Comment Operations
  addComment: (targetId: string, text: string) => Comment;

  // Notification Operations
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // History Operations
  rollbackVersion: (articleId: string, revisionId: string) => void;

  // Collaborator Operations
  saveCollaboratorEdit: (
    articleId: string,
    title: string,
    subtitle: string,
    category: string,
    coverImage: string,
    content: string,
    changeSummary: string,
    status?: CollaboratorEdit["status"]
  ) => CollaboratorEdit;
  mergeCollaboratorEdit: (editId: string, feedback?: string) => void;
  rejectCollaboratorEdit: (editId: string, feedback?: string) => void;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

function loadData<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveData<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error("Localstorage saving failed", err);
  }
}

// ==========================================
// 3. MOCK DATA INITIALIZATION (REMOVED)
// ==========================================

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<User | null>(() => loadData<User | null>(SESSION_KEY, null));
  const [users, setUsers] = React.useState<User[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [suggestions, setSuggestions] = React.useState<EditSuggestion[]>([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [collaboratorEdits, setCollaboratorEdits] = React.useState<CollaboratorEdit[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = React.useState<PendingSubmission[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  const refetchArticles = React.useCallback(async () => {
    try {
      const magRes = await api.get("/magazines");
      const backendArticles = magRes.data?.data || [];
      setArticles(
        backendArticles.map((mag: any) => mapMagazine(mag, currentUser))
      );
    } catch (err) {
      console.error("Failed to fetch magazines:", err);
    }
  }, [currentUser]);

  const refetchNotifications = React.useCallback(async () => {
    if (!Cookies.get("token")) return;
    try {
      const notifRes = await api.get("/notifications");
      setNotifications((notifRes.data?.data || []).map(mapNotification));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const fetchArticleById = React.useCallback(
    async (id: string): Promise<Article | null> => {
      try {
        const res = await api.get(`/magazines/${id}`);
        const mapped = mapMagazine(res.data?.data, currentUser);
        setArticles((prev) => {
          const exists = prev.some((a) => a.id === id);
          if (exists) return prev.map((a) => (a.id === id ? { ...a, ...mapped } : a));
          return [mapped, ...prev];
        });
        return mapped;
      } catch (err) {
        console.error("Failed to fetch magazine:", err);
        return null;
      }
    },
    [currentUser]
  );

  // 1. HYDRATION & RECOVERY
  React.useEffect(() => {
    const defaultUser = loadData<User | null>(SESSION_KEY, null);
    setCurrentUser(defaultUser);

    const fetchInitialData = async () => {
      try {
        const [magRes, notifRes] = await Promise.all([
          api.get("/magazines"),
          defaultUser && Cookies.get("token")
            ? api.get("/notifications")
            : Promise.resolve({ data: { data: [] } }),
        ]);

        const backendArticles = magRes.data?.data || [];
        setArticles(backendArticles.map((mag: any) => mapMagazine(mag, defaultUser)));
        setNotifications((notifRes.data?.data || []).map(mapNotification));
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      } finally {
        setHydrated(true);
      }
    };

    fetchInitialData();
  }, []);

  // 2. AUTO-SAVE ON CHANGES
  React.useEffect(() => {
    if (hydrated) {
      saveData(SESSION_KEY, currentUser);
    }
  }, [currentUser, hydrated]);

  const pushNotification = React.useCallback((n: Omit<Notification, "id" | "read" | "timestamp">) => {
    const entry: Notification = {
      ...n,
      id: "not-" + Math.random().toString(36).slice(2, 9),
      read: false,
      timestamp: new Date().toLocaleString(),
    };
    setNotifications((prev) => [entry, ...prev]);
  }, []);

  const getNotificationsForCurrentUser = React.useCallback((): Notification[] => {
    if (!currentUser) {
      return notifications.filter(
        (n) => !n.recipientId && (!n.recipientRoles || n.recipientRoles.includes("writer"))
      );
    }
    const effective = getEffectiveRole(currentUser);
    return notifications.filter((n) => {
      if (n.recipientId) return n.recipientId === currentUser.id;
      if (n.recipientRoles?.length) return n.recipientRoles.includes(effective);
      return true;
    });
  }, [notifications, currentUser]);

  // ==========================================
  // 4. ACTION DISPATCHERS
  // ==========================================

  const login = async (email: string, password?: string, role?: AccountRole): Promise<User | null> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: backendUser } = response.data.data;

      Cookies.set("token", token, { expires: 7 });

      const mappedUser = mapBackendUser(backendUser);

      setUsers((prev) => {
        if (prev.some((u) => u.id === mappedUser.id)) {
          return prev.map((u) => u.id === mappedUser.id ? { ...u, ...mappedUser } : u);
        }
        return [...prev, mappedUser];
      });

      setCurrentUser(mappedUser);

      const [magRes, notifRes] = await Promise.all([
        api.get("/magazines"),
        api.get("/notifications"),
      ]);
      setArticles((magRes.data?.data || []).map((mag: any) => mapMagazine(mag, mappedUser)));
      setNotifications((notifRes.data?.data || []).map(mapNotification));

      return mappedUser;
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setCurrentUser(null);
  };

  const register = async (name: string, email: string, password?: string, role?: AccountRole): Promise<User | null> => {
    try {
      // All new registrations default to reader on the backend
      const backendRole = "reader";

      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        role: backendRole,
      });

      const { token, user: backendUser } = response.data.data;

      Cookies.set("token", token, { expires: 7 });

      const mappedUser = mapBackendUser(backendUser);

      setUsers((prev) => {
        if (prev.some((u) => u.id === mappedUser.id)) {
          return prev.map((u) => u.id === mappedUser.id ? mappedUser : u);
        }
        return [...prev, mappedUser];
      });

      setCurrentUser(mappedUser);

      const magRes = await api.get("/magazines");
      setArticles((magRes.data?.data || []).map((mag: any) => mapMagazine(mag, mappedUser)));

      return mappedUser;
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const createAdmin = (name: string, email: string, department: string, asCoAdmin = false) => {
    if (users.find((u) => u.email === email)) return null;

    const newAdmin: User = {
      id: "u-" + Math.random().toString(36).slice(2, 9),
      name,
      email,
      role: asCoAdmin ? "co-admin" : "admin",
      department,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`,
      bio: asCoAdmin
        ? "Co-Administrator with full platform publishing and moderation access."
        : "Administrator with full platform publishing and moderation access.",
    };

    setUsers([...users, newAdmin]);
    return newAdmin;
  };

  const updateProfile = (name: string, bio: string, department: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, name, bio, department };
    setCurrentUser(updated);
    setUsers((s) => s.map((x) => x.id === currentUser.id ? updated : x));
  };

  const updateAvatar = (avatarUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: avatarUrl };
    setCurrentUser(updated);
    setUsers((s) => s.map((x) => x.id === currentUser.id ? updated : x));
  };
  const changePassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "No user logged in." };

    try {
      await api.patch("/auth/change-password", {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to update password.",
      };
    }
  };

  const createArticle = async (title: string, subtitle: string, category: string, coverImage: string, contentBody: string): Promise<any> => {
    try {
      // Auto-promote reader → author before creating a magazine
      // This hits PATCH /auth/become-author which upgrades the role and returns a fresh JWT
      try {
        const promoRes = await api.patch("/auth/become-author");
        const { token: newToken, user: promotedUser } = promoRes.data.data;
        if (newToken) {
          Cookies.set("token", newToken, { expires: 7 });
        }
        // Update local user state if role changed
        if (promotedUser && currentUser) {
          const updatedUser = { ...currentUser, ...mapBackendUser(promotedUser) };
          setCurrentUser(updatedUser);
        }
      } catch (promoErr) {
        // If promotion fails (e.g. already an author/admin), continue anyway
        console.warn("Role promotion skipped or failed:", promoErr);
      }

      const res = await api.post("/magazines", {
        title,
        content: contentBody,
        coverImage,
      });
      const data = res.data.data;
      await refetchArticles();
      return data;
    } catch (err) {
      console.error("Failed to create article", err);
      throw err;
    }
  };

  const updateArticle = async (id: string, patch: Partial<Article>): Promise<void> => {
    try {
      const apiBody: Record<string, unknown> = {};
      if (patch.title !== undefined) apiBody.title = patch.title;
      if (patch.content !== undefined) apiBody.content = patch.content;
      if (patch.coverImage !== undefined) apiBody.coverImage = patch.coverImage;
      if (patch.status === "pending_review") apiBody.status = "pending_review";
      if (patch.status === "draft") apiBody.status = "draft";

      if (Object.keys(apiBody).length > 0) {
        await api.patch(`/magazines/${id}`, apiBody);
      }
      setArticles((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    } catch (err) {
      console.error("Failed to update article", err);
      throw err;
    }
  };

  const deleteArticle = async (id: string): Promise<void> => {
    setArticles((s) => s.filter((a) => a.id !== id));
  };

  const getPublicArticleContent = (article: Article) => {
    if (article.status === "published" && article.publishedContent) {
      return {
        title: article.publishedTitle || article.title,
        subtitle: article.publishedSubtitle || article.subtitle,
        content: article.publishedContent,
        coverImage: article.publishedCoverImage || article.coverImage,
        category: article.publishedCategory || article.category,
      };
    }
    return {
      title: article.title,
      subtitle: article.subtitle,
      content: article.content,
      coverImage: article.coverImage,
      category: article.category,
    };
  };

  const recordArticleView = (id: string) => {
    setArticles((s) =>
      s.map((art) => (art.id === id && art.status === "published" ? { ...art, views: art.views + 1 } : art))
    );
  };

  const submitForReview = async (id: string) => {
    const art = articles.find((a) => a.id === id);
    if (!art || !currentUser) return;
    if (isAdminRole(currentUser.role)) {
      await publishArticle(id);
      return;
    }

    const submittedAt = new Date().toLocaleString();
    const baseline = getArticleBaseline(art);
    const isNewArticle = !art.publishedContent && art.status === "draft";

    const submission: PendingSubmission = {
      id: "sub-" + Math.random().toString(36).slice(2, 9),
      articleId: id,
      submittedById: currentUser.id,
      submittedByName: currentUser.name,
      submittedAt,
      ...baseline,
      proposedTitle: art.title,
      proposedSubtitle: art.subtitle,
      proposedContent: art.content,
      proposedCoverImage: art.coverImage,
      proposedCategory: art.category,
      isNewArticle,
    };

    setPendingSubmissions((s) => {
      const filtered = s.filter((x) => x.articleId !== id);
      return [submission, ...filtered];
    });

    try {
      await api.patch(`/magazines/${id}`, {
        title: art.title,
        content: art.content,
        coverImage: art.coverImage,
        status: "pending_review",
      });
      await refetchArticles();
      await refetchNotifications();
    } catch (err) {
      console.error("Failed to submit for review:", err);
      throw err;
    }

    pushNotification({
      title: "Submitted for Review",
      description: `"${art.title}" is now pending admin approval.`,
      category: "approval",
      recipientId: currentUser.id,
      actionLink: `/app`,
      articleId: id,
    });
  };

  const publishArticle = async (id: string): Promise<void> => {
    try {
      await api.patch(`/admin/publish/${id}`);
      await refetchArticles();
      await refetchNotifications();
      setPendingSubmissions((s) => s.filter((x) => x.articleId !== id));
    } catch (err: any) {
      console.error("Failed to publish article", err);
      // Extract the backend error message (e.g. "Edition is already published")
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to publish article";
      throw new Error(message);
    }
  };

  const approveSubmission = (articleId: string) => {
    if (!currentUser || !isAdminRole(currentUser.role)) return;

    const submission = pendingSubmissions.find((s) => s.articleId === articleId);
    const art = articles.find((a) => a.id === articleId);

    setArticles((s) =>
      s.map((a) => {
        if (a.id !== articleId) return a;
        const merged = submission
          ? {
              title: submission.proposedTitle,
              subtitle: submission.proposedSubtitle,
              content: submission.proposedContent,
              coverImage: submission.proposedCoverImage,
              category: submission.proposedCategory,
            }
          : {};
        const updated = {
          ...a,
          ...merged,
          status: "published" as const,
          rejectionReason: undefined,
          submittedAt: undefined,
        };
        return { ...updated, ...syncPublishedSnapshot(updated) };
      })
    );

    setPendingSubmissions((s) => s.filter((x) => x.articleId !== articleId));

    if (art) {
      pushNotification({
        title: "Changes Approved & Published",
        description: `Your magazine "${submission?.proposedTitle || art.title}" was approved and published.`,
        category: "approval",
        recipientId: art.authorId,
        actionLink: `/magazine/${articleId}`,
        articleId,
      });
    }
  };

  const rejectSubmission = async (articleId: string, reason: string): Promise<void> => {
    try {
      await api.patch(`/admin/reject-draft/${articleId}`, { reason });
      await refetchArticles();
      await refetchNotifications();
      setPendingSubmissions((s) => s.filter((x) => x.articleId !== articleId));
    } catch (err) {
      console.error("Failed to reject submission", err);
      throw err;
    }
  };

  const requestCorrections = (id: string, feedbackComment: string) => {
    if (!currentUser || !isAdminRole(currentUser.role)) return;

    const art = articles.find((a) => a.id === id);
    updateArticle(id, { status: "needs_corrections", rejectionReason: feedbackComment });
    setPendingSubmissions((s) => s.filter((x) => x.articleId !== id));

    if (art) {
      pushNotification({
        title: "Corrections Requested",
        description: `Admin requested changes for "${art.title}": "${feedbackComment.slice(0, 80)}${feedbackComment.length > 80 ? "…" : ""}"`,
        category: "comment",
        recipientId: art.authorId,
        actionLink: `/app/editor-tool/${id}`,
        articleId: id,
      });
      addComment(id, `[ADMIN FEEDBACK] ${feedbackComment}`);
    }
  };

  const addSuggestion = async (
    articleId: string,
    originalText: string,
    suggestedText: string,
    comment: string,
    _category: EditSuggestion["category"],
    range?: { start: number; end: number }
  ): Promise<any> => {
    try {
      const art = articles.find((a) => a.id === articleId);
      const content = art?.content || "";
      let start = range?.start ?? content.indexOf(originalText);
      let end = range?.end ?? (start >= 0 ? start + originalText.length : 0);
      if (start < 0) {
        start = 0;
        end = originalText.length;
      }

      const res = await api.post("/suggestions/", {
        editionId: articleId,
        range: { start, end, selectedText: originalText },
        suggestion: `${suggestedText}\n\n[Editor note: ${comment}]`,
      });
      await refetchArticles();
      await refetchNotifications();
      return res.data.data;
    } catch (err) {
      console.error("Failed to add suggestion", err);
      throw err;
    }
  };

  const resolveSuggestion = async (id: string, status: SuggestionStatus, feedback?: string): Promise<void> => {
    try {
      const sug = suggestions.find(s => s.id === id);
      if (!sug) return;
      if (status === "approved") {
        await api.post(`/admin/merge/${sug.articleId}`, { suggestionIds: [id] });
      } else {
        await api.post(`/admin/reject/${sug.articleId}`, { suggestionIds: [id] });
      }
      setSuggestions(s => s.filter(x => x.id !== id));
    } catch (err) {
      console.error("Failed to resolve suggestion", err);
      throw err;
    }
  };

  const addComment = (targetId: string, text: string): Comment => {
    if (!currentUser) throw new Error("Must be logged in to comment");
    const author = currentUser;
    const newComment: Comment = {
      id: "c-" + Math.random().toString(36).slice(2, 9),
      targetId,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorAvatar: author.avatar,
      text,
      at: new Date().toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric", 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      })
    };

    setComments((s) => [...s, newComment]);

    // Track comments count on articles
    setArticles((s) => s.map(art => {
      if (art.id === targetId) {
        return { ...art, commentsCount: art.commentsCount + 1 };
      }
      return art;
    }));

    return newComment;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  };

  const markAllNotificationsRead = () => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const rollbackVersion = (articleId: string, revisionId: string) => {
    const rev = revisions.find(r => r.id === revisionId);
    if (!rev) return;

    // Apply previous body content & title
    setArticles((s) => s.map(art => {
      if (art.id === articleId) {
        return { ...art, title: rev.title, content: rev.content };
      }
      return art;
    }));

    // Log the rollback as a new revision
    const count = revisions.filter(r => r.articleId === articleId).length + 1;
    const rollbackRev: Revision = {
      id: "rev-" + Math.random().toString(36).slice(2, 9),
      articleId,
      revisionNumber: count,
      authorName: currentUser?.name || "System",
      title: rev.title,
      content: rev.content,
      patchSummary: `Rolled back to Revision #${rev.revisionNumber}`,
      timestamp: new Date().toLocaleString()
    };
    setRevisions((s) => [rollbackRev, ...s]);
  };

  const saveCollaboratorEdit = (
    articleId: string,
    title: string,
    subtitle: string,
    category: string,
    coverImage: string,
    content: string,
    changeSummary: string,
    status: CollaboratorEdit["status"] = "draft"
  ): CollaboratorEdit => {
    if (!currentUser) throw new Error("Must be logged in to save edits");
    const collaborator = currentUser;
    const art = articles.find(a => a.id === articleId);

    // Look for existing draft
    const existing = collaboratorEdits.find(
      (e) => e.articleId === articleId && e.collaboratorId === collaborator.id && e.status === "draft"
    );

    let updatedEdit: CollaboratorEdit;

    if (existing) {
      updatedEdit = {
        ...existing,
        title,
        subtitle,
        category,
        coverImage,
        content,
        changeSummary: changeSummary || existing.changeSummary,
        status,
        timestamp: new Date().toLocaleString()
      };
      setCollaboratorEdits((s) => s.map((e) => e.id === existing.id ? updatedEdit : e));
    } else {
      updatedEdit = {
        id: "col-edit-" + Math.random().toString(36).slice(2, 9),
        articleId,
        articleTitle: art?.title || "Unknown Article",
        collaboratorId: collaborator.id,
        collaboratorName: collaborator.name,
        collaboratorAvatar: collaborator.avatar,
        title,
        subtitle,
        category,
        coverImage,
        content,
        changeSummary: changeSummary || "Initial edits",
        status,
        timestamp: new Date().toLocaleString()
      };
      setCollaboratorEdits((s) => [updatedEdit, ...s]);
    }

    if (status === "pending_admin_review" && art) {
      pushNotification({
        title: "Collaboration Request",
        description: `${collaborator.name} submitted collaboration edits for "${art.title}".`,
        category: "suggestion",
        recipientRoles: ["admin", "co-admin"],
        actionLink: `/app/admin/collaborator`,
        articleId,
      });
    }

    return updatedEdit;
  };

  const mergeCollaboratorEdit = (editId: string, feedback?: string) => {
    setCollaboratorEdits((s) => s.map((e) => {
      if (e.id === editId) {
        const updated = { ...e, status: "merged" as const, feedback };
        
        // Apply changes to the main article
        setArticles((prevArts) => prevArts.map(art => {
          if (art.id === e.articleId) {
            const updated = {
              ...art,
              title: e.title,
              subtitle: e.subtitle,
              category: e.category,
              coverImage: e.coverImage,
              content: e.content,
              status: "published" as const,
            };
            return { ...updated, ...syncPublishedSnapshot(updated) };
          }
          return art;
        }));

        // Append a revision checkpoint for this merge
        const count = revisions.filter(r => r.articleId === e.articleId).length + 1;
        const mergeRev: Revision = {
          id: "rev-" + Math.random().toString(36).slice(2, 9),
          articleId: e.articleId,
          revisionNumber: count,
          authorName: `${e.collaboratorName} (Merged by Admin)`,
          title: e.title,
          content: e.content,
          patchSummary: `Collaborator Revision by ${e.collaboratorName}: "${e.changeSummary || 'No summary'}"`,
          timestamp: new Date().toLocaleString()
        };
        setRevisions((revs) => [mergeRev, ...revs]);

        pushNotification({
          title: "Collaborator Edits Merged",
          description: `Your edits for "${e.articleTitle}" were approved and merged by an admin.`,
          category: "approval",
          recipientId: e.collaboratorId,
          actionLink: `/magazine/${e.articleId}`,
          articleId: e.articleId,
        });

        const art = articles.find((a) => a.id === e.articleId);
        if (art && art.authorId !== e.collaboratorId) {
          pushNotification({
            title: "Collaborator Revision Merged",
            description: `Admin merged ${e.collaboratorName}'s edits on your article "${e.articleTitle}".`,
            category: "system",
            recipientId: art.authorId,
            actionLink: `/magazine/${e.articleId}`,
            articleId: e.articleId,
          });
        }

        return updated;
      }
      return e;
    }));
  };

  const rejectCollaboratorEdit = (editId: string, feedback?: string) => {
    setCollaboratorEdits((s) => s.map((e) => {
      if (e.id === editId) {
        const updated = { ...e, status: "rejected" as const, feedback };

        pushNotification({
          title: "Collaborator Revision Declined",
          description: `Your edits for "${e.articleTitle}" were declined: "${feedback || "No reason provided"}"`,
          category: "system",
          recipientId: e.collaboratorId,
          actionLink: `/app`,
          articleId: e.articleId,
        });

        return updated;
      }
      return e;
    }));
  };

  const value: StoreContextValue = {
    currentUser,
    users,
    articles,
    suggestions,
    comments,
    revisions,
    notifications,
    collaboratorEdits,
    pendingSubmissions,
    login,
    logout,
    register,
    createAdmin,
    updateProfile,
    updateAvatar,
    changePassword,
    getNotificationsForCurrentUser,
    createArticle,
    updateArticle,
    deleteArticle,
    submitForReview,
    refetchArticles,
    refetchNotifications,
    fetchArticleById,
    publishArticle,
    approveSubmission,
    rejectSubmission,
    requestCorrections,
    recordArticleView,
    getPublicArticleContent,
    addSuggestion,
    resolveSuggestion,
    addComment,
    markNotificationAsRead,
    markAllNotificationsRead,
    rollbackVersion,
    saveCollaboratorEdit,
    mergeCollaboratorEdit,
    rejectCollaboratorEdit,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = React.useContext(StoreContext);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
