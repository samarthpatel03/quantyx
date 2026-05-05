import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import Landing    from "./pages/Landing";
import Login      from "./pages/Login";
import NotFound   from "./pages/NotFound";
import Dashboard  from "./pages/Dashboard";
import Analyse    from "./pages/Analyse";
import Watchlist  from "./pages/Watchlist";
import Simulator  from "./pages/Simulator";
import Advisor    from "./pages/Advisor";
import Learn      from "./pages/Learn";
import Settings   from "./pages/Settings";
import AppShell   from "./components/nav/AppShell";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      // Show stale data while refetching — never block UI
      staleTime: 60_000,
    },
  },
});

// Wrap all app pages with the nav shell
function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            {/* Public pages — no shell */}
            <Route path="/"      element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* App pages — with nav shell */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/analyse"   element={<AppLayout><Analyse /></AppLayout>} />
            <Route path="/watchlist" element={<AppLayout><Watchlist /></AppLayout>} />
            <Route path="/simulator" element={<AppLayout><Simulator /></AppLayout>} />
            <Route path="/advisor"   element={<AppLayout><Advisor /></AppLayout>} />
            <Route path="/learn"     element={<AppLayout><Learn /></AppLayout>} />
            <Route path="/settings"  element={<AppLayout><Settings /></AppLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
