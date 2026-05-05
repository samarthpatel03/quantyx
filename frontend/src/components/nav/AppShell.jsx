// AppShell — wraps all authenticated pages with nav shell
// CRITICAL: No overflow:hidden on any ancestor of the header
//           so the search dropdown can float outside without being clipped.
import DesktopNav from "./DesktopNav";
import MobileNav  from "./MobileNav";
import MarketStatusBar from "./MarketStatusBar";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen h-screen bg-background">
      {/* Desktop left nav */}
      <DesktopNav />

      {/* Main content column — flex-col, fills remaining width */}
      <div className="flex-1 flex flex-col min-w-0" style={{ position: "relative" }}>
        {/* Top status bar — z-40 header, inner dropdown uses z-50 */}
        <MarketStatusBar />

        {/* Page content — scrollable, does NOT clip its siblings */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
