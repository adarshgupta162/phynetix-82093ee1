import { useState, useEffect, useCallback, useRef } from "react";
import { Accessibility, Search, Moon, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AccessibilityToolbarProps {
  className?: string;
  inline?: boolean; // render as inline controls in header
}

export default function AccessibilityToolbar({ className, inline }: AccessibilityToolbarProps) {
  const [open, setOpen] = useState(false);
  const [magnifierOn, setMagnifierOn] = useState(false);
  const [blackMode, setBlackMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Black mode - ONLY invert images, don't change interface
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-invert-images", blackMode);
    return () => document.documentElement.classList.remove("a11y-invert-images");
  }, [blackMode]);

  // Magnifier - uses CSS zoom on the test content area
  useEffect(() => {
    const contentArea = document.querySelector('[data-test-content]') as HTMLElement;
    if (contentArea) {
      if (magnifierOn) {
        contentArea.style.zoom = String(zoomLevel);
      } else {
        contentArea.style.zoom = '1';
      }
    }
    return () => {
      if (contentArea) contentArea.style.zoom = '1';
    };
  }, [magnifierOn, zoomLevel]);

  const increaseZoom = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const decreaseZoom = () => setZoomLevel(prev => Math.max(prev - 0.25, 1));

  const toggleMagnifier = (on: boolean) => {
    setMagnifierOn(on);
    if (on && zoomLevel === 1) setZoomLevel(1.5);
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        {/* Magnifier toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleMagnifier(!magnifierOn)}
          className={cn(
            "w-8 h-8 rounded-full",
            magnifierOn ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          title="Screen Magnifier"
        >
          <Search className="w-4 h-4" />
        </Button>

        {magnifierOn && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={decreaseZoom}
              className="w-6 h-6 text-white/70 hover:text-white hover:bg-white/10 rounded"
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs text-white/80 min-w-[32px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={increaseZoom}
              className="w-6 h-6 text-white/70 hover:text-white hover:bg-white/10 rounded"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Black mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setBlackMode(!blackMode)}
          className={cn(
            "w-8 h-8 rounded-full",
            blackMode ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          title="Invert Images"
        >
          <Moon className="w-4 h-4" />
        </Button>

        {/* Image inversion styles - ONLY inverts images */}
        {blackMode && (
          <style>{`
            .a11y-invert-images img,
            .a11y-invert-images video,
            .a11y-invert-images canvas,
            .a11y-invert-images svg:not([class*="lucide"]) {
              filter: invert(1) hue-rotate(180deg) !important;
            }
            .a11y-invert-images .lucide {
              filter: none !important;
            }
          `}</style>
        )}
      </div>
    );
  }

  // Floating button mode (fallback)
  return (
    <>
      <div className={cn("fixed z-[9990]", className || "top-4 right-4")}>
        <Button
          onClick={() => setOpen(p => !p)}
          size="icon"
          className={cn(
            "w-10 h-10 rounded-full shadow-lg border-2",
            open
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-[#1e3a5f] text-white hover:bg-[#2a4a73] border-transparent"
          )}
          title="Accessibility Options"
        >
          {open ? <X className="w-4 h-4" /> : <Accessibility className="w-4 h-4" />}
        </Button>

        {open && (
          <div className="absolute top-12 right-0 w-64 rounded-xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-white border border-gray-200"
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
              <Accessibility className="w-4 h-4" /> Accessibility
            </h3>

            {/* Screen Magnifier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Search className="w-4 h-4 opacity-60" />
                Screen Magnifier
              </div>
              <Switch checked={magnifierOn} onCheckedChange={toggleMagnifier} />
            </div>

            {magnifierOn && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" className="w-7 h-7" onClick={decreaseZoom} disabled={zoomLevel <= 1}>
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium min-w-[40px] text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="outline" size="icon" className="w-7 h-7" onClick={increaseZoom} disabled={zoomLevel >= 3}>
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Black Mode (Image Inversion) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Moon className="w-4 h-4 opacity-60" />
                Invert Images
              </div>
              <Switch checked={blackMode} onCheckedChange={setBlackMode} />
            </div>

            {blackMode && (
              <p className="text-xs text-gray-500">
                Image colors are inverted (negative filter).
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image inversion styles */}
      {blackMode && (
        <style>{`
          .a11y-invert-images img,
          .a11y-invert-images video,
          .a11y-invert-images canvas,
          .a11y-invert-images svg:not([class*="lucide"]) {
            filter: invert(1) hue-rotate(180deg) !important;
          }
          .a11y-invert-images .lucide {
            filter: none !important;
          }
        `}</style>
      )}
    </>
  );
}
