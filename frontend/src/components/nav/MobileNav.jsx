import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

// Show only 5 primary items on mobile bottom bar
const MOBILE_ITEMS = NAV_ITEMS.slice(0, 5);

export default function MobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-14">
        {MOBILE_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const active = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
