import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export function ModeToggle(props: { className?: string }) {
  const { className } = props;
  const { theme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("p-2 bg-transparent", className)}
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Moon
          className={
            "h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          }
        />
      ) : (
        <Sun
          className={
            "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          }
        />
      )}
    </Button>
  );
}
