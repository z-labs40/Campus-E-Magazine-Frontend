import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  BookOpen, 
  ArrowLeft, 
  ThumbsUp, 
  Share2, 
  MessageSquare, 
  Sparkles, 
  PenTool,
  Bookmark,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  ChevronDown
} from "lucide-react";
import { useStore, EditSuggestion } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/modal";

export default function MagazineReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { articles, comments, addComment, addSuggestion, updateArticle, currentUser, recordArticleView, getPublicArticleContent } = useStore();

  const article = articles.find(a => a.id === id) || articles[0];
  const publicContent = article ? getPublicArticleContent(article) : null;

  React.useEffect(() => {
    if (id && article?.status === "published") {
      recordArticleView(id);
    }
  }, [id, article?.status, recordArticleView]);
  const articleComments = comments.filter(c => c.targetId === article?.id);

  // States
  const [likes, setLikes] = React.useState(article?.likes || 0);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");

  // Suggestion Modal States
  const [suggestionOpen, setSuggestionOpen] = React.useState(false);
  const [selectedText, setSelectedText] = React.useState("");
  const [suggestedText, setSuggestedText] = React.useState("");
  const [suggestionComment, setSuggestionComment] = React.useState("");
  const [suggestionCategory, setSuggestionCategory] = React.useState<EditSuggestion["category"]>("content");

  // Floating selection toolbar state
  const [floatToolbar, setFloatToolbar] = React.useState<{ x: number; y: number; text: string } | null>(null);
  const floatRef = React.useRef<HTMLDivElement>(null);

  // Keep likes synced with article if article loads dynamically
  React.useEffect(() => {
    if (article) {
      setLikes(article.likes);
    }
  }, [article]);

  // Hide floating toolbar when clicking outside it
  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (floatRef.current && !floatRef.current.contains(e.target as Node)) {
        setFloatToolbar(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <BookOpen className="h-10 w-10 text-primary mx-auto animate-bounce" />
          <h2 className="font-bold text-foreground">Article not found</h2>
          <Button variant="outline" onClick={() => navigate("/magazine")}>Back to Magazine</Button>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      toast({
        title: "Article Liked",
        description: "Thank you for supporting student journalism!",
        variant: "success"
      });
      // Synchronize in mock database store
      updateArticle(article.id, { likes: article.likes + 1 });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Article URL copied to your clipboard.",
      variant: "success"
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(article.id, commentText);
    setCommentText("");
    toast({
      title: "Comment Published",
      description: "Your thought has been registered and is now live.",
      variant: "success"
    });
  };

  // Text selection handler — shows floating toolbar anchored to selection rect
  const handleTextSelection = () => {
    // Short delay so the browser has committed the selection
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      if (text.length > 1 && selection!.rangeCount > 0) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setFloatToolbar({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          text
        });
      } else {
        setFloatToolbar(null);
      }
    }, 10);
  };

  // Alternate helper: Open suggestion modal directly for the user with highlighted sample paragraph
  const handleOpenQuickSuggestion = (sampleOriginal: string) => {
    if (!currentUser) {
      toast({
        title: "Sign In to Suggest Edits",
        description: "Please sign in to suggest edits and new content on this magazine.",
        variant: "info"
      });
      navigate(`/login?redirect=${encodeURIComponent(`/app/editor-tool/${article.id}`)}`);
      return;
    }
    setSelectedText(sampleOriginal);
    setSuggestedText(sampleOriginal);
    setSuggestionOpen(true);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedText.trim() || !suggestionComment.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please specify both the replacement text and editor comment.",
        variant: "destructive"
      });
      return;
    }

    addSuggestion(
      article.id,
      selectedText,
      suggestedText,
      suggestionComment,
      suggestionCategory
    );

    setSuggestionOpen(false);
    setSuggestionComment("");
    setSuggestedText("");
    setSelectedText("");

    toast({
      title: "Suggestion Submitted",
      description: "Your edit recommendation has been saved to the review queue.",
      variant: "success"
    });
  };

  // Render a mock editorial paragraph list, allowing the reader to double-click anywhere to edit
  // or hover to see a neat "Suggest Edit" shortcut
  const getParagraphs = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    
    let targetNode: Element = doc.body;
    let containerStyleAttr = "";
    let containerClassAttr = "";

    const container = doc.querySelector(".magazine-article-container");
    if (container) {
      targetNode = container;
      containerStyleAttr = container.getAttribute("style") || "";
      containerClassAttr = container.getAttribute("class") || "";
    }

    const elements = Array.from(targetNode.children);
    
    // Helper to convert inline CSS style strings into React style objects
    const parseStyles = (str: string) => {
      const styles: Record<string, string> = {};
      str.split(";").forEach(pair => {
        const [key, value] = pair.split(":");
        if (key && value) {
          const camelKey = key.trim().replace(/-./g, x => x[1].toUpperCase());
          styles[camelKey] = value.trim();
        }
      });
      return styles;
    };

    const renderedElements = elements.map((el, index) => {
      const text = el.textContent || "";
      const isHeader = el.tagName.startsWith("H");
      const isQuote = el.tagName === "BLOCKQUOTE";
      const isImg = el.tagName === "DIV" && el.classList.contains("magazine-image-wrap");
      const isGrid = el.tagName === "DIV" && el.classList.contains("magazine-grid");
      const isDivider = el.tagName === "HR";

      const styleAttr = el.getAttribute("style") || "";
      // Fix: split only on the FIRST colon so values like rgb(0,0,0) or url(...) are preserved
      const parseStyles = (str: string) => {
        const styles: Record<string, string> = {};
        str.split(";").forEach(pair => {
          const colonIdx = pair.indexOf(":");
          if (colonIdx === -1) return;
          const key = pair.slice(0, colonIdx).trim();
          const value = pair.slice(colonIdx + 1).trim();
          if (key && value) {
            const camelKey = key.replace(/-./g, x => x[1].toUpperCase());
            styles[camelKey] = value;
          }
        });
        return styles;
      };
      const elementStyles = parseStyles(styleAttr);

      // Shared hover "Suggest Edit" button rendered on all text content
      const hoverBtn = (
        <button
          onClick={() => {
            if (!currentUser) {
              toast({
                title: "Sign In to Suggest Edits",
                description: "Please sign in to suggest edits and new content on this magazine.",
                variant: "info"
              });
              navigate(`/login?redirect=${encodeURIComponent(`/app/editor-tool/${article.id}`)}`);
              return;
            }
            handleOpenQuickSuggestion(text);
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/para:opacity-100 transition-opacity bg-accent border border-border shadow-premium rounded-lg px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/30 flex items-center gap-1 cursor-pointer select-none z-10"
          type="button"
        >
          <PenTool className="h-3 w-3" />
          <span>{currentUser ? "Suggest Edit" : "Sign In to Edit"}</span>
        </button>
      );

      if (isHeader) {
        return (
          <div key={index} className="relative group/para mb-2">
            <h2 
              onMouseUp={handleTextSelection}
              style={elementStyles} 
              className="font-sora font-extrabold text-2xl text-foreground mt-8 mb-4 cursor-text selection:bg-primary/20"
              dangerouslySetInnerHTML={{ __html: el.innerHTML }}
            />
            {hoverBtn}
          </div>
        );
      }

      if (isQuote) {
        return (
          <div key={index} className="relative group/para my-6">
            <blockquote 
              onMouseUp={handleTextSelection}
              style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "24px", fontStyle: "italic", margin: "24px 0", ...elementStyles }}
              className="italic font-serif text-lg text-muted-foreground cursor-text selection:bg-primary/20"
              dangerouslySetInnerHTML={{ __html: el.innerHTML }}
            />
            {hoverBtn}
          </div>
        );
      }

      if (isDivider) {
        return (
          <hr 
            key={index}
            style={{ border: "0", height: "1px", backgroundImage: "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.3), rgba(0,0,0,0))", margin: "32px 0", ...elementStyles }}
          />
        );
      }

      if (isImg) {
        const img = el.querySelector("img");
        const cap = el.querySelector(".caption");
        const imgStyleAttr = img?.getAttribute("style") || "";
        return (
          <div 
            key={index} 
            style={{ display: "block", ...elementStyles }} 
            className="rounded-xl overflow-hidden my-6 border border-border/50 bg-accent/10"
          >
            <img 
              src={img?.getAttribute("src") || ""} 
              alt="" 
              style={{ width: "100%", height: "auto", display: "block", ...parseStyles(imgStyleAttr) }} 
            />
            {cap && (
              <div 
                className="p-2.5 text-center text-xs text-muted-foreground bg-background/50 border-t border-border"
                dangerouslySetInnerHTML={{ __html: cap.innerHTML }}
              />
            )}
          </div>
        );
      }

      if (isGrid) {
        return (
          <div 
            key={index} 
            style={{ display: "flex", flexWrap: "wrap", gap: "24px", margin: "24px 0", ...elementStyles }}
            className="magazine-grid"
          >
            {Array.from(el.children).map((col, colIdx) => (
              <div 
                key={colIdx} 
                className="relative group/para magazine-column" 
                style={{ flex: 1, minWidth: "200px", padding: "4px" }}
              >
                <div 
                  onMouseUp={handleTextSelection}
                  className="cursor-text selection:bg-primary/20"
                  dangerouslySetInnerHTML={{ __html: col.innerHTML }} 
                />
                {hoverBtn}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div key={index} className="relative group/para mb-6">
          <p 
            onMouseUp={handleTextSelection}
            style={elementStyles}
            className="font-serif text-base sm:text-lg leading-relaxed text-foreground/90 selection:bg-primary/20 cursor-text"
            dangerouslySetInnerHTML={{ __html: el.innerHTML }}
          />
          {hoverBtn}
        </div>
      );
    });

    if (container) {
      const containerStyles = parseStyles(containerStyleAttr);
      return (
        <div 
          className={`magazine-article-container ${containerClassAttr}`} 
          style={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", minHeight: "500px", boxShadow: "var(--shadow-premium)", ...containerStyles }}
        >
          {renderedElements}
        </div>
      );
    }

    return renderedElements;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* FLOATING TEXT SELECTION TOOLBAR */}
      {floatToolbar && (
        <div 
          ref={floatRef}
          style={{
            position: "absolute",
            top: floatToolbar.y - 48,
            left: floatToolbar.x,
            transform: "translateX(-50%)",
            zIndex: 100
          }}
          className="flex items-center gap-1 p-1 bg-gray-950 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 select-none border border-gray-800"
        >
          {/* Mock formatting buttons for aesthetics */}
          <button className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Bold"><Bold className="h-4 w-4" /></button>
          <button className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Italic"><Italic className="h-4 w-4" /></button>
          <button className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Underline"><Underline className="h-4 w-4" /></button>
          
          <div className="w-px h-5 bg-gray-700 mx-1"></div>
          
          <button className="px-2 py-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold">
            Font Style <ChevronDown className="h-3 w-3" />
          </button>
          <button className="px-2 py-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold">
            Size <ChevronDown className="h-3 w-3" />
          </button>

          <div className="w-px h-5 bg-gray-700 mx-1"></div>

          {/* Color swatch mocks */}
          <div className="flex items-center gap-1 px-1">
            <div className="h-4 w-4 rounded-full bg-white border border-gray-600 cursor-pointer hover:scale-110 transition-transform"></div>
            <div className="h-4 w-4 rounded-full bg-gray-600 cursor-pointer hover:scale-110 transition-transform"></div>
            <div className="h-4 w-4 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform"></div>
            <div className="h-4 w-4 rounded-full bg-emerald-500 cursor-pointer hover:scale-110 transition-transform"></div>
            <div className="h-4 w-4 rounded-full bg-purple-500 cursor-pointer hover:scale-110 transition-transform"></div>
            <div className="h-4 w-4 rounded-full bg-rose-500 cursor-pointer hover:scale-110 transition-transform"></div>
          </div>

          <div className="w-px h-5 bg-gray-700 mx-1"></div>

          {/* Actual Suggest Edit Action */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleOpenQuickSuggestion(floatToolbar.text)}
            className="h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground text-[11px] rounded flex items-center gap-1.5 font-bold"
          >
            <PenTool className="h-3 w-3" />
            <span>{currentUser ? "Suggest Edit" : "Sign In to Edit"}</span>
          </Button>
        </div>
      )}

      {/* 1. PUBLIC HEADER */}
      <header className="h-20 px-6 lg:px-16 border-b border-border/40 flex items-center justify-between bg-background sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3 select-none">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-sora font-extrabold tracking-tight text-lg text-foreground">Campus E-Mag</span>
        </Link>

        <div className="flex items-center gap-2 select-none">
          <Link to="/magazine" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Magazine</span>
          </Link>
        </div>
      </header>

      {/* 2. COVER SHEET HERO */}
      <section className="relative h-[320px] lg:h-[460px] overflow-hidden select-none">
        <img 
          src={publicContent?.coverImage || article.coverImage} 
          className="h-full w-full object-cover" 
          alt="Article cover banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </section>

      {/* 3. EDITORIAL ARTICLE CONTAINER */}
      <div className="max-w-3xl mx-auto px-6 -mt-36 relative z-10 flex-1 pb-20">
        
        {/* Article header block */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-premium space-y-6 text-left glass-card">
          <div className="flex items-center gap-2 select-none">
            <Badge variant="purple">{article.category}</Badge>
            <span className="text-xs text-muted-foreground font-semibold">• {article.readTime}</span>
          </div>

          <h1 className="font-sora font-extrabold text-3xl sm:text-5xl text-foreground leading-[1.1] tracking-tight">
            {publicContent?.title || article.title}
          </h1>

          <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed">
            {publicContent?.subtitle || article.subtitle}
          </p>

          <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3">
              <img src={article.authorAvatar} className="h-10 w-10 rounded-full object-cover border border-border" alt="" />
              <div className="text-left">
                <span className="font-bold text-sm block">{article.authorName}</span>
                <span className="text-[10px] text-muted-foreground block">Campus Writer</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{article.createdAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{article.readTime}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 select-none ml-2"
                onClick={() => {
                  if (currentUser) {
                    toast({
                      title: "Opening Suggest Edit Workspace",
                      description: "Loading this article into the collaborative editor. You can edit existing content or add new blocks.",
                      variant: "success"
                    });
                    navigate(`/app/editor-tool/${article.id}`);
                  } else {
                    toast({
                      title: "Sign In to Suggest Edits",
                      description: "Create a free account or sign in to suggest edits and new content on this magazine.",
                      variant: "info"
                    });
                    navigate(`/login?redirect=${encodeURIComponent(`/app/editor-tool/${article.id}`)}`);
                  }
                }}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Suggest Edit</span>
              </Button>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS TIP BAR FOR SUGGEST EDIT HIGHLIGHT */}
        <div className="my-8 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between text-left select-none">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-foreground">Suggest Edits & New Content</span>
              <span className="text-[10px] text-muted-foreground">Click <strong>Suggest Edit</strong> to sign in and open this magazine in the collaborative editor — modify existing content or add brand new blocks. All suggestions go to Admin for review.</span>
            </div>
          </div>
          <Badge variant="purple" className="hidden sm:inline-flex text-[9px] uppercase font-bold tracking-widest">Login to Edit</Badge>
        </div>

        {/* SERIF TYPOGRAPHY BODY */}
        <div className="prose max-w-none text-left mt-8">
          {getParagraphs(publicContent?.content || article.content)}
        </div>

        {/* 4. READER INTERACTIONS BLOCK */}
        <div className="py-6 my-10 border-y border-border/80 flex items-center justify-between select-none">
          
          <div className="flex items-center gap-2">
            <Button 
              variant={hasLiked ? "default" : "outline"} 
              size="sm" 
              onClick={handleLike} 
              className="gap-2 rounded-lg text-xs font-semibold shadow-premium cursor-pointer"
            >
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-primary-foreground" : ""}`} />
              <span>{likes} Likes</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare} 
              className="gap-2 rounded-lg text-xs font-semibold shadow-premium cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <MessageSquare className="h-4 w-4" />
            <span>{articleComments.length} Thoughts</span>
          </div>

        </div>

        {/* 5. PUBLIC DISCUSSION FEED */}
        <section className="space-y-6 text-left">
          <h3 className="font-sora font-extrabold text-lg text-foreground">Thoughts & Discussion ({articleComments.length})</h3>
          
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <Textarea
              placeholder="What are your thoughts on this story? Leave an intellectual comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="rounded-xl border-border bg-card p-4 min-h-[100px] text-sm"
              required
            />
            <div className="flex justify-end select-none">
              <Button type="submit" className="rounded-xl px-5 text-xs font-semibold shadow-premium h-9">
                Post Thought
              </Button>
            </div>
          </form>

          <div className="space-y-4 pt-4">
            {articleComments.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6 select-none border border-dashed border-border rounded-xl">
                No comments registered yet. Be the first to start the dialogue!
              </p>
            ) : (
              articleComments.map((com) => (
                <div key={com.id} className="p-4 rounded-xl border border-border bg-card shadow-premium space-y-2">
                  <div className="flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <img src={com.authorAvatar} className="h-7 w-7 rounded-full object-cover border border-border" alt="" />
                      <div className="text-left">
                        <span className="font-bold text-xs text-foreground block">{com.authorName}</span>
                        <span className="text-[9px] capitalize text-muted-foreground block">{com.authorRole}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{com.at}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/90 font-jakarta leading-relaxed pl-1">
                    {com.text}
                  </p>
                </div>
              ))
            )}
          </div>

        </section>

      </div>

      {/* 6. SUGGEST EDIT OVERLAY DIALOG */}
      <Dialog open={suggestionOpen} onOpenChange={setSuggestionOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-premium rounded-2xl glass-card">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="flex items-center gap-2 select-none">
              <PenTool className="h-5 w-5 text-primary" />
              <span>Suggest Text Revision</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review and adjust the paragraph text below. Your recommendations will be sent straight to the Editor review dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSuggestionSubmit} className="space-y-4 mt-2 text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Original Selection</span>
              <div className="p-3 bg-muted/50 rounded-lg text-xs leading-relaxed border border-border/50 text-muted-foreground italic line-clamp-3">
                "{selectedText}"
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Suggested Replacement</span>
              <Textarea 
                value={suggestedText}
                onChange={(e) => setSuggestedText(e.target.value)}
                className="h-20 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5 select-none">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Suggestion Category</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["grammar", "formatting", "content", "spelling"] as EditSuggestion["category"][]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSuggestionCategory(cat)}
                    className={`h-7 rounded-lg border text-[10px] font-bold capitalize cursor-pointer transition-all ${
                      suggestionCategory === cat
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Review Comment / Editorial Note</span>
              <Textarea 
                placeholder="Explain why you recommend this change..." 
                value={suggestionComment}
                onChange={(e) => setSuggestionComment(e.target.value)}
                className="h-16 text-xs rounded-xl"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 select-none">
              <Button variant="outline" size="sm" type="button" onClick={() => setSuggestionOpen(false)}>Cancel</Button>
              <Button variant="default" size="sm" type="submit">Submit Recommendation</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
