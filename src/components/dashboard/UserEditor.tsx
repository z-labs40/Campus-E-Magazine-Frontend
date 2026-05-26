import * as React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  BookOpen, 
  PenTool, 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Heading2, 
  Quote, 
  Type, 
  Image as ImageIcon, 
  History,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings,
  Grid,
  Divide,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  GripVertical,
  GripHorizontal
} from "lucide-react";
import { useStore } from "@/lib/store";
import { canDirectPublish, isAdminRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/modal";

// Define the structured block type
interface EditorBlock {
  id: string;
  type: "heading" | "paragraph" | "quote" | "image" | "columns" | "divider";
  content: string; // Used for text blocks
  align?: "left" | "center" | "right" | "justify";
  fontSize?: string; // "small" | "medium" | "large" | "xlarge"
  color?: string;
  fontStyle?: "serif" | "sans" | "mono" | "sora" | "jakarta" | "script";
  // Image properties
  url?: string;
  caption?: string;
  width?: string;
  float?: "none" | "left" | "right";
  // Columns content
  colCount?: number;
  colContent?: string[]; // inner HTMLs
}

export default function UserEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const reviewEditId = searchParams.get("reviewEditId");

  const { 
    articles, 
    updateArticle, 
    createArticle, 
    currentUser, 
    publishArticle,
    submitForReview,
    requestCorrections,
    rejectSubmission,
    approveSubmission,
    collaboratorEdits,
    saveCollaboratorEdit,
    mergeCollaboratorEdit,
    rejectCollaboratorEdit
  } = useStore();

  const existingArt = articles.find(a => a.id === id);
  
  // Find reviewEdit if active
  const reviewEdit = reviewEditId ? collaboratorEdits.find(e => e.id === reviewEditId) : null;

  // Find active collaborator draft if collaborator is editing
  const isAuthor = !existingArt || existingArt.authorId === currentUser?.id;
  const myDraftEdit = (!isAuthor && existingArt) 
    ? collaboratorEdits.find(e => e.articleId === existingArt.id && e.collaboratorId === currentUser?.id && e.status === "draft")
    : null;

  // If a standard author/moderator wants to read-only
  const isAdmin = isAdminRole(currentUser?.role);
  const canPublish = canDirectPublish(currentUser?.role);
  const isReadOnly =
    !reviewEditId && isAdmin && existingArt && existingArt.authorId !== currentUser?.id;

  const [adminFeedback, setAdminFeedback] = React.useState("");
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [changeSummary, setChangeSummary] = React.useState("");
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);

  // Core metadata states
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [category, setCategory] = React.useState("Technology");
  const [coverImage, setCoverImage] = React.useState("");

  // Editor layout states
  const [blocks, setBlocks] = React.useState<EditorBlock[]>([]);
  const [theme, setTheme] = React.useState<"cream" | "charcoal" | "gray" | "sage" | "blush" | "ocean" | "lavender" | "midnight" | "forest" | "sunset">("cream");
  const [padding, setPadding] = React.useState<"narrow" | "standard" | "wide">("standard");

  // Category combobox states
  const [categoryInput, setCategoryInput] = React.useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [allCategories, setAllCategories] = React.useState<string[]>(["Technology", "Culture", "Environment", "History", "Science", "Sports", "Arts", "Business", "Health", "Travel"]);
  const categoryRef = React.useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
        setCategoryInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Floating text styling toolbar
  const [selectionRange, setSelectionRange] = React.useState<Range | null>(null);
  const [toolbarVisible, setToolbarVisible] = React.useState(false);
  const [toolbarPos, setToolbarPos] = React.useState({ top: 0, left: 0 });

  // Quick edit block modal for image settings
  const [editingBlock, setEditingBlock] = React.useState<EditorBlock | null>(null);
  const [imgUrl, setImgUrl] = React.useState("");
  const [imgCaption, setImgCaption] = React.useState("");
  const [imgWidth, setImgWidth] = React.useState<string>("100%");
  const [imgFloat, setImgFloat] = React.useState<"none" | "left" | "right">("none");

  // Drag, drop, and resize states
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const [resizingBlockId, setResizingBlockId] = React.useState<string | null>(null);
  const [resizingPercent, setResizingPercent] = React.useState<number | null>(null);

  // Formatting menus and mouse states
  const [fontMenuOpen, setFontMenuOpen] = React.useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = React.useState(false);
  const [isMouseOverToolbar, setIsMouseOverToolbar] = React.useState(false);
  const [isDraggingToolbar, setIsDraggingToolbar] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  // ==========================================
  // HTML PARSING / DESERIALIZATION
  // ==========================================
  const deserializeHTML = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    let targetNode: Element = doc.body;
    let loadedTheme: any = "cream";
    let loadedPadding: any = "standard";

    const container = doc.querySelector(".magazine-article-container");
    if (container) {
      targetNode = container;
      if (container.classList.contains("theme-cream")) loadedTheme = "cream";
      else if (container.classList.contains("theme-charcoal")) loadedTheme = "charcoal";
      else if (container.classList.contains("theme-gray")) loadedTheme = "gray";
      else if (container.classList.contains("theme-sage")) loadedTheme = "sage";
      else if (container.classList.contains("theme-blush")) loadedTheme = "blush";

      const style = container.getAttribute("style") || "";
      if (style.includes("padding: 16px")) loadedPadding = "narrow";
      else if (style.includes("padding: 48px")) loadedPadding = "wide";
    }

    const elements = Array.from(targetNode.children);
    if (elements.length === 0) {
      return {
        blocks: [
          { 
            id: `b-${Math.random().toString(36).slice(2, 6)}`, 
            type: "paragraph" as const, 
            content: "Write your amazing magazine story here... Click to edit this line. Highlight text to format it!" 
          }
        ],
        theme: loadedTheme,
        padding: loadedPadding
      };
    }

    const parsedBlocks = elements.map((el, idx) => {
      const bId = `b-${idx}-${Math.random().toString(36).slice(2, 5)}`;
      const tagName = el.tagName.toLowerCase();

      // Detect visual grids or flexible column layouts
      if (el.classList.contains("magazine-grid") || el.getAttribute("style")?.includes("display: flex")) {
        const cols = Array.from(el.children).map(c => c.innerHTML);
        return {
          id: bId,
          type: "columns" as const,
          content: "",
          colCount: cols.length,
          colContent: cols
        };
      }

      if (tagName.startsWith("h")) {
        return {
          id: bId,
          type: "heading" as const,
          content: el.innerHTML,
          fontSize: tagName === "h1" ? "xlarge" : tagName === "h2" ? "large" : "medium"
        };
      }

      if (tagName === "blockquote") {
        return {
          id: bId,
          type: "quote" as const,
          content: el.innerHTML
        };
      }

      if (tagName === "hr") {
        return {
          id: bId,
          type: "divider" as const,
          content: ""
        };
      }

      if (el.classList.contains("magazine-image-wrap")) {
        const img = el.querySelector("img");
        const cap = el.querySelector(".caption");
        const widthAttr = el.getAttribute("style")?.match(/width:\s*([^;]+)/)?.[1]?.trim() || "100%";
        let floatAttr: any = "none";
        if (el.getAttribute("style")?.includes("float: left")) floatAttr = "left";
        else if (el.getAttribute("style")?.includes("float: right")) floatAttr = "right";

        return {
          id: bId,
          type: "image" as const,
          content: "",
          url: img?.getAttribute("src") || "",
          caption: cap?.innerHTML || img?.getAttribute("alt") || "",
          width: widthAttr as any,
          float: floatAttr
        };
      }

      // Default to regular text paragraph block
      const styleAttr = el.getAttribute("style") || "";
      let align: any = "left";
      if (styleAttr.includes("text-align: center")) align = "center";
      else if (styleAttr.includes("text-align: right")) align = "right";
      else if (styleAttr.includes("text-align: justify")) align = "justify";

      return {
        id: bId,
        type: "paragraph" as const,
        content: el.innerHTML,
        align
      };
    });

    return { blocks: parsedBlocks, theme: loadedTheme, padding: loadedPadding };
  };

  // Sync inputs on article load
  React.useEffect(() => {
    if (reviewEdit) {
      setTitle(reviewEdit.title);
      setSubtitle(reviewEdit.subtitle);
      setCategory(reviewEdit.category);
      setCoverImage(reviewEdit.coverImage);
      
      const parsed = deserializeHTML(reviewEdit.content);
      setBlocks(parsed.blocks);
      setTheme(parsed.theme);
      setPadding(parsed.padding);
    } else if (myDraftEdit) {
      setTitle(myDraftEdit.title);
      setSubtitle(myDraftEdit.subtitle);
      setCategory(myDraftEdit.category);
      setCoverImage(myDraftEdit.coverImage);
      
      const parsed = deserializeHTML(myDraftEdit.content);
      setBlocks(parsed.blocks);
      setTheme(parsed.theme);
      setPadding(parsed.padding);
    } else if (existingArt) {
      setTitle(existingArt.title);
      setSubtitle(existingArt.subtitle);
      setCategory(existingArt.category);
      setCoverImage(existingArt.coverImage);
      
      const parsed = deserializeHTML(existingArt.content);
      setBlocks(parsed.blocks);
      setTheme(parsed.theme);
      setPadding(parsed.padding);
    } else {
      // Create empty boilerplate templates
      setTitle("The Digital Frontier: A New Era");
      setSubtitle("Exploring high-speed academic innovations across campus.");
      setCategory("Technology");
      setCoverImage("https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1200");
      setBlocks([
        { id: "b1", type: "heading", content: "The Journey Begins Here", fontSize: "large" },
        { id: "b2", type: "paragraph", content: "In the spring semester of last year, a quiet revolution took hold across campus. It didn't arrive with banners or protest lines. Instead, it surfaced in the soft blue glow of library screens at 2:00 AM, in the shifting formats of research drafts, and in the hesitant pauses of faculty lectures." },
        { id: "b3", type: "quote", content: "The classroom is no longer a monologue. It has become a dialogue between student, professor, and the vast indexed intelligence of the web." },
        { id: "b4", type: "paragraph", content: "Define where the machine ends and the writer begins. This is the central editorial puzzle of our generation." }
      ]);
      setTheme("cream");
      setPadding("standard");
    }
  }, [id, existingArt, reviewEditId, reviewEdit, myDraftEdit]);

  // ==========================================
  // HTML SERIALIZATION
  // ==========================================
  const serializeHTML = (blocksList: EditorBlock[], currentTheme: string, currentPadding: string): string => {
    const innerHtml = blocksList.map(block => {
      const alignStyle = block.align ? `text-align: ${block.align};` : "";
      const colorStyle = block.color ? `color: ${block.color};` : "";
      
      let sizeStyle = "";
      if (block.fontSize === "small") sizeStyle = "font-size: 0.875rem;";
      else if (block.fontSize === "medium") sizeStyle = "font-size: 1.125rem;";
      else if (block.fontSize === "large") sizeStyle = "font-size: 1.5rem;";
      else if (block.fontSize === "xlarge") sizeStyle = "font-size: 2.25rem;";

      let fontStyle = "";
      if (block.fontStyle === "serif") fontStyle = "font-family: 'Playfair Display', Georgia, serif;";
      else if (block.fontStyle === "sora") fontStyle = "font-family: 'Sora', sans-serif;";
      else if (block.fontStyle === "jakarta") fontStyle = "font-family: 'Plus Jakarta Sans', sans-serif;";
      else if (block.fontStyle === "mono") fontStyle = "font-family: 'Courier Prime', Courier, monospace;";
      else if (block.fontStyle === "script") fontStyle = "font-family: 'Dancing Script', cursive;";

      const combinedStyle = [alignStyle, colorStyle, sizeStyle, fontStyle].filter(Boolean).join(" ");
      const styleAttr = combinedStyle ? `style="${combinedStyle}"` : "";

      switch (block.type) {
        case "heading":
          return `<h2 ${styleAttr}>${block.content}</h2>`;
        case "quote":
          return `<blockquote style="padding-left: 24px; border-left: 4px solid var(--primary); font-style: italic; font-size: 1.25rem; margin: 24px 0; ${combinedStyle}">${block.content}</blockquote>`;
        case "image":
          const imgFloat = block.float && block.float !== "none" ? `float: ${block.float}; margin: 8px ${block.float === "left" ? "20px" : "0"} 16px ${block.float === "right" ? "20px" : "0"};` : "display: block; margin: 24px auto;";
          const imgWidth = block.width ? `width: ${block.width};` : "width: 100%;";
          return `<div class="magazine-image-wrap" style="${imgFloat} ${imgWidth} text-align: center;">
            <img src="${block.url || ''}" alt="${block.caption || ''}" style="max-width: 100%; border-radius: 8px;" />
            ${block.caption ? `<div class="caption" style="font-size: 0.8rem; color: var(--muted-foreground); margin-top: 8px;">${block.caption}</div>` : ""}
          </div>`;
        case "columns":
          const colContentHtml = (block.colContent || []).map(content => `<div class="magazine-column" style="flex: 1; min-width: 200px; padding: 4px;">${content}</div>`).join("");
          return `<div class="magazine-grid" style="display: flex; flex-wrap: wrap; gap: 24px; margin: 24px 0;">${colContentHtml}</div>`;
        case "divider":
          return `<hr style="border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.3), rgba(0,0,0,0)); margin: 32px 0;" />`;
        case "paragraph":
        default:
          return `<p ${styleAttr}>${block.content}</p>`;
      }
    }).join("\n");

    let themeStyles = "";
    if (currentTheme === "cream") themeStyles = "background-color: #fbf9f4; color: #2c2a29; font-family: 'Playfair Display', Georgia, serif;";
    else if (currentTheme === "charcoal") themeStyles = "background-color: #121212; color: #f5f5f5; font-family: 'Inter', sans-serif;";
    else if (currentTheme === "gray") themeStyles = "background-color: #f5f6f8; color: #1e293b; font-family: 'Plus Jakarta Sans', sans-serif;";
    else if (currentTheme === "sage") themeStyles = "background-color: #f0f4f1; color: #1e352f; font-family: 'Sora', sans-serif;";
    else if (currentTheme === "blush") themeStyles = "background-color: #fdf6f6; color: #401e1e; font-family: 'Playfair Display', serif;";

    let padStyle = "padding: 32px;";
    if (currentPadding === "narrow") padStyle = "padding: 16px;";
    else if (currentPadding === "wide") padStyle = "padding: 48px;";

    return `<div class="magazine-article-container theme-${currentTheme}" style="${themeStyles} ${padStyle} border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); min-height: 500px; box-shadow: var(--shadow-premium);">
      ${innerHtml}
    </div>`;
  };

  const handleSaveCollaboratorDraft = (summary: string = "Suggested edits") => {
    if (!title.trim()) {
      toast({
        title: "Validation Failure",
        description: "Title field cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    const serializedHtml = serializeHTML(blocks, theme, padding);
    saveCollaboratorEdit(
      existingArt!.id,
      title,
      subtitle,
      category,
      coverImage,
      serializedHtml,
      summary,
      "draft"
    );
    toast({
      title: "Collaborator Draft Saved ✅",
      description: "Your suggested changes have been stored to your draft fork.",
      variant: "success"
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Failure",
        description: "Title field cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    const serializedHtml = serializeHTML(blocks, theme, padding);

    try {
      if (existingArt) {
        await updateArticle(existingArt.id, {
          title,
          subtitle,
          category,
          coverImage,
          content: serializedHtml
        });
        toast({
          title: "Workspace Saved ✅",
          description: `Successfully stored and committed design of "${title}".`,
          variant: "success"
        });
      } else {
        const fresh = await createArticle(title, subtitle, category, coverImage, serializedHtml);
        toast({
          title: "Workspace Launched 🚀",
          description: `Successfully initialized "${title}" in local database.`,
          variant: "success"
        });
        navigate(`/app/editor-tool/${fresh.id}`);
      }
    } catch (err) {
      toast({ title: "Save Failed", description: "Could not save the article.", variant: "destructive" });
    }
  };

  // ==========================================
  // FLOATING TEXT FORMATTING TOOLBAR
  // ==========================================
  const handleTextSelection = () => {
    if (isMouseOverToolbar) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setToolbarVisible(false);
      return;
    }

    const range = sel.getRangeAt(0);
    setSelectionRange(range);

    const rect = range.getBoundingClientRect();
    setToolbarPos({
      top: rect.top + window.scrollY - 54, // Above the text
      left: rect.left + window.scrollX + (rect.width / 2) - 150 // Center aligned
    });
    setToolbarVisible(true);
  };

  React.useEffect(() => {
    const handleSelectionChange = () => {
      // Delay selection capture to prevent quick mouse down glitches
      setTimeout(handleTextSelection, 100);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isMouseOverToolbar]);

  // Real-time draggable logic for the floating toolbar
  React.useEffect(() => {
    if (!isDraggingToolbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      setToolbarPos({
        top: e.pageY - dragOffset.y,
        left: e.pageX - dragOffset.x
      });
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingToolbar, dragOffset]);

  const handleToolbarDragStart = (e: React.MouseEvent) => {
    setIsDraggingToolbar(true);
    setDragOffset({
      x: e.pageX - toolbarPos.left,
      y: e.pageY - toolbarPos.top
    });
  };

  const formatText = (command: string, value: string = "") => {
    if (selectionRange) {
      // Re-apply range to selection in case focus was lost
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selectionRange);
      document.execCommand(command, false, value);
      
      setFontMenuOpen(false);
      setSizeMenuOpen(false);
    }
  };

  // ==========================================
  // CANVAS BLOCK OPERATIONS
  // ==========================================
  const updateBlockContent = (id: string, text: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: text } : b));
  };

  const updateColumnContent = (blockId: string, colIndex: number, text: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.colContent) {
        const copy = [...b.colContent];
        copy[colIndex] = text;
        return { ...b, colContent: copy };
      }
      return b;
    }));
  };

  const insertBlockAt = (index: number, type: EditorBlock["type"]) => {
    const newBlock: EditorBlock = {
      id: `b-${Math.random().toString(36).slice(2, 6)}`,
      type,
      content: type === "paragraph" ? "Start writing your paragraph..." :
               type === "heading" ? "New Section Heading" :
               type === "quote" ? "Inspiring pull-quote..." : "",
      align: "left",
      fontSize: type === "heading" ? "large" : "medium"
    };

    if (type === "image") {
      newBlock.url = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600";
      newBlock.caption = "Insert an absolute image URL in settings";
      newBlock.width = "100%";
      newBlock.float = "none";
    }

    if (type === "columns") {
      newBlock.colCount = 2;
      newBlock.colContent = ["Left column details...", "Right column details..."];
    }

    const copy = [...blocks];
    copy.splice(index + 1, 0, newBlock);
    setBlocks(copy);
    toast({
      title: "Block Injected",
      description: `Successfully added ${type.toUpperCase()} block in gap line.`,
      variant: "success"
    });
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast({
        title: "Deletion Failure",
        description: "Your magazine editor needs at least one block to type in.",
        variant: "destructive"
      });
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const duplicateBlock = (block: EditorBlock) => {
    const copyBlock: EditorBlock = {
      ...block,
      id: `b-dup-${Math.random().toString(36).slice(2, 6)}`,
      colContent: block.colContent ? [...block.colContent] : undefined
    };
    const index = blocks.findIndex(b => b.id === block.id);
    const copy = [...blocks];
    copy.splice(index + 1, 0, copyBlock);
    setBlocks(copy);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setBlocks(copy);
  };

  // Image editing popup modal helpers
  const openImageSettings = (block: EditorBlock) => {
    setEditingBlock(block);
    setImgUrl(block.url || "");
    setImgCaption(block.caption || "");
    setImgWidth(block.width || "100%");
    setImgFloat(block.float || "none");
  };

  const saveImageSettings = () => {
    if (!editingBlock) return;
    setBlocks(prev => prev.map(b => b.id === editingBlock.id ? {
      ...b,
      url: imgUrl,
      caption: imgCaption,
      width: imgWidth,
      float: imgFloat
    } : b));
    setEditingBlock(null);
    toast({
      title: "Image Configured",
      description: "Successfully updated cover URL and sizing alignments.",
      variant: "success"
    });
  };

  // ==========================================
  // IMAGE UPLOAD, DND, AND RESIZE HELPERS
  // ==========================================
  const triggerLocalImageUpload = (insertIndex: number, callback?: (url: string, name: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          if (callback) {
            callback(base64Url, file.name);
          } else {
            const newBlock: EditorBlock = {
              id: `b-${Math.random().toString(36).slice(2, 6)}`,
              type: "image",
              content: "",
              url: base64Url,
              caption: file.name,
              width: "100%",
              float: "none"
            };
            const copy = [...blocks];
            copy.splice(insertIndex + 1, 0, newBlock);
            setBlocks(copy);
            toast({
              title: "Image Uploaded 🚀",
              description: `Successfully uploaded "${file.name}" from File Explorer.`,
              variant: "success"
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleResizeStart = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const targetElement = document.getElementById(`img-wrap-${blockId}`);
    if (!targetElement) return;
    
    const startWidth = targetElement.offsetWidth;
    const parentSheet = targetElement.parentElement;
    if (!parentSheet) return;
    const containerWidth = parentSheet.offsetWidth;

    setResizingBlockId(blockId);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidthPx = Math.max(100, Math.min(containerWidth, startWidth + deltaX));
      const percent = Math.round((newWidthPx / containerWidth) * 100);
      setResizingPercent(percent);
      
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, width: `${percent}%` } : b));
    };

    const handleMouseUp = () => {
      setResizingBlockId(null);
      setResizingPercent(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isReadOnly || draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesDropped(e.dataTransfer.files, index);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedIndex === null) return;
    if (draggedIndex !== index) {
      const copy = [...blocks];
      const [draggedBlock] = copy.splice(draggedIndex, 1);
      copy.splice(index, 0, draggedBlock);
      setBlocks(copy);
      toast({
        title: "Block Repositioned 📂",
        description: `Successfully moved ${draggedBlock.type.toUpperCase()} block.`,
        variant: "success"
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleFilesDropped = (files: FileList, index: number) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    let insertedCount = 0;
    imageFiles.forEach((file, fIdx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        const newBlock: EditorBlock = {
          id: `b-${Math.random().toString(36).slice(2, 6)}-${Date.now()}`,
          type: "image",
          content: "",
          url: base64Url,
          caption: file.name,
          width: "100%",
          float: "none"
        };
        
        setBlocks(prev => {
          const copy = [...prev];
          copy.splice(index + 1 + fIdx, 0, newBlock);
          return copy;
        });

        insertedCount++;
        if (insertedCount === imageFiles.length) {
          toast({
            title: "Images Uploaded 🚀",
            description: `Successfully uploaded ${imageFiles.length} file(s) via Drag-and-Drop!`,
            variant: "success"
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper block background and text matches
  let themeBg = "bg-[#fbf9f4] text-[#2c2a29] font-serif";
  if (theme === "charcoal") themeBg = "bg-[#121212] text-[#f5f5f5] font-sans";
  else if (theme === "gray") themeBg = "bg-[#f5f6f8] text-[#1e293b] font-sans";
  else if (theme === "sage") themeBg = "bg-[#f0f4f1] text-[#1e352f] font-sans";
  else if (theme === "blush") themeBg = "bg-[#fdf6f6] text-[#401e1e] font-serif";
  else if (theme === "ocean") themeBg = "bg-[#f0f7ff] text-[#0c2340] font-sans";
  else if (theme === "lavender") themeBg = "bg-[#f5f0ff] text-[#2d1b69] font-serif";
  else if (theme === "midnight") themeBg = "bg-[#0d1117] text-[#e6edf3] font-sans";
  else if (theme === "forest") themeBg = "bg-[#f0f5f1] text-[#1a2e1f] font-serif";
  else if (theme === "sunset") themeBg = "bg-[#fff7f0] text-[#4a1a00] font-serif";

  let padClass = "p-8";
  if (padding === "narrow") padClass = "p-4";
  else if (padding === "wide") padClass = "p-12";

  return (
    <div className="space-y-8 select-none">
      
      {/* 1. TOP HEADER BANNER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
            <PenTool className="h-3 w-3" />
            Canva-Style Interactive Magazine Builder
          </span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Visual E-Magazine Workspace</h1>
          <p className="text-muted-foreground text-xs">Direct canvas writing experience. Hides code behind natural editor tools.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl cursor-pointer" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          
          {existingArt && !reviewEditId && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-1.5 rounded-xl cursor-pointer border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => navigate(`/app/version-history/${existingArt.id}`)}
            >
              <History className="h-4 w-4" />
              <span>Timeline Logs</span>
            </Button>
          )}

          {reviewEdit ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-1.5 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5" 
                onClick={() => {
                  rejectCollaboratorEdit(reviewEdit.id, "Declined proposed changes.");
                  toast({
                    title: "Revision Declined ❌",
                    description: "Successfully declined and closed collaborator's edits.",
                    variant: "destructive"
                  });
                  navigate("/app/admin");
                }}
              >
                Decline Changes
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-premium" 
                onClick={() => {
                  const serializedHtml = serializeHTML(blocks, theme, padding);
                  // Update collaborator fork content first
                  saveCollaboratorEdit(
                    reviewEdit.articleId,
                    title,
                    subtitle,
                    category,
                    coverImage,
                    serializedHtml,
                    reviewEdit.changeSummary,
                    "pending_admin_review"
                  );
                  // Merge it
                  mergeCollaboratorEdit(reviewEdit.id, "Approved and merged by Admin.");
                  toast({
                    title: "Revision Merged & Published! 🎉",
                    description: `"${title}" has been updated and published by Admin successfully.`,
                    variant: "success"
                  });
                  navigate("/app/admin");
                }}
              >
                Approve & Merge Edits
              </Button>
            </>
          ) : !isAuthor ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-1.5 rounded-xl cursor-pointer" 
                onClick={() => handleSaveCollaboratorDraft("Manual save")}
              >
                <Save className="h-4 w-4" />
                <span>Save Draft Fork</span>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-premium" 
                onClick={() => {
                  setChangeSummary("");
                  setShowSubmitDialog(true);
                }}
              >
                <span>Submit to Admin</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" className="h-9 gap-1.5 rounded-xl cursor-pointer shadow-premium" onClick={handleSave}>
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </Button>
              {canPublish && existingArt && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    handleSave();
                    publishArticle(existingArt.id);
                    toast({ title: "Published", description: "Magazine is live — no approval required for admins.", variant: "success" });
                    navigate(isAdmin ? "/app/admin" : "/app");
                  }}
                >
                  <span>Publish Directly</span>
                </Button>
              )}
              {!canPublish && existingArt && ["draft", "rejected", "needs_corrections"].includes(existingArt.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  onClick={() => {
                    handleSave();
                    submitForReview(existingArt.id);
                    toast({ title: "Submitted for Approval", description: "An admin will review your highlighted changes.", variant: "success" });
                    navigate("/app");
                  }}
                >
                  <span>Submit for Approval</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* CONTEXTUAL BANNERS */}
      {reviewEdit && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 text-xs flex items-center justify-between shadow-premium select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
            <span className="text-left leading-normal">
              <strong>Admin Audit Mode:</strong> You are auditing proposed layout modifications by <strong>{reviewEdit.collaboratorName}</strong> on <em>"{existingArt?.title}"</em>. You can modify their blocks and click <strong>Approve & Merge Edits</strong> to make them public.
            </span>
          </div>
          <Badge variant="warning">Awaiting Review</Badge>
        </div>
      )}

      {existingArt?.status === "rejected" && existingArt.rejectionReason && isAuthor && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs select-none">
          <strong>Rejected:</strong> {existingArt.rejectionReason}
        </div>
      )}

      {existingArt && !isAuthor && !reviewEdit && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs flex items-center justify-between shadow-premium select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-left leading-normal">
              <strong>Suggest Edit Mode:</strong> You are proposing changes to <strong>{existingArt.authorName}</strong>'s magazine <em>"{existingArt.title}"</em>. You can <strong>modify existing content</strong> or <strong>add brand new blocks</strong>. Nothing goes live until the Admin reviews and approves your submission.
            </span>
          </div>
          <Badge variant="purple">{myDraftEdit ? "Draft Active" : "New Suggestion"}</Badge>
        </div>
      )}

      {/* 2. THREE-PANEL EDITOR WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
        
        {/* LEFT PANEL: Block Elements & Settings Drawer */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          {isReadOnly ? (
            <Card className="p-5 border-primary/30 bg-primary/5 space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  Admin Moderation Hub
                </span>
                <h3 className="font-sora font-extrabold text-base text-foreground leading-tight">Editorial Audit</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  As an administrator, you are audit-verifying another writer's magazine. Suggest comments directly, or publish/request corrections using the controls below.
                </p>
              </div>

              <div className="h-px bg-border/50" />

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Original Author</span>
                <div className="flex items-center gap-2 mt-1">
                  <img src={existingArt?.authorAvatar} className="h-8 w-8 rounded-full border border-primary/20 object-cover" />
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground">{existingArt?.authorName}</h4>
                    <span className="text-[9px] text-muted-foreground">Writer/Editor ID: {existingArt?.authorId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  type="button" 
                  variant="default"
                  className="w-full h-10 rounded-xl font-extrabold text-xs gap-1.5 shadow-premium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  onClick={() => {
                    if (existingArt) {
                      if (existingArt.status === "pending_review") {
                        approveSubmission(existingArt.id);
                      } else {
                        publishArticle(existingArt.id);
                      }
                      toast({
                        title: "Article Published Successfully! 🎉",
                        description: `"${existingArt.title}" is now visible publicly.`,
                        variant: "success"
                      });
                      navigate("/app/admin/pending");
                    }
                  }}
                >
                  <span>Approve & Publish Live</span>
                </Button>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-10 rounded-xl font-extrabold text-xs gap-1.5 border-destructive/30 hover:bg-destructive/5 text-destructive cursor-pointer"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <span>Reject with Reason</span>
                </Button>

                {existingArt?.status === "pending_review" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 rounded-xl font-extrabold text-xs"
                    onClick={() => navigate(`/app/admin/review/${existingArt.id}`)}
                  >
                    Open Diff Review
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <h3 className="font-sora font-extrabold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-primary">
                  <Settings className="h-4 w-4" />
                  <span>Magazine Layout</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5" ref={categoryRef}>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Publication Category</span>

                    {/* Selected Category Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                        {category}
                        <button
                          type="button"
                          onClick={() => setCategory("Technology")}
                          className="hover:text-destructive transition-colors leading-none"
                        >×</button>
                      </span>
                    </div>

                    {/* Combobox Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => {
                          setCategoryInput(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Search or create category..."
                        className="w-full h-8 px-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                      />

                      {showCategoryDropdown && (
                        <div className="absolute top-9 left-0 right-0 bg-card border border-border rounded-xl shadow-premium z-50 py-1 max-h-[200px] overflow-y-auto">
                          {/* Filtered existing categories */}
                          {allCategories
                            .filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
                            .map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setCategory(cat);
                                  setCategoryInput("");
                                  setShowCategoryDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors block ${
                                  category === cat ? "text-primary font-extrabold bg-primary/5" : "text-foreground"
                                }`}
                              >
                                {cat} {category === cat && "✓"}
                              </button>
                            ))
                          }

                          {/* Create new option */}
                          {categoryInput.trim() && !allCategories.some(c => c.toLowerCase() === categoryInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const newCat = categoryInput.trim();
                                setAllCategories(prev => [...prev, newCat]);
                                setCategory(newCat);
                                setCategoryInput("");
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center gap-1.5 border-t border-border mt-1 pt-2"
                            >
                              <Plus className="h-3 w-3" />
                              Create &ldquo;{categoryInput.trim()}&rdquo;
                            </button>
                          )}

                          {allCategories.filter(c => c.toLowerCase().includes(categoryInput.toLowerCase())).length === 0 && !categoryInput.trim() && (
                            <p className="text-center text-[10px] text-muted-foreground py-3">No categories found</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Cover Banner Image URL</span>
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="https://images.unsplash.com/... or uploaded local" 
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="h-9 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs gap-1 rounded-xl cursor-pointer shrink-0"
                        onClick={() => triggerLocalImageUpload(0, (url) => setCoverImage(url))}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Upload</span>
                      </Button>
                    </div>
                  </div>

                  {coverImage && (
                    <div className="rounded-lg overflow-hidden border border-border shadow-sm">
                      <img src={coverImage} className="h-20 w-full object-cover" alt="Cover preview" />
                    </div>
                  )}

                  <div className="h-px bg-border/40 my-3" />

                  {/* Layout Page Background Settings */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Page Background Theme</span>
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        { key: "cream",    bg: "#fbf9f4", border: "#8B7355", label: "Cream" },
                        { key: "charcoal", bg: "#121212", border: "#f5f5f5", label: "Charcoal" },
                        { key: "gray",     bg: "#f5f6f8", border: "#1e293b", label: "Slate" },
                        { key: "sage",     bg: "#f0f4f1", border: "#1e352f", label: "Sage" },
                        { key: "blush",    bg: "#fdf6f6", border: "#e57373", label: "Blush" },
                        { key: "ocean",    bg: "#f0f7ff", border: "#1565C0", label: "Ocean" },
                        { key: "lavender", bg: "#f5f0ff", border: "#7c3aed", label: "Lavender" },
                        { key: "midnight", bg: "#0d1117", border: "#58a6ff", label: "Midnight" },
                        { key: "forest",   bg: "#f0f5f1", border: "#2e7d32", label: "Forest" },
                        { key: "sunset",   bg: "#fff7f0", border: "#e65100", label: "Sunset" },
                      ] as const).map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTheme(t.key as typeof theme)}
                          title={t.label}
                          style={{ backgroundColor: t.bg, borderColor: t.border }}
                          className={`h-7 w-7 rounded-full border-2 cursor-pointer transition-all ${
                            theme === t.key ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground capitalize">
                      Active: <strong>{theme}</strong> theme
                    </p>
                  </div>

                  {/* Page Padding Margins */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Page Margins Padding</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(["narrow", "standard", "wide"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPadding(p)}
                          className={`h-7 rounded-lg border text-[10px] font-bold capitalize cursor-pointer transition-all ${
                            padding === p
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Click elements addition box */}
              <Card className="p-5">
                <h3 className="font-sora font-extrabold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-primary">
                  <Plus className="h-4 w-4" />
                  <span>Block Library</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-left">
                  <button 
                    type="button"
                    onClick={() => insertBlockAt(blocks.length - 1, "paragraph")}
                    className="p-3 border border-border bg-background hover:bg-primary/5 hover:border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                  >
                    <Type className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-extrabold block">Text Block</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => insertBlockAt(blocks.length - 1, "heading")}
                    className="p-3 border border-border bg-background hover:bg-primary/5 hover:border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                  >
                    <Heading2 className="h-4 w-4 text-purple-500" />
                    <span className="text-[10px] font-extrabold block">Heading</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => insertBlockAt(blocks.length - 1, "quote")}
                    className="p-3 border border-border bg-background hover:bg-primary/5 hover:border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                  >
                    <Quote className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-extrabold block">Pull-Quote</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => triggerLocalImageUpload(blocks.length - 1)}
                    className="p-3 border border-border bg-background hover:bg-primary/5 hover:border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                  >
                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-extrabold block">Design Image</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => insertBlockAt(blocks.length - 1, "columns")}
                    className="p-3 border border-border bg-background hover:bg-primary/5 hover:border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center col-span-2"
                  >
                    <Grid className="h-4 w-4 text-pink-500" />
                    <span className="text-[10px] font-extrabold block">2-Column Layout Grid</span>
                  </button>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* CENTER PANEL: Interactive Canvas (magazine physical page sheet) */}
        <div className="lg:col-span-9">
          
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-extrabold text-foreground">
              Type directly on the canvas sheet below. Highlighting any text triggers the Word/Canva editing toolbar. Double-click images or columns to update layouts.
            </span>
          </div>

          {/* Core Page Sheet */}
          <div 
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              if (!isReadOnly && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                handleFilesDropped(e.dataTransfer.files, blocks.length - 1);
              }
            }}
            className={`rounded-3xl border border-border shadow-premium transition-all ${themeBg} ${padClass}`}
          >
            
            {/* Header elements inside the Page */}
            <div className="space-y-4 border-b border-border/20 pb-6 mb-8 text-left">
              <div 
                contentEditable={!isReadOnly}
                suppressContentEditableWarning={true}
                {...{ placeholder: "Magazine Headline..." }}
                className="w-full font-sora font-extrabold text-3xl sm:text-5xl bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:opacity-30 leading-tight min-h-[48px] cursor-text empty:before:content-[attr(placeholder)] empty:before:text-muted-foreground/30 focus:before:content-none selection:bg-primary/20"
                onBlur={(e) => setTitle(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: title }}
              />
              
              <div 
                contentEditable={!isReadOnly}
                suppressContentEditableWarning={true}
                {...{ placeholder: "Sub-headline / Tagline..." }}
                className="w-full text-sm sm:text-base font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 resize-none min-h-[36px] cursor-text placeholder:opacity-30 leading-relaxed empty:before:content-[attr(placeholder)] empty:before:text-muted-foreground/30 focus:before:content-none selection:bg-primary/20"
                onBlur={(e) => setSubtitle(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            </div>

            {/* Loop over blocks rendering them inline on the page */}
            <div className="space-y-4">
              {blocks.map((block, index) => {
                
                // Block alignment layout styles
                let textClass = "font-serif text-base sm:text-lg leading-relaxed text-left focus:outline-none outline-none";
                if (block.align === "center") textClass += " text-center";
                else if (block.align === "right") textClass += " text-right";
                else if (block.align === "justify") textClass += " text-justify";

                if (block.fontStyle === "serif") textClass += " font-serif";
                else if (block.fontStyle === "sans") textClass += " font-sans";
                else if (block.fontStyle === "mono") textClass += " font-mono";
                else if (block.fontStyle === "sora") textClass += " font-sora";
                else if (block.fontStyle === "jakarta") textClass += " font-jakarta";

                let sizeClass = "";
                if (block.fontSize === "small") sizeClass = "text-xs sm:text-sm";
                else if (block.fontSize === "large") sizeClass = "text-xl sm:text-2xl font-bold";
                else if (block.fontSize === "xlarge") sizeClass = "text-3xl sm:text-4xl font-extrabold";

                return (
                  <div 
                    key={block.id} 
                    draggable={!isReadOnly && activeDragId === block.id}
                    onDragStart={(e) => {
                      if (activeDragId !== block.id) { e.preventDefault(); return; }
                      handleDragStart(e, index);
                    }}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => { handleDragEnd(); setActiveDragId(null); }}
                    className={`relative group/block my-2 transition-all duration-200 ${
                      draggedIndex === index ? "opacity-30 border border-dashed border-primary rounded-xl" : ""
                    }`}
                  >
                    
                    {/* Visual drag drop insertion placeholder line */}
                    {dragOverIndex === index && draggedIndex !== index && (
                      <div className="w-full h-1 bg-primary rounded my-2 animate-pulse" />
                    )}

                    {/* Visual separation line gap on top for insertion */}
                    {!isReadOnly && (
                      <div className="absolute -top-3 left-0 right-0 h-4 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20">
                        <div className="w-full h-px border-t border-dashed border-primary/40 relative flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => insertBlockAt(index - 1, "paragraph")}
                            className="absolute -top-2 px-2 py-0.5 bg-primary text-white text-[9px] font-extrabold rounded-full flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>Insert block here</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Left/Right hovering Block tool actions */}
                    {!isReadOnly && (
                      <div className="absolute right-0 -top-8 hidden group-hover/block:flex items-center gap-1 bg-card border border-border shadow-md rounded-lg p-1 z-30 select-none">
                        {/* Drag Handle Grip - hold to drag the block */}
                        <div 
                          title="Hold & drag to reposition block"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveDragId(block.id);
                          }}
                          onMouseUp={() => setActiveDragId(null)}
                          className="p-1 hover:bg-primary/10 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
                        >
                          <GripVertical className="h-3 w-3" />
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => moveBlock(index, "up")}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 hover:bg-accent rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveBlock(index, "down")}
                          disabled={index === blocks.length - 1}
                          title="Move Down"
                          className="p-1 hover:bg-accent rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => duplicateBlock(block)}
                          title="Duplicate"
                          className="p-1 hover:bg-accent rounded cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {block.type === "image" && (
                          <button 
                            type="button"
                            onClick={() => openImageSettings(block)}
                            title="Image Settings"
                            className="p-1 hover:bg-accent rounded text-primary cursor-pointer"
                          >
                            <Settings className="h-3 w-3" />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          title="Delete block"
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Rendering different block types natively inside contentEditable */}
                    {block.type === "paragraph" && (
                      <div 
                        contentEditable={!isReadOnly}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => updateBlockContent(block.id, e.currentTarget.innerHTML)}
                        className={`min-h-[24px] ${textClass} ${sizeClass}`}
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    )}

                    {block.type === "heading" && (
                      <div 
                        contentEditable={!isReadOnly}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => updateBlockContent(block.id, e.currentTarget.innerHTML)}
                        className={`font-sora font-extrabold text-foreground ${sizeClass || "text-xl sm:text-2xl"} mt-6 mb-2 focus:outline-none`}
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    )}

                    {block.type === "quote" && (
                      <div className="pl-6 border-l-4 border-primary my-6 italic text-muted-foreground">
                        <div 
                          contentEditable={!isReadOnly}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateBlockContent(block.id, e.currentTarget.innerHTML)}
                          className="min-h-[24px] focus:outline-none text-base sm:text-lg"
                          dangerouslySetInnerHTML={{ __html: block.content }}
                        />
                      </div>
                    )}

                    {block.type === "divider" && (
                      <div className="py-4">
                        <hr className="border-t border-border/40 w-1/3 mx-auto" />
                      </div>
                    )}

                    {block.type === "image" && (
                      <div 
                        id={`img-wrap-${block.id}`}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isReadOnly) openImageSettings(block);
                        }}
                        onDragStart={(e) => e.preventDefault()}
                        className={`magazine-image-wrap rounded-xl overflow-hidden my-6 border border-border/50 bg-accent/20 select-none group/img relative`}
                        style={{
                          float: block.float || "none",
                          width: block.width || "100%",
                          margin: block.float !== "none" ? "8px 16px 16px 16px" : "24px auto"
                        }}
                      >
                        <img 
                          src={block.url} 
                          alt="" 
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          className="w-full object-cover max-h-[400px] hover:scale-101 transition-transform pointer-events-none" 
                        />
                        
                        {/* Interactive Resize Handle */}
                        {!isReadOnly && (
                          <div 
                            className="absolute bottom-12 right-3 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center cursor-se-resize shadow-md hover:scale-110 active:scale-95 transition-transform z-30 opacity-0 group-hover/img:opacity-100 duration-200"
                            onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, block.id); }}
                            title="Drag to resize image width"
                          >
                            <span className="text-[10px] font-bold text-white leading-none">↔</span>
                          </div>
                        )}

                        {/* Visual Resize Percentage overlay */}
                        {resizingBlockId === block.id && resizingPercent !== null && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
                            <Badge className="bg-primary text-white font-extrabold text-sm px-3 py-1 shadow-lg border-0">
                              Width: {resizingPercent}%
                            </Badge>
                          </div>
                        )}

                        <div className="p-2 bg-background/80 border-t border-border flex items-center justify-between text-xs text-muted-foreground relative z-10">
                          <span className="font-semibold italic truncate max-w-[80%]">{block.caption || "Double-click image to configure"}</span>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); openImageSettings(block); }}
                              className="text-[9px] uppercase font-bold shrink-0 text-primary hover:underline cursor-pointer"
                            >
                              Click Settings
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {block.type === "columns" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 border border-dashed border-border/60 p-4 rounded-2xl bg-accent/5">
                        {(block.colContent || ["Left col...", "Right col..."]).map((colText, cIdx) => (
                          <div key={cIdx} className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground select-none font-bold">Column {cIdx + 1}</span>
                            <div 
                              contentEditable={!isReadOnly}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => updateColumnContent(block.id, cIdx, e.currentTarget.innerHTML)}
                              className="font-serif text-sm sm:text-base leading-relaxed focus:outline-none p-2 border border-border/30 bg-background/50 rounded-lg min-h-[100px]"
                              dangerouslySetInnerHTML={{ __html: colText }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Bottom-most insertion point for blocks */}
            {!isReadOnly && (
              <div className="mt-8 border-t border-border/20 pt-6 flex items-center justify-center gap-2 select-none">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1 cursor-pointer"
                  onClick={() => insertBlockAt(blocks.length - 1, "paragraph")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Paragraph</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1 cursor-pointer"
                  onClick={() => triggerLocalImageUpload(blocks.length - 1)}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Add Image</span>
                </Button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 3. FLOATING RICH TEXT FORMATTING TOOLBAR */}
      {toolbarVisible && (
        <div 
          className="fixed z-50 flex flex-wrap items-center gap-1 sm:gap-1.5 bg-sidebar border border-sidebar-border shadow-premium rounded-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 select-none max-w-[95vw] sm:max-w-none justify-center"
          style={{
            top: toolbarPos.top,
            left: Math.max(10, toolbarPos.left)
          }}
          onMouseEnter={() => setIsMouseOverToolbar(true)}
          onMouseLeave={() => setIsMouseOverToolbar(false)}
        >
          {/* Drag Handle */}
          <div 
            className="h-8 w-6 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-white rounded flex items-center justify-center cursor-move transition-all active:scale-95 shrink-0 border border-transparent hover:border-sidebar-border"
            onMouseDown={(e) => {
              e.preventDefault();
              handleToolbarDragStart(e);
            }}
            title="Drag Toolbar"
          >
            <GripHorizontal className="h-3.5 w-3.5" />
          </div>

          <div className="w-px h-6 bg-sidebar-accent shrink-0" />

          {/* Typographic modifiers */}
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatText("bold")}
            title="Bold"
            className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatText("italic")}
            title="Italic"
            className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatText("underline")}
            title="Underline"
            className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-6 bg-sidebar-accent mx-0.5 sm:mx-1 shrink-0" />

          {/* Custom Fonts Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setFontMenuOpen(!fontMenuOpen);
                setSizeMenuOpen(false);
              }}
              className="h-8 px-2.5 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white rounded flex items-center gap-1 text-[10px] font-extrabold cursor-pointer transition-all border border-sidebar-border/30 bg-background/5"
            >
              <span>Font Style</span>
              <span className="text-[7px] opacity-70">▼</span>
            </button>
            {fontMenuOpen && (
              <div 
                className="absolute bottom-10 left-0 bg-sidebar border border-sidebar-border shadow-premium rounded-xl py-1 z-50 min-w-[150px] max-h-[220px] overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {[
                  { name: "Serif (Playfair)", value: "'Playfair Display', serif" },
                  { name: "Lora Serif", value: "Lora, serif" },
                  { name: "Merriweather", value: "Merriweather, serif" },
                  { name: "Sans (Poppins)", value: "Poppins, sans-serif" },
                  { name: "Montserrat", value: "Montserrat, sans-serif" },
                  { name: "Roboto", value: "Roboto, sans-serif" },
                  { name: "Open Sans", value: "'Open Sans', sans-serif" },
                  { name: "Monospace", value: "monospace" },
                  { name: "Times New Roman", value: "'Times New Roman'" }
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      formatText("fontName", f.value);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white text-[10px] font-semibold transition-all block border-0 bg-transparent"
                    style={{ fontFamily: f.value }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Size Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSizeMenuOpen(!sizeMenuOpen);
                setFontMenuOpen(false);
              }}
              className="h-8 px-2.5 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white rounded flex items-center gap-1 text-[10px] font-extrabold cursor-pointer transition-all border border-sidebar-border/30 bg-background/5"
            >
              <span>Size</span>
              <span className="text-[7px] opacity-70">▼</span>
            </button>
            {sizeMenuOpen && (
              <div 
                className="absolute bottom-10 left-0 bg-sidebar border border-sidebar-border shadow-premium rounded-xl py-1 z-50 min-w-[100px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                {[
                  { label: "Tiny", value: "1" },
                  { label: "Small", value: "2" },
                  { label: "Normal", value: "3" },
                  { label: "Medium", value: "4" },
                  { label: "Large", value: "5" },
                  { label: "Subheading", value: "6" },
                  { label: "Heading", value: "7" }
                ].map((sz) => (
                  <button
                    key={sz.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      formatText("fontSize", sz.value);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sidebar-accent text-sidebar-foreground hover:text-white text-[10px] font-bold transition-all block border-0 bg-transparent"
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-sidebar-accent mx-0.5 sm:mx-1 shrink-0" />

          {/* Colors quick layout palette */}
          <div className="flex flex-wrap items-center gap-1 px-1 border-l border-sidebar-border/40 pl-1.5 sm:pl-2 max-w-[105px] sm:max-w-none justify-center shrink-0">
            {[
              { color: "#1a1a1a", title: "Charcoal" },
              { color: "#475569", title: "Slate" },
              { color: "#dc2626", title: "Ruby" },
              { color: "#d97706", title: "Gold" },
              { color: "#059669", title: "Emerald" },
              { color: "#2563eb", title: "Royal Blue" },
              { color: "#7c3aed", title: "Purple" },
              { color: "#db2777", title: "Blush" },
              { color: "#f8fafc", title: "Off-White" }
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  formatText("foreColor", c.color);
                }}
                title={c.title}
                className="h-4.5 w-4.5 rounded-full border border-sidebar-border hover:border-white cursor-pointer transition-transform hover:scale-120 active:scale-90"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. DESIGN IMAGE BLOCK EDIT SETTINGS POPUP */}
      <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-premium rounded-2xl glass-card">
          <DialogHeader className="text-left space-y-2 select-none">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span>Configure Image Block</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the dimensions, URL path, and wrapping layouts for this magazine image element.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-left">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Image Endpoint URL</span>
              <div className="flex gap-2">
                <Input 
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="text-xs rounded-xl flex-1"
                  placeholder="https://images.unsplash.com/... or uploaded local"
                  type="text"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1 rounded-xl cursor-pointer shrink-0"
                  onClick={() => triggerLocalImageUpload(0, (url, name) => {
                    setImgUrl(url);
                    setImgCaption(name);
                  })}
                >
                  <Plus className="h-3 w-3" />
                  <span>Upload Local</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Caption / Subtitle</span>
              <Input 
                value={imgCaption}
                onChange={(e) => setImgCaption(e.target.value)}
                placeholder="A scenic caption for the photo..."
                className="text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 select-none">
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Image Width Scale</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["33%", "50%", "100%"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setImgWidth(w)}
                      className={`h-8 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                        imgWidth === w
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Text Flow wrapping</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["none", "left", "right"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setImgFloat(f)}
                      className={`h-8 rounded-lg border text-[10px] font-bold capitalize cursor-pointer transition-all ${
                        imgFloat === f
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {f === "none" ? "Center" : f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 select-none">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingBlock(null)}>Cancel</Button>
              <Button variant="default" size="sm" type="button" onClick={saveImageSettings}>Apply Layout</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. REQUEST CORRECTIONS FEEDBACK DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-premium rounded-2xl glass-card">
          <DialogHeader className="text-left space-y-2 select-none">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Plus className="h-5 w-5 text-destructive rotate-45" />
              <span>Request Editorial Corrections</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide constructive feedback. The status will transition to "Needs Corrections", notifying the writer and locking editing privileges for reviews.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Correction Notes & Feedback</span>
              <textarea 
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="E.g., Please fix spelling in paragraph 3, change the cover banner to something more scholarly..."
                className="w-full text-xs rounded-xl border border-border p-3 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 select-none">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                size="sm" 
                type="button" 
                onClick={() => {
                  if (existingArt && adminFeedback.trim()) {
                    if (existingArt.status === "pending_review") {
                      rejectSubmission(existingArt.id, adminFeedback);
                    } else {
                      requestCorrections(existingArt.id, adminFeedback);
                    }
                    toast({
                      title: "Feedback Sent",
                      description: "The author has been notified.",
                      variant: "success"
                    });
                    setShowRejectDialog(false);
                    navigate("/app/admin/pending");
                  }
                }}
                disabled={!adminFeedback.trim()}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. COLLABORATOR SUBMIT REVISION DIALOG */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-premium rounded-2xl glass-card">
          <DialogHeader className="text-left space-y-2 select-none">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Submit Revisions strictly to Admin</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Briefly describe your suggested changes. These changes will be submitted strictly to the Admin's queue for moderation and will only apply to the live article after Admin approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase select-none">Change Summary</span>
              <textarea 
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="E.g., Added a new column for student reactions, fixed grammar mistakes in paragraph 2..."
                className="w-full text-xs rounded-xl border border-border p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 select-none">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
              <Button 
                variant="default" 
                size="sm" 
                type="button" 
                onClick={() => {
                  if (existingArt && changeSummary.trim()) {
                    const serializedHtml = serializeHTML(blocks, theme, padding);
                    saveCollaboratorEdit(
                      existingArt.id,
                      title,
                      subtitle,
                      category,
                      coverImage,
                      serializedHtml,
                      changeSummary,
                      "pending_admin_review"
                    );
                    toast({
                      title: "Submitted strictly to Admin! 🚀",
                      description: "Your suggested changes have been queued under Admin review moderation.",
                      variant: "success"
                    });
                    setShowSubmitDialog(false);
                    navigate("/app");
                  }
                }}
                disabled={!changeSummary.trim()}
              >
                Submit suggested updates
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
