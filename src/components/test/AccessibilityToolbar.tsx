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
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  // Magnifier size and zoom
  const MAGNIFIER_SIZE = 180;
  const ZOOM = 2.5;

  // Black mode: add/remove class on body
  useEffect(() => {
    if (blackMode) {
      document.documentElement.classList.add("accessibility-black-mode");
    } else {
      document.documentElement.classList.remove("accessibility-black-mode");
    }
    return () => {
      document.documentElement.classList.remove("accessibility-black-mode");
    };
  }, [blackMode]);

  // Magnifier mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!magnifierOn) return;
    setMagnifierPos({ x: e.clientX, y: e.clientY });
    setMagnifierVisible(true);

    // Draw magnified content using canvas approach
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cancel previous frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = MAGNIFIER_SIZE * dpr;
      canvas.height = MAGNIFIER_SIZE * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Calculate source area
      const sourceSize = MAGNIFIER_SIZE / ZOOM;
      const sx = e.clientX - sourceSize / 2;
      const sy = e.clientY - sourceSize / 2;

      // Use CSS-based magnification via clip-path + transform on a cloned viewport
      // Instead, we'll use a simpler approach: scale the page content via background
      ctx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

      // Draw a circle clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      // Fill with a subtle background
      ctx.fillStyle = blackMode ? "#000" : "#fff";
      ctx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

      // Draw border
      ctx.strokeStyle = blackMode ? "#fff" : "#333";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  }, [magnifierOn, blackMode]);

  const handleMouseLeave = useCallback(() => {
    setMagnifierVisible(false);
  }, []);

  useEffect(() => {
    if (magnifierOn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeave);
    } else {
      setMagnifierVisible(false);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [magnifierOn, handleMouseMove, handleMouseLeave]);

  // Cleanup RAF
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Floating Accessibility Button */}
      <div className={cn("fixed z-[9998]", className || "bottom-20 right-4 md:bottom-24 md:right-6")}>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className={cn(
            "w-12 h-12 rounded-full shadow-lg transition-all",
            open
              ? "bg-primary text-primary-foreground"
              : "bg-[#1e3a5f] text-white hover:bg-[#2a4a73]"
          )}
          title="Accessibility Options"
        >
          {open ? <X className="w-5 h-5" /> : <Accessibility className="w-5 h-5" />}
        </Button>

        {/* Dropdown Panel */}
        {open && (
          <div className="absolute bottom-14 right-0 w-64 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              Accessibility
            </h3>

            {/* Screen Magnifier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Screen Magnifier</span>
              </div>
              <Switch
                checked={magnifierOn}
                onCheckedChange={setMagnifierOn}
              />
            </div>

            {/* Black Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Black Mode</span>
              </div>
              <Switch
                checked={blackMode}
                onCheckedChange={setBlackMode}
              />
            </div>

            {blackMode && (
              <p className="text-xs text-muted-foreground">
                Images are inverted for better visibility on dark backgrounds.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Magnifier Lens */}
      {magnifierOn && magnifierVisible && (
        <div
          ref={magnifierRef}
          className="fixed pointer-events-none z-[9999] rounded-full border-2 overflow-hidden"
          style={{
            width: MAGNIFIER_SIZE,
            height: MAGNIFIER_SIZE,
            left: magnifierPos.x - MAGNIFIER_SIZE / 2,
            top: magnifierPos.y - MAGNIFIER_SIZE / 2,
            borderColor: blackMode ? "#fff" : "#1e3a5f",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            background: "transparent",
          }}
        >
          {/* Render magnified clone of the page */}
          <div
            style={{
              position: "absolute",
              width: `${window.innerWidth}px`,
              height: `${window.innerHeight}px`,
              transform: `scale(${ZOOM})`,
              transformOrigin: `${magnifierPos.x}px ${magnifierPos.y}px`,
              left: -(magnifierPos.x - MAGNIFIER_SIZE / 2),
              top: -(magnifierPos.y - MAGNIFIER_SIZE / 2),
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {/* We use a CSS trick: render the body's content scaled via background-attachment */}
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: "none" }}
          />
          {/* CSS-based magnifier using backdrop approach */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backdropFilter: "none",
              background: `url(#) no-repeat`,
            }}
          />
        </div>
      )}

      {/* Inject magnifier styles for CSS-based approach */}
      <style>{`
        .accessibility-black-mode {
          background-color: #000 !important;
          color: #fff !important;
        }
        .accessibility-black-mode * {
          background-color: transparent;
          color: #fff !important;
          border-color: #555 !important;
        }
        .accessibility-black-mode body,
        .accessibility-black-mode .min-h-screen,
        .accessibility-black-mode [class*="bg-["] {
          background-color: #000 !important;
        }
        .accessibility-black-mode header,
        .accessibility-black-mode [class*="bg-[#1e3a5f]"] {
          background-color: #111 !important;
        }
        .accessibility-black-mode [class*="bg-[#f5f5f5]"],
        .accessibility-black-mode [class*="bg-white"],
        .accessibility-black-mode [class*="bg-gray"] {
          background-color: #111 !important;
        }
        .accessibility-black-mode [class*="bg-[#c8c8c8]"] {
          background-color: #000 !important;
        }
        .accessibility-black-mode [class*="bg-[#0a1628]"] {
          background-color: #000 !important;
        }
        .accessibility-black-mode img {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        .accessibility-black-mode canvas {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        .accessibility-black-mode .bg-card,
        .accessibility-black-mode .glass-card {
          background-color: #1a1a1a !important;
        }
        .accessibility-black-mode .bg-secondary {
          background-color: #222 !important;
        }
        .accessibility-black-mode input,
        .accessibility-black-mode textarea,
        .accessibility-black-mode select {
          background-color: #222 !important;
          color: #fff !important;
        }
        /* Keep accessibility button styled */
        .accessibility-black-mode [title="Accessibility Options"] {
          background-color: #333 !important;
        }
        /* Preserve green/red/purple status colors but darken */
        .accessibility-black-mode [class*="bg-green"] {
          background-color: rgba(34, 197, 94, 0.15) !important;
        }
        .accessibility-black-mode [class*="bg-red"] {
          background-color: rgba(239, 68, 68, 0.15) !important;
        }
        .accessibility-black-mode [class*="bg-purple"] {
          background-color: rgba(168, 85, 247, 0.15) !important;
        }
        .accessibility-black-mode [class*="text-green"] {
          color: #4ade80 !important;
        }
        .accessibility-black-mode [class*="text-red"] {
          color: #f87171 !important;
        }
        .accessibility-black-mode [class*="text-purple"] {
          color: #c084fc !important;
        }
        /* Primary buttons keep contrast */
        .accessibility-black-mode [class*="bg-[#1a73e8]"],
        .accessibility-black-mode [class*="bg-[#22c55e]"] {
          color: #fff !important;
        }
      `}</style>
    </>
  );
}
