import { useNavigate } from "react-router-dom";
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <span className="text-6xl font-extrabold text-gradient-mint">404</span>
      <p className="text-muted-foreground">Page not found</p>
      <button onClick={()=>navigate("/")} className="glass px-4 py-2 rounded-lg text-sm hover:text-foreground text-muted-foreground transition-colors">Back to home</button>
    </div>
  );
}
