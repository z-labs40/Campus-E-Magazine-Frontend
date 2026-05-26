import * as React from "react";
import { getEffectiveRole, isAdminRole, type AccountRole, type EffectiveRole } from "@/lib/roles";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

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

function syncPublishedSnapshot(art: Article): Partial<Article> {
  return {
    publishedTitle: art.title,
    publishedSubtitle: art.subtitle,
    publishedContent: art.content,
    publishedCoverImage: art.coverImage,
    publishedCategory: art.category,
  };
}

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
  changePassword: (currentPass: string, newPass: string) => { success: boolean; error?: string };
  // New: retrieve notifications for currently logged-in user
  getNotificationsForCurrentUser: () => Notification[];


  // Article Operations
  createArticle: (title: string, subtitle: string, category: string, coverImage: string, content: string) => Article;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  submitForReview: (id: string) => void;
  publishArticle: (id: string) => void;
  approveSubmission: (articleId: string) => void;
  rejectSubmission: (articleId: string, reason: string) => void;
  requestCorrections: (id: string, feedbackComment: string) => void;
  recordArticleView: (id: string) => void;
  getPublicArticleContent: (article: Article) => { title: string; subtitle: string; content: string; coverImage: string; category: string };

  // Suggestions Operations
  addSuggestion: (articleId: string, originalText: string, suggestedText: string, comment: string, category: EditSuggestion["category"]) => EditSuggestion;
  resolveSuggestion: (id: string, status: SuggestionStatus, feedback?: string) => void;

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
// 3. MOCK DATA INITIALIZATION
// ==========================================

const INITIAL_USERS: User[] = [
  {
    id: "u-1",
    name: "Dr. Evelyn Vance",
    email: "evelyn.vance@campus.edu",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    bio: "Head of Journalism & Media studies. Oversees all publication guidelines.",
    department: "Journalism & Media",
    publishedCount: 12,
    password: "password123"
  },
  {
    id: "u-2",
    name: "Marcus Thorne",
    email: "marcus.t@campus.edu",
    role: "user",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    bio: "Senior Editor. Passionate about narrative pacing, technical writing, and structural consistency.",
    department: "English Literature",
    publishedCount: 8,
    password: "password123"
  },
  {
    id: "u-3",
    name: "Aria Chen",
    email: "aria.chen@campus.edu",
    role: "user",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    bio: "Computer Science major, tech journalist, and core campus editorial writer.",
    department: "Computer Science",
    publishedCount: 5,
    activeSuggestionsCount: 2,
    password: "password123"
  },
  {
    id: "u-4",
    name: "Devon Reed",
    email: "devon.reed@campus.edu",
    role: "user",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    bio: "Environmental Studies junior. Focused on ecological stories and campus climate changes.",
    department: "Environmental Sciences",
    publishedCount: 3,
    activeSuggestionsCount: 1,
    password: "password123"
  }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "The Silent Shift: How AI is Redefining Classroom Dynamics",
    subtitle: "Beyond the cheating scare, algorithms are quietly restructuring how college students learn, think, and collaborate.",
    category: "Technology",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    readTime: "7 min read",
    status: "published",
    authorId: "u-3",
    authorName: "Aria Chen",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    likes: 124,
    shares: 48,
    commentsCount: 3,
    views: 4820,
    createdAt: "May 14, 2026",
    content: `<p>In the spring semester of last year, a quiet revolution took hold across campus. It didn't arrive with banners or protest lines. Instead, it surfaced in the soft blue glow of library screens at 2:00 AM, in the shifting formats of research drafts, and in the hesitant pauses of faculty lectures.</p>
<h2>The Quiet Integration</h2>
<p>AI has slipped past the gatekeepers. While administrators debated detection algorithms and plagiarism policies, students forged a new, unspoken synthesis. We aren't just copy-pasting answers; we are using machines as intellectual sounding boards, co-authors, and real-time translators of dense academic text.</p>
<blockquote>"The classroom is no longer a monologue. It has become a dialogue between student, professor, and the vast indexed intelligence of the web."</blockquote>
<p>In our computer science labs, the impact is structural. Coding assignments that once took weeks of boilerplate typing now focus entirely on architectural design. Students use generative scrapers to build initial frameworks, freeing up critical hours to explore optimization, security protocols, and human-centric interfaces.</p>
<h2>Faculty in Flux</h2>
<p>Professors are feeling the pull. Dr. Vance, who has lectured on media theory for twenty-two years, notes that research papers have evolved. "The references are broader, the outlines are cleaner, but sometimes, the idiosyncratic spark of a student's individual voice feels... sand-papered away," she remarks.</p>
<p>This is the core tension of the digital shift: the threshold between enhanced productivity and the dilution of authentic perspective. As generative tools continue to refine their parameters, defining where the machine ends and the writer begins will remain the central editorial puzzle of our generation.</p>`
  },
  {
    id: "art-2",
    title: "Urban Green: Reimagining Our Campus Concrete Spaces",
    subtitle: "A collaborative proposal to turn passive pathways into micro-ecological zones for study, biodiversity, and mental relief.",
    category: "Environment",
    coverImage: "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&q=80&w=1200",
    readTime: "5 min read",
    status: "published",
    authorId: "u-4",
    authorName: "Devon Reed",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    likes: 86,
    shares: 24,
    commentsCount: 1,
    views: 3105,
    createdAt: "May 12, 2026",
    content: `<p>Concrete dominates our daily visual diet. Between the chemistry wing and the southern dorms lies a three-acre plaza of unshaded, dark asphalt. In mid-July, the surface temperature rises past 105 degrees, creating a micro-heat island that discourages outdoor assembly and increases campus cooling loads.</p>
<h2>The Green Corridor Vision</h2>
<p>We propose a structural ecosystem change. By replacing twenty percent of the central walkway pavers with native wild clover, establishing vertical ivy lattices along the lecture hall facades, and installing solar-shaded bioswales, we can lower surface temperatures by eight degrees.</p>
<blockquote>"Urban planning isn't just about moving people from building to building; it's about sustaining them while they are in between."</blockquote>
<p>Furthermore, these zones act as critical staging grounds for campus biodiversity. Birds, native bees, and pollinator butterflies have seen an index drop of forty percent over the last decade. Introducing micro-gardens will establish local nesting vectors and create a tranquil, living laboratory for botany students.</p>`
  },
  {
    id: "art-3",
    title: "The Architecture of Late-Night Coding: A Study of Ritual",
    subtitle: "Why the quiet hours of midnight to dawn represent the absolute creative peak for software students.",
    category: "Culture",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    readTime: "4 min read",
    status: "pending_review",
    authorId: "u-3",
    authorName: "Aria Chen",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    views: 0,
    likes: 0,
    shares: 0,
    commentsCount: 0,
    createdAt: "May 18, 2026",
    content: `<p>Ask any computer science junior when their real work gets done, and they won't point to afternoon lectures or structured lab sessions. They will point to the silent window between midnight and 4:30 AM.</p>
<p>There is a unique cognitive shift that occurs when the rest of the world goes dark. The ambient noise of social media slows, Slack feeds fall silent, and the immediate visual environment contracts to the singular, high-contrast glow of a terminal window. This sensory isolation triggers a deep state of cognitive flow, where architectural complexities feel solvable and long-running compile loops assume a therapeutic rhythm.</p>`
  },
  {
    id: "art-4",
    title: "Echoes of the Quad: 100 Years of Student Voice",
    subtitle: "Unlocking the archives to trace how campus protests, political movements, and cultural shifts shaped our current infrastructure.",
    category: "History",
    coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200",
    readTime: "9 min read",
    status: "draft",
    authorId: "u-4",
    authorName: "Devon Reed",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    views: 0,
    likes: 0,
    shares: 0,
    commentsCount: 0,
    createdAt: "May 19, 2026",
    content: `<p>History is baked into our steps. The stone pillars of the central archway, now a passive backdrop for graduation snapshots, were once the fortified center-points of student protests in the winter of 1968. Exploring these archives reveals a century-long dialogue of resistance, community, and progressive debate.</p>`
  }
];

const INITIAL_SUGGESTIONS: EditSuggestion[] = [
  {
    id: "sug-1",
    articleId: "art-1",
    articleTitle: "The Silent Shift: How AI is Redefining Classroom Dynamics",
    authorId: "u-2",
    authorName: "Marcus Thorne",
    authorRole: "user",
    originalText: " generative scrapers to build initial frameworks",
    suggestedText: " generative assistants to synthesize preliminary boilerplates",
    comment: "The word 'scrapers' sounds somewhat destructive or unauthorized. Let's frame this positively around synthesis and assistance.",
    status: "pending",
    timestamp: "May 15, 2026, 4:12 PM",
    category: "content"
  },
  {
    id: "sug-2",
    articleId: "art-1",
    articleTitle: "The Silent Shift: How AI is Redefining Classroom Dynamics",
    authorId: "u-1",
    authorName: "Dr. Evelyn Vance",
    authorRole: "admin",
    originalText: "sometimes, the idiosyncratic spark of a student's individual voice feels... sand-papered away,",
    suggestedText: "sometimes, the unique and idiosyncratic qualities of a student's voice are smoothed over,",
    comment: "Rephrasing to maintain professional styling. 'Sand-papered away' is a bit too colloquial for the context of Vance's speech.",
    status: "pending",
    timestamp: "May 16, 2026, 9:30 AM",
    category: "formatting"
  },
  {
    id: "sug-3",
    articleId: "art-2",
    articleTitle: "Urban Green: Reimagining Our Campus Concrete Spaces",
    authorId: "u-2",
    authorName: "Marcus Thorne",
    authorRole: "user",
    originalText: "Between the chemistry wing and the southern dorms lies a three-acre plaza of unshaded, dark asphalt.",
    suggestedText: "Stretching between the chemistry annex and the south residential halls is a three-acre stretch of unshaded asphalt.",
    comment: "This flows much better geographically. Improves opening momentum.",
    status: "approved",
    editorFeedback: "Good catch, updated directly.",
    timestamp: "May 11, 2026, 11:20 AM",
    category: "formatting"
  }
];

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "c-1",
    targetId: "art-1",
    authorId: "u-2",
    authorName: "Marcus Thorne",
    authorRole: "user",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    text: "This is a brilliant analysis, Aria. I love how you highlight the synthetic co-authorship. It perfectly frames the modern student struggle.",
    at: "May 14, 2026, 6:00 PM"
  },
  {
    id: "c-2",
    targetId: "art-1",
    authorId: "u-1",
    authorName: "Dr. Evelyn Vance",
    authorRole: "admin",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    text: "Agreed. I have left some minor recommendations regarding the vocabulary formatting to maintain standard academic tone.",
    at: "May 15, 2026, 10:15 AM"
  },
  {
    id: "c-3",
    targetId: "sug-1",
    authorId: "u-3",
    authorName: "Aria Chen",
    authorRole: "user",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    text: "I completely agree, Marcus. Let's make this replacement. It reads significantly more professional.",
    at: "May 15, 2026, 5:45 PM"
  }
];

const INITIAL_REVISIONS: Revision[] = [
  {
    id: "rev-1",
    articleId: "art-1",
    revisionNumber: 2,
    authorName: "Marcus Thorne",
    title: "The Silent Shift: How AI is Redefining Classroom Dynamics",
    content: "...",
    patchSummary: "Approved and merged structural revisions regarding geographic layout and CS lab syntax.",
    timestamp: "May 15, 2026, 2:30 PM"
  },
  {
    id: "rev-2",
    articleId: "art-1",
    revisionNumber: 1,
    authorName: "Aria Chen",
    title: "The Silent Shift: How AI is Redefining Classroom Dynamics",
    content: "...",
    patchSummary: "Initial publication draft containing core student testimonials and professor speech quotes.",
    timestamp: "May 14, 2026, 11:00 AM"
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "not-1",
    title: "New Edit Suggestion",
    description: "Marcus Thorne suggested a change to 'The Silent Shift: How AI is Redefining Classroom Dynamics'.",
    category: "suggestion",
    read: false,
    timestamp: "May 15, 2026, 4:12 PM",
    actionLink: "/app/suggestion-review/art-1"
  },
  {
    id: "not-2",
    title: "Article Published Successfully",
    description: "Your article 'Urban Green: Reimagining Our Concrete Spaces' has been approved and published.",
    category: "approval",
    read: true,
    timestamp: "May 10, 2026, 3:00 PM",
    actionLink: "/magazine/art-2"
  },
  {
    id: "not-3",
    title: "New Editorial Comment",
    description: "Dr. Evelyn Vance left a comment on your draft 'The Architecture of Late-Night Coding'.",
    category: "comment",
    read: false,
    timestamp: "May 18, 2026, 10:15 AM",
    actionLink: "/magazine/art-3"
  }
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [suggestions, setSuggestions] = React.useState<EditSuggestion[]>([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [collaboratorEdits, setCollaboratorEdits] = React.useState<CollaboratorEdit[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = React.useState<PendingSubmission[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // 1. HYDRATION & RECOVERY
  React.useEffect(() => {
    // Populate Initial Mock Database if Empty
    const localUsers = loadData<User[]>("em.users.v1", INITIAL_USERS);
    const localArticles = loadData<Article[]>(ARTICLES_KEY, INITIAL_ARTICLES);
    const localSuggestions = loadData<EditSuggestion[]>(SUGGESTIONS_KEY, INITIAL_SUGGESTIONS);
    const localComments = loadData<Comment[]>(COMMENTS_KEY, INITIAL_COMMENTS);
    const localRevisions = loadData<Revision[]>(REVISIONS_KEY, INITIAL_REVISIONS);
    const localNotifications = loadData<Notification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const localCollaboratorEdits = loadData<CollaboratorEdit[]>(COLLABORATOR_EDITS_KEY, []);
    const localSubmissions = loadData<PendingSubmission[]>(SUBMISSIONS_KEY, []);

    // Migrate published articles to have published snapshots
    const migratedArticles = localArticles.map((a) => {
      if (a.status === "published" && !a.publishedContent) {
        return { ...a, ...syncPublishedSnapshot(a) };
      }
      return a;
    });
    
    // Stored active session
    const defaultUser = loadData<User | null>(SESSION_KEY, null); 

    setUsers(localUsers);
    setArticles(migratedArticles);
    setPendingSubmissions(localSubmissions);
    setSuggestions(localSuggestions);
    setComments(localComments);
    setRevisions(localRevisions);
    setNotifications(localNotifications);
    setCollaboratorEdits(localCollaboratorEdits);
    setCurrentUser(defaultUser);
    setHydrated(true);
  }, []);

  // 2. AUTO-SAVE ON CHANGES
  React.useEffect(() => {
    if (hydrated) {
      saveData(SESSION_KEY, currentUser);
      saveData("em.users.v1", users);
      saveData(ARTICLES_KEY, articles);
      saveData(SUGGESTIONS_KEY, suggestions);
      saveData(COMMENTS_KEY, comments);
      saveData(REVISIONS_KEY, revisions);
      saveData(NOTIFICATIONS_KEY, notifications);
      saveData(COLLABORATOR_EDITS_KEY, collaboratorEdits);
      saveData(SUBMISSIONS_KEY, pendingSubmissions);
    }
  }, [currentUser, users, articles, suggestions, comments, revisions, notifications, collaboratorEdits, pendingSubmissions, hydrated]);

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

      // Save token in cookies
      Cookies.set("token", token, { expires: 7 });

      // Map backend role to frontend AccountRole
      const mappedRole: AccountRole =
        backendUser.role === "admin" ? "admin" :
        backendUser.role === "co-admin" ? "co-admin" : "user";

      const mappedUser: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: mappedRole,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*900000)}?auto=format&fit=crop&q=80&w=150`,
        bio: `Professional campus ${mappedRole} exploring academic and student culture.`,
        department: "General Academics",
        publishedCount: 0,
        activeSuggestionsCount: 0
      };

      setUsers((prev) => {
        if (prev.some((u) => u.id === mappedUser.id)) {
          return prev.map((u) => u.id === mappedUser.id ? { ...u, ...mappedUser } : u);
        }
        return [...prev, mappedUser];
      });

      setCurrentUser(mappedUser);
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

      // Save token in cookies
      Cookies.set("token", token, { expires: 7 });

      const mappedRole: AccountRole = backendUser.role === "admin" ? "admin" : "user";

      const mappedUser: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: mappedRole,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
        bio: `Freshly signed up campus ${mappedRole}.`,
        department: "Undeclared",
        publishedCount: 0,
        activeSuggestionsCount: 0,
      };

      setUsers((prev) => {
        if (prev.some((u) => u.id === mappedUser.id)) {
          return prev.map((u) => u.id === mappedUser.id ? mappedUser : u);
        }
        return [...prev, mappedUser];
      });

      setCurrentUser(mappedUser);
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
  const changePassword = (currentPass: string, newPass: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: "No user logged in." };
    const storedUser = users.find(u => u.id === currentUser.id);
    const actualPassword = storedUser?.password || "password123";
    
    if (currentPass !== actualPassword) {
      return { success: false, error: "Current password does not match." };
    }
    
    const updated = { ...currentUser, password: newPass };
    setCurrentUser(updated);
    setUsers((s) => s.map((x) => x.id === currentUser.id ? updated : x));
    return { success: true };
  };

  const createArticle = (title: string, subtitle: string, category: string, coverImage: string, content: string): Article => {
    const author = currentUser || INITIAL_USERS[2];
    const newArt: Article = {
      id: "art-" + Math.random().toString(36).slice(2, 9),
      title,
      subtitle,
      content,
      status: "draft",
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      readTime: `${Math.max(2, Math.ceil(content.split(" ").length / 200))} min read`,
      coverImage: coverImage || "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1200",
      category,
      views: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    setArticles((s) => [newArt, ...s]);
    
    // Add revision item
    const newRev: Revision = {
      id: "rev-" + Math.random().toString(36).slice(2, 9),
      articleId: newArt.id,
      revisionNumber: 1,
      authorName: author.name,
      title: newArt.title,
      content: newArt.content,
      patchSummary: "Created initial workspace draft.",
      timestamp: new Date().toLocaleString()
    };
    setRevisions((s) => [newRev, ...s]);

    return newArt;
  };

  const updateArticle = (id: string, patch: Partial<Article>) => {
    setArticles((s) => s.map((art) => {
      if (art.id === id) {
        const updated = { ...art, ...patch };
        // Create revision log if content changed
        if (patch.content && patch.content !== art.content) {
          const count = revisions.filter(r => r.articleId === id).length + 1;
          const newRev: Revision = {
            id: "rev-" + Math.random().toString(36).slice(2, 9),
            articleId: id,
            revisionNumber: count,
            authorName: currentUser?.name || "System",
            title: updated.title,
            content: patch.content,
            patchSummary: patch.title ? `Renamed and edited paragraphs` : `Updated body blocks`,
            timestamp: new Date().toLocaleString()
          };
          setRevisions(r => [newRev, ...r]);
        }
        return updated;
      }
      return art;
    }));
  };

  const deleteArticle = (id: string) => {
    setArticles((s) => s.filter((art) => art.id !== id));
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

  const submitForReview = (id: string) => {
    const art = articles.find((a) => a.id === id);
    if (!art || !currentUser) return;
    if (isAdminRole(currentUser.role)) {
      publishArticle(id);
      return;
    }

    const baseline = getArticleBaseline(art);
    const isNewArticle = !art.publishedContent && art.status === "draft";

    const submission: PendingSubmission = {
      id: "sub-" + Math.random().toString(36).slice(2, 9),
      articleId: id,
      submittedById: currentUser.id,
      submittedByName: currentUser.name,
      submittedAt: new Date().toLocaleString(),
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

    updateArticle(id, {
      status: "pending_review",
      submittedAt: submission.submittedAt,
      rejectionReason: undefined,
    });

    pushNotification({
      title: "New Magazine Submission",
      description: `${currentUser.name} submitted ${isNewArticle ? "a new magazine" : "changes to"} "${art.title}" for approval.`,
      category: "suggestion",
      recipientRoles: ["admin", "co-admin"],
      actionLink: `/app/admin/review/${id}`,
      articleId: id,
    });

    pushNotification({
      title: "Submitted for Review",
      description: `"${art.title}" is now pending admin approval.`,
      category: "approval",
      recipientId: currentUser.id,
      actionLink: `/app`,
      articleId: id,
    });
  };

  const publishArticle = (id: string) => {
    if (!currentUser || !isAdminRole(currentUser.role)) return;

    setArticles((s) =>
      s.map((art) => {
        if (art.id !== id) return art;
        const published = {
          ...art,
          status: "published" as const,
          rejectionReason: undefined,
          ...syncPublishedSnapshot(art),
        };
        return published;
      })
    );

    setPendingSubmissions((s) => s.filter((x) => x.articleId !== id));

    const art = articles.find((a) => a.id === id);
    if (art && art.authorId !== currentUser.id) {
      pushNotification({
        title: "Magazine Published",
        description: `Your magazine "${art.title}" was approved and is now live.`,
        category: "approval",
        recipientId: art.authorId,
        actionLink: `/magazine/${id}`,
        articleId: id,
      });
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

  const rejectSubmission = (articleId: string, reason: string) => {
    if (!currentUser || !isAdminRole(currentUser.role)) return;

    const art = articles.find((a) => a.id === articleId);
    const submission = pendingSubmissions.find((s) => s.articleId === articleId);

    updateArticle(articleId, {
      status: "rejected",
      rejectionReason: reason,
    });

    setPendingSubmissions((s) => s.filter((x) => x.articleId !== articleId));

    if (art) {
      pushNotification({
        title: "Changes Rejected",
        description: `Your changes to "${submission?.proposedTitle || art.title}" were rejected: ${reason}`,
        category: "comment",
        recipientId: art.authorId,
        actionLink: `/app/editor-tool/${articleId}`,
        articleId,
      });
      addComment(articleId, `[ADMIN REJECTION] ${reason}`);
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

  const addSuggestion = (
    articleId: string,
    originalText: string,
    suggestedText: string,
    comment: string,
    category: EditSuggestion["category"]
  ): EditSuggestion => {
    const author = currentUser || INITIAL_USERS[2];
    const art = articles.find(a => a.id === articleId);
    
    const newSug: EditSuggestion = {
      id: "sug-" + Math.random().toString(36).slice(2, 9),
      articleId,
      articleTitle: art?.title || "Unknown Article",
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      originalText,
      suggestedText,
      comment,
      status: "pending",
      timestamp: new Date().toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric", 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      }),
      category
    };

    setSuggestions((s) => [newSug, ...s]);

    pushNotification({
      title: "Content Suggestion",
      description: `${author.name} suggested content updates for "${art?.title}".`,
      category: "suggestion",
      recipientRoles: ["admin", "co-admin"],
      actionLink: `/app/suggestion-review/${articleId}`,
      articleId,
    });

    if (art && art.authorId !== author.id) {
      pushNotification({
        title: "New Suggestion on Your Magazine",
        description: `${author.name} suggested edits on "${art.title}".`,
        category: "suggestion",
        recipientId: art.authorId,
        actionLink: `/magazine/${articleId}`,
        articleId,
      });
    }

    return newSug;
  };

  const resolveSuggestion = (id: string, status: SuggestionStatus, feedback?: string) => {
    setSuggestions((s) => s.map((sug) => {
      if (sug.id === id) {
        const resolved = { ...sug, status, editorFeedback: feedback };
        
        // If approved, apply suggestion content automatically into the article!
        if (status === "approved") {
          const art = articles.find(a => a.id === sug.articleId);
          if (art && art.content.includes(sug.originalText)) {
            const updatedContent = art.content.replace(sug.originalText, sug.suggestedText);
            updateArticle(sug.articleId, { content: updatedContent });
          }
        }

        pushNotification({
          title: status === "approved" ? "Suggestion Approved" : "Suggestion Rejected",
          description: `Your suggestion on "${sug.articleTitle}" was ${status} by ${currentUser?.name}.`,
          category: status === "approved" ? "approval" : "system",
          recipientId: sug.authorId,
          actionLink: `/magazine/${sug.articleId}`,
          articleId: sug.articleId,
        });

        return resolved;
      }
      return sug;
    }));
  };

  const addComment = (targetId: string, text: string): Comment => {
    const author = currentUser || INITIAL_USERS[2];
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
    const collaborator = currentUser || INITIAL_USERS[2];
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
