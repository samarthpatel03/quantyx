import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { NAV_ITEMS } from "./navItems";
import { Moon, Sun, User } from "lucide-react";

function NavIcon({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 group relative ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {/* Tooltip — pops on hover */}
      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-card border border-border/60 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-50 shadow-lg">
        {label}
      </span>
      {/* Active indicator */}
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
      )}
    </button>
  );
}

function ThemeIcon() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-150 group relative"
    >
      <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
      <Moon className="w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-card border border-border/60 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-50 shadow-lg">
        Toggle theme
      </span>
    </button>
  );
}

export default function DesktopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-14 shrink-0 border-r border-border/50 bg-card/20 h-screen sticky top-0 z-30">

      {/* Top spacer — matches header height exactly, no logo here */}
      <div className="h-14 shrink-0 border-b border-border/50" />

      {/* Nav icons */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-1.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const active = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
          return (
            <NavIcon
              key={id}
              icon={Icon}
              label={label}
              active={active}
              onClick={() => navigate(path)}
            />
          );
        })}
      </nav>

      {/* Bottom — theme + account */}
      <div className="pb-3 pt-3 flex flex-col gap-0.5 px-1.5 border-t border-border/50">
        <ThemeIcon />
        <button className="w-full flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-150 group relative">
          <User className="w-5 h-5" />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-card border border-border/60 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-50 shadow-lg">
            Account
          </span>
        </button>
      </div>

    </aside>
  );
}
