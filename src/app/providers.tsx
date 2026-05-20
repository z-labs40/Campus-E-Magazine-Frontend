import * as React from "react";
import { Toaster } from "sonner";
import { StoreProvider } from "@/lib/store";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("em.theme");
      if (saved === "light" || saved === "dark") return saved;
      
      // Default to light for clean editorial magazine aesthetic
      return "light"; 
    }
    return "light";
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("em.theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StoreProvider>
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            className: "glass-card text-foreground border-border rounded-xl",
            duration: 4000
          }}
        />
      </StoreProvider>
    </ThemeContext.Provider>
  );
}
