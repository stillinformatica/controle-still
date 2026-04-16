import { THEMES, ThemeName, useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent transition-colors w-full text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden truncate">
            {THEMES[theme].emoji} {THEMES[theme].label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(THEMES) as ThemeName[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key)}
            className={`cursor-pointer ${theme === key ? "bg-accent font-medium" : ""}`}
          >
            <span className="mr-2">{THEMES[key].emoji}</span>
            {THEMES[key].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
