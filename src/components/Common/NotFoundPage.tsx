import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background grid-bg-editorial">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-premium animate-float-slow">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-8xl font-sora font-extrabold text-primary tracking-tighter text-glow">404</h1>
          <h2 className="text-2xl font-sora font-bold text-foreground">Lost in the Archives</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            The page you are looking for has either been retracted, moved to another shelf, or was never published in our issues.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" className="gap-2" onClick={() => navigate("/magazine")}>
            <BookOpen className="h-4 w-4" />
            <span>Read Latest Issues</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
