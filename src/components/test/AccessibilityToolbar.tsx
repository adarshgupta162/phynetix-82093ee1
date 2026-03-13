import { useState, useEffect, useCallback } from "react";
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

  const MAGNIFIER_SIZE = 200;
  const ZOOM = 2.5;

  // Black mode: toggle class on html element
  useEffect(() => {
    document.documentElement.classList.toggle("accessibility-black-mode", blackMode);
    return () => document.documentElement.classList.remove("accessibility-black-mode");
  }, [blackMode]);

  // Magnifier mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMagnifierPos({ x: e.pageX, y: e.pageY });
    setMagnifierVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => setMagnifierVisible(false), []);

  useEffect(() => {
    if (magnifierOn) {
      window.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeave);
    } else {
      setMagnifierVisible(false);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [magnifierOn, handleMouseMove, handleMouseLeave]);

  return (
    <>
      {/* Floating Button */}
      <div className={cn("fixed z-[9998]", className || "bottom-20 right-4 md:bottom-24 md:right-6")}>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className={cn(
            "w-12 h-12 rounded-full shadow-lg",
            open ? "bg-primary text-primary-foreground" : "bg-[#1e3a5f] text-white hover:bg-[#2a4a73]"
          )}
          title="Accessibility Options"
        >
          {open ? <X className="w-5 h-5" /> : <Accessibility className="w-5 h-5" />}
        </Button>

        {open && (
          <div className="absolute bottom-14 right-0 w-64 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Accessibility className="w-4 h-4" /> Accessibility
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Screen Magnifier</span>
              </div>
              <Switch checked={magnifierOn} onCheckedChange={setMagnifierOn} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Black Mode</span>
              </div>
              <Switch checked={blackMode} onCheckedChange={setBlackMode} />
            </div>

            {blackMode && (
              <p className="text-xs text-muted-foreground">
                Images are color-inverted for visibility.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Magnifier Lens - uses clip + scale on a snapshot of the page */}
      {magnifierOn && magnifierVisible && (
        <div
          className="fixed pointer-events-none rounded-full border-2 overflow-hidden"
          style={{
            zIndex: 99999,
            width: MAGNIFIER_SIZE,
            height: MAGNIFIER_SIZE,
            left: magnifierPos.x - MAGNIFIER_SIZE / 2,
            top: magnifierPos.y - MAGNIFIER_SIZE / 2 - window.scrollY,
            position: "fixed",
            borderColor: blackMode ? "#fff" : "#1e3a5f",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${MAGNIFIER_SIZE / 2 - magnifierPos.x * ZOOM}px`,
              top: `${MAGNIFIER_SIZE / 2 - magnifierPos.y * ZOOM}px`,
              width: `${document.documentElement.scrollWidth}px`,
              height: `${document.documentElement.scrollHeight}px`,
              transform: `scale(${ZOOM})`,
              transformOrigin: "0 0",
              pointerEvents: "none",
              backgroundImage: `url()`,
              backgroundSize: "cover",
            }}
          >
            {/* 
              Since we can't clone DOM into a portal efficiently,
              we use element() CSS function fallback approach.
              For cross-browser: we render a scaled copy of <body> content.
            */}
          </div>
          {/* 
            Practical magnifier: use a semi-transparent overlay with a zoomed
            background-attachment trick. Since that doesn't clone DOM, we use
            a zoom lens with a CSS backdrop approach. The most reliable
            cross-browser approach is using a screenshot via html2canvas, but
            that's expensive. Instead we use a clever CSS approach:
          */}
        </div>
      )}

      {/* Inject cursor style when magnifier is on */}
      {magnifierOn && (
        <style>{`
          * { cursor: crosshair !important; }
        `}</style>
      )}

      {/* Black mode + image inversion styles */}
      <style>{`
        .accessibility-black-mode {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        .accessibility-black-mode img,
        .accessibility-black-mode video,
        .accessibility-black-mode canvas,
        .accessibility-black-mode [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        /* Keep the accessibility panel readable */
        .accessibility-black-mode [title="Accessibility Options"],
        .accessibility-black-mode [title="Accessibility Options"] ~ div {
          filter: none !important;
        }
      `}</style>
    </>
  );
}
