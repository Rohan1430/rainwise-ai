import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * ProfileAvatar - Displays user initials in a colored circle
 * Uses consistent color based on user's name/email
 */
export function ProfileAvatar({ name, email, size = "md", className }: ProfileAvatarProps) {
  // Get initials from name or email
  const initials = useMemo(() => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  }, [name, email]);

  // Generate consistent color based on name/email
  const backgroundColor = useMemo(() => {
    const str = name || email || "user";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness for readability
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
  }, [name, email]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white transition-transform hover:scale-105",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
}
