import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info";
  action?: React.ReactNode;
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    const content = title ? `${title}: ${description || ""}` : (description || "");
    
    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description: description,
      });
    } else if (variant === "success") {
      sonnerToast.success(title || "Success", {
        description: description,
      });
    } else {
      sonnerToast(title || "Notification", {
        description: description,
      });
    }
  };

  return {
    toast,
    sonnerToast,
  };
}
