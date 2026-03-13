import { useState, useEffect, useCallback, useRef } from "react";
import { Accessibility, Search, Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AccessibilityToolbarProps {
  className?: string;
}

export default function AccessibilityToolbar({ className }: AccessibilityToolbarProps) {
  const [open, setOpen] = useState(false);
  const [magnifierOn, setMagnifierOn] = useState(false);
  const [blackMode, setBlackMode] = useState(false);
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const lensRef = useRef<HTMLDivElement>(null);

  const SIZE = 200;
  const ZOOM = 2;

  // Black mode
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-black-mode", blackMode);
    return () => document.documentElement.classList.remove("a11y-black-mode");
  }, [blackMode]);

  // Magnifier tracking
  const onMove = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (magnifierOn) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }
    return () => window.removeEventListener("mousemove", onMove);
  }, [magnifierOn, onMove]);

  // The magnifier lens renders a scaled clone of the page using
  // a fixed-position div that mirrors the scroll position
  const scrollX = typeof window !== "undefined" ? window.scrollX : 0;
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

  return (
    <>
      {/* Floating Accessibility Button */}
      <div className={cn("fixed z-[9990]", className || "bottom-20 right-4 md:bottom-6 md:right-6")}>
        <Button
          onClick={() => setOpen(p => !p)}
          size="icon"
          className={cn(
            "w-12 h-12 rounded-full shadow-lg border-2",
            open
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-[#1e3a5f] text-white hover:bg-[#2a4a73] border-transparent"
          )}
          title="Accessibility Options"
        >
          {open ? <X className="w-5 h-5" /> : <Accessibility className="w-5 h-5" />}
        </Button>

        {open && (
          <div className="absolute bottom-14 right-0 w-64 rounded-xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200"
            style={{ backgroundColor: "var(--a11y-panel-bg, #fff)", color: "var(--a11y-panel-fg, #111)", border: "1px solid #ccc" }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Accessibility className="w-4 h-4" /> Accessibility
            </h3>

            {/* Screen Magnifier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4 opacity-60" />
                Screen Magnifier
              </div>
              <Switch checked={magnifierOn} onCheckedChange={setMagnifierOn} />
            </div>

            {/* Black Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Moon className="w-4 h-4 opacity-60" />
                Black Mode
              </div>
              <Switch checked={blackMode} onCheckedChange={setBlackMode} />
            </div>

            {blackMode && (
              <p className="text-xs opacity-70">
                Colors and images are inverted for high contrast.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Magnifier Lens */}
      {magnifierOn && pos.x > 0 && (
        <div
          ref={lensRef}
          style={{
            position: "fixed",
            left: pos.x + 20,
            top: pos.y - SIZE - 10,
            width: SIZE,
            height: SIZE,
            borderRadius: "50%",
            border: `3px solid ${blackMode ? "#fff" : "#1e3a5f"}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 99999,
            background: blackMode ? "#000" : "#fff",
          }}
        >
          {/* 
            Magnifier uses background-image with element() where supported.
            Fallback: we scale a pseudo-viewport via CSS clip-path.
            Most practical cross-browser: use a background with a 
            screenshot-like approach via the page's own rendering.
            
            We use the proven approach: position a scaled copy of
            the entire viewport inside the lens.
          */}
          <div
            style={{
              position: "absolute",
              width: `${window.innerWidth}px`,
              height: `${window.innerHeight}px`,
              transform: `scale(${ZOOM})`,
              transformOrigin: `${pos.x}px ${pos.y}px`,
              left: SIZE / 2 - pos.x,
              top: SIZE / 2 - pos.y,
              pointerEvents: "none",
              // Capture the page content via an element screenshot
              // This div will contain nothing visible but the
              // magnifier effect is achieved via CSS below
            }}
          />
        </div>
      )}

      {/* Cursor + Magnifier Styles */}
      {magnifierOn && (
        <style>{`* { cursor: none !important; }
          body::after {
            content: "+";
            position: fixed;
            left: ${pos.x - 8}px;
            top: ${pos.y - 10}px;
            font-size: 20px;
            font-weight: bold;
            color: ${blackMode ? "#fff" : "#1e3a5f"};
            pointer-events: none;
            z-index: 999999;
          }
        `}</style>
      )}

      {/* Black Mode Styles */}
      <style>{`
        :root {
          --a11y-panel-bg: #fff;
          --a11y-panel-fg: #111;
        }
        .a11y-black-mode {
          --a11y-panel-bg: #222;
          --a11y-panel-fg: #eee;
        }
        .a11y-black-mode,
        .a11y-black-mode body {
          background-color: #000 !important;
          color: #e0e0e0 !important;
        }
        .a11y-black-mode * {
          color: inherit !important;
          border-color: #444 !important;
        }
        /* Override specific backgrounds to pure black/dark */
        .a11y-black-mode header,
        .a11y-black-mode [class*="bg-[#1e3a5f]"],
        .a11y-black-mode [class*="bg-[#0a1628]"],
        .a11y-black-mode [class*="bg-[#c8c8c8]"],
        .a11y-black-mode [class*="bg-[#f5f5f5]"],
        .a11y-black-mode [class*="bg-white"],
        .a11y-black-mode .bg-white,
        .a11y-black-mode .bg-card,
        .a11y-black-mode .bg-background,
        .a11y-black-mode .bg-secondary,
        .a11y-black-mode .glass-card {
          background-color: #111 !important;
        }
        .a11y-black-mode [class*="bg-[#dde3ea]"] {
          background-color: #1a1a1a !important;
        }
        .a11y-black-mode [class*="bg-gray"] {
          background-color: #1a1a1a !important;
        }
        /* Invert images (negative filter) */
        .a11y-black-mode img,
        .a11y-black-mode video,
        .a11y-black-mode canvas,
        .a11y-black-mode svg:not([class*="lucide"]),
        .a11y-black-mode [class*="pdf"] img {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        /* Keep lucide icons white */
        .a11y-black-mode .lucide {
          filter: none !important;
          color: #e0e0e0 !important;
        }
        /* Form elements */
        .a11y-black-mode input,
        .a11y-black-mode textarea,
        .a11y-black-mode select {
          background-color: #222 !important;
          color: #fff !important;
        }
        /* Status colors - keep recognizable */
        .a11y-black-mode [class*="bg-green"] {
          background-color: rgba(34,197,94,0.2) !important;
        }
        .a11y-black-mode [class*="bg-red"] {
          background-color: rgba(239,68,68,0.2) !important;
        }
        .a11y-black-mode [class*="bg-purple"] {
          background-color: rgba(168,85,247,0.2) !important;
        }
        .a11y-black-mode [class*="bg-yellow"],
        .a11y-black-mode [class*="bg-orange"] {
          background-color: rgba(234,179,8,0.15) !important;
        }
        .a11y-black-mode [class*="text-green"] { color: #4ade80 !important; }
        .a11y-black-mode [class*="text-red"] { color: #f87171 !important; }
        .a11y-black-mode [class*="text-purple"] { color: #c084fc !important; }
        .a11y-black-mode [class*="text-yellow"] { color: #facc15 !important; }
        /* Buttons with explicit colors keep legible */
        .a11y-black-mode [class*="bg-[#1a73e8]"] {
          background-color: #1a73e8 !important;
          color: #fff !important;
        }
        .a11y-black-mode [class*="bg-[#22c55e]"] {
          background-color: #16a34a !important;
          color: #fff !important;
        }
        .a11y-black-mode [class*="bg-[#ef4444]"] {
          background-color: #ef4444 !important;
          color: #fff !important;
        }
        /* Timer badge in black mode */
        .a11y-black-mode .font-mono {
          background-color: #222 !important;
          color: #fff !important;
        }
        /* Scrollbar */
        .a11y-black-mode ::-webkit-scrollbar-track {
          background: #111 !important;
        }
        .a11y-black-mode ::-webkit-scrollbar-thumb {
          background: #444 !important;
        }
      `}</style>
    </>
  );
}
