import { BarChart2, Brain, Bookmark, Gamepad2, MessageSquare, BookOpen, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { id:"markets",   label:"Markets",   icon:BarChart2,      path:"/dashboard" },
  { id:"analyse",   label:"Analyse",   icon:Brain,          path:"/analyse" },
  { id:"watchlist", label:"Watchlist", icon:Bookmark,       path:"/watchlist" },
  { id:"simulator", label:"Simulator", icon:Gamepad2,       path:"/simulator" },
  { id:"advisor",   label:"Advisor",   icon:MessageSquare,  path:"/advisor" },
  { id:"learn",     label:"Learn",     icon:BookOpen,       path:"/learn" },
  { id:"settings",  label:"Settings",  icon:Settings,       path:"/settings" },
];
