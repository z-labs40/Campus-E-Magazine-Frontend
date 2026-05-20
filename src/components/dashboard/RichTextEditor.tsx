import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  PenTool, 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Heading2, 
  Quote, 
  Code2, 
  Type, 
  Image, 
  Layers,
  History
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function RichTextEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { articles, updateArticle, createArticle } = useStore();

  // Find dynamic article or initialize temporary fallback
  const existingArt = articles.find(a => a.id === id);

  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [category, setCategory] = React.useState("Technology");
  const [coverImage, setCoverImage] = React.useState("");
  const [content, setContent] = React.useState("");

  // Slash commands floating menu
  const [slashMenuOpen, setSlashMenuOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");
  const [cursorPos, setCursorPos] = React.useState(0);

  // Sync inputs on load
  React.useEffect(() => {
    if (existingArt) {
      setTitle(existingArt.title);
      setSubtitle(existingArt.subtitle);
      setCategory(existingArt.category);
      setCoverImage(existingArt.coverImage);
      setContent(existingArt.content);
    } else {
      // Create empty boilerplate templates
      setTitle("The Digital Frontier: A New Era");
      setSubtitle("Exploring high-speed academic innovations across campus.");
      setCategory("Technology");
      setCoverImage("https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1200");
      setContent("<p>Write your amazing story here...</p>");
    }
  }, [id, existingArt]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Failure",
        description: "Title field cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    if (existingArt) {
      // Update article and log revision
      updateArticle(existingArt.id, {
        title,
        subtitle,
        category,
        coverImage,
        content
      });
      
      toast({
        title: "Workspace Saved ✅",
        description: `Successfully stored "${title}" and committed revision.`,
        variant: "success"
      });
    } else {
      // Create new
      const fresh = createArticle(title, subtitle, category, coverImage, content);
      toast({
        title: "Workspace Launched 🚀",
        description: `Successfully initialized "${title}" in local database.`,
        variant: "success"
      });
      navigate(`/app/editor-tool/${fresh.id}`);
    }
  };

  // Notion-style slash commands capture
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const selectionStart = e.target.selectionStart;
    setCursorPos(selectionStart);

    // Look for slash "/" character directly preceding the cursor point
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1 && lastSlashIdx >= textBeforeCursor.length - 5) {
      setSlashMenuOpen(true);
      setSlashQuery(textBeforeCursor.slice(lastSlashIdx + 1));
    } else {
      setSlashMenuOpen(false);
    }
  };

  const injectBlock = (type: "p" | "h2" | "quote" | "code") => {
    const textBeforeSlash = content.slice(0, cursorPos).replace(/\/[\w]*$/, "");
    const textAfterSlash = content.slice(cursorPos);

    let injected = "";
    if (type === "p") injected = "\n<p>New body paragraph block...</p>\n";
    else if (type === "h2") injected = "\n<h2>New Section Heading</h2>\n";
    else if (type === "quote") injected = "\n<blockquote>\"Enter inspiring quote testimonial...\"</blockquote>\n";
    else if (type === "code") injected = "\n<pre><code>// Type syntax highlight here...</code></pre>\n";

    setContent(textBeforeSlash + injected + textAfterSlash);
    setSlashMenuOpen(false);

    toast({
      title: "Block Injected",
      description: `Successfully added ${type.toUpperCase()} layout to editorial body.`,
      variant: "success"
    });
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
            <PenTool className="h-3 w-3" />
            Notion-style Collaborative Editor
          </span>
          <h1 className="font-sora font-extrabold text-2xl lg:text-3xl text-foreground">Write & Format</h1>
          <p className="text-muted-foreground text-xs">Utilize simple slash commands to structure responsive blocks.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl cursor-pointer" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          
          {existingArt && (
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

          <Button variant="default" size="sm" className="h-9 gap-1.5 rounded-xl cursor-pointer shadow-premium" onClick={handleSave}>
            <Save className="h-4 w-4" />
            <span>Save Draft</span>
          </Button>
        </div>
      </div>

      {/* METADATA SETUPS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Editor Main body console */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 relative">
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="The Silent Shift: How AI is Redefining Classroom Dynamics"
                className="w-full font-sora font-extrabold text-2xl sm:text-4xl text-foreground bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 leading-tight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <textarea 
                placeholder="Beyond the cheating scare, algorithms are restructuring classrooms..."
                className="w-full text-muted-foreground text-sm sm:text-base bg-transparent border-0 focus:outline-none focus:ring-0 resize-none h-16 placeholder:text-muted-foreground/30 leading-relaxed"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />

              <div className="h-px bg-border/40 my-4" />

              {/* NOTION INSTRUCTIONS TIP */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 select-none">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-foreground">Type slash symbol (/) in body console below to summon fast layout blocks!</span>
              </div>

              {/* CONTENT BODY CONSOLE WRAPPER */}
              <div className="relative">
                <textarea 
                  value={content}
                  onChange={handleContentChange}
                  className="w-full font-mono text-xs sm:text-sm bg-accent/20 dark:bg-black/20 p-5 rounded-xl border border-border/80 focus:outline-none focus:ring-2 focus:ring-ring min-h-[360px] leading-relaxed"
                  placeholder="Type story html content here... Double click tags to edit body panels. Write / to inject headings."
                />

                {/* Notion slash command popup */}
                {slashMenuOpen && (
                  <div className="absolute top-12 left-10 z-50 w-64 bg-popover border border-border rounded-xl shadow-premium p-1.5 glass-card animate-in fade-in-80 select-none">
                    <div className="px-2.5 py-1.5 border-b border-border/40 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest text-left">
                      typographic blocks
                    </div>
                    <div className="space-y-0.5 mt-1 text-left">
                      <button 
                        type="button"
                        onClick={() => injectBlock("p")} 
                        className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-accent rounded-lg text-xs font-semibold cursor-pointer group"
                      >
                        <div className="h-6 w-6 bg-primary/10 text-primary border border-primary/20 rounded flex items-center justify-center">
                          <Type className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Standard Paragraph</span>
                          <span className="text-[9px] text-muted-foreground">Insert plain HTML p tag</span>
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => injectBlock("h2")} 
                        className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-accent rounded-lg text-xs font-semibold cursor-pointer group"
                      >
                        <div className="h-6 w-6 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded flex items-center justify-center">
                          <Heading2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Section Heading</span>
                          <span className="text-[9px] text-muted-foreground">Insert editorial h2 tag</span>
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => injectBlock("quote")} 
                        className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-accent rounded-lg text-xs font-semibold cursor-pointer group"
                      >
                        <div className="h-6 w-6 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded flex items-center justify-center">
                          <Quote className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Editorial Blockquote</span>
                          <span className="text-[9px] text-muted-foreground">Insert italic styled blockquote</span>
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => injectBlock("code")} 
                        className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-accent rounded-lg text-xs font-semibold cursor-pointer group"
                      >
                        <div className="h-6 w-6 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded flex items-center justify-center">
                          <Code2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Computer Science Code</span>
                          <span className="text-[9px] text-muted-foreground">Insert pre code elements</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </Card>
        </div>

        {/* Editor Metadata settings side column */}
        <div className="lg:col-span-4 space-y-6 select-none">
          <Card className="p-6">
            <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider mb-4">Metadata Guidelines</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Publication Category</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Technology", "Culture", "Environment", "History"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`h-8 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        category === cat
                          ? "bg-primary border-primary text-primary-foreground font-extrabold"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Cover Image Endpoint</span>
                <div className="flex gap-2">
                  <div className="h-9 w-9 bg-accent rounded flex items-center justify-center shrink-0 border border-border">
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="url" 
                    placeholder="Unsplash absolute image URL..." 
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="h-px bg-border/40 my-4" />

              {coverImage && (
                <div className="rounded-lg overflow-hidden border border-border shadow-premium">
                  <img src={coverImage} className="h-28 w-full object-cover" alt="Image preview" />
                </div>
              )}

            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
