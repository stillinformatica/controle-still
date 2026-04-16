import { THEMES, ThemeName, useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Sun, Moon, Flower2, Wand2, Shield, TreePine, type LucideIcon } from "lucide-react";

const THEME_ICONS: Record<ThemeName, LucideIcon> = {
  light: Sun,
  dark: Moon,
  mothers_day: Flower2,
  harry_potter: Wand2,
  marvel: Shield,
  christmas: TreePine,
};

const THEME_ICON_COLORS: Record<ThemeName, string> = {
  light: "text-amber-500",
  dark: "text-indigo-400",
  mothers_day: "text-pink-500",
  harry_potter: "text-yellow-600",
  marvel: "text-red-600",
  christmas: "text-green-600",
};

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const CurrentIcon = THEME_ICONS[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent transition-colors w-full text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <CurrentIcon className={`h-4 w-4 shrink-0 ${THEME_ICON_COLORS[theme]}`} />
          <span className="group-data-[collapsible=icon]:hidden truncate">
            {THEMES[theme].label}
          </span>
          <Palette className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {(Object.keys(THEMES) as ThemeName[]).map((key) => {
          const Icon = THEME_ICONS[key];
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              className={`cursor-pointer gap-2 ${theme === key ? "bg-accent font-medium" : ""}`}
            >
              <Icon className={`h-4 w-4 ${THEME_ICON_COLORS[key]}`} />
              {THEMES[key].label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
