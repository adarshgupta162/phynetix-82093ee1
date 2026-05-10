import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Mic, Monitor, CheckCircle2, XCircle, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProctoringConsentProps {
  requireCamera: boolean;
  requireMic: boolean;
  requireScreen: boolean;
  onConsent: () => Promise<void>;
  onDecline: () => void;
}

interface PermissionState {
  camera: "idle" | "granted" | "denied";
  mic: "idle" | "granted" | "denied";
  screen: "idle" | "granted" | "denied";
}

export default function ProctoringConsent({
  requireCamera,
  requireMic,
  requireScreen,
  onConsent,
  onDecline,
}: ProctoringConsentProps) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const requiredCount = [requireCamera, requireMic, requireScreen].filter(Boolean).length;

  const handleConsent = async () => {
    setLoading(true);
    try {
      await onConsent();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Live Proctoring Required</h2>
            <p className="text-sm text-muted-foreground">
              This test uses live monitoring for integrity
            </p>
          </div>
        </div>

        {/* What is required */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            The following permissions are required ({requiredCount}):
          </p>

          {requireCamera && (
            <PermissionRow
              icon={<Camera className="w-4 h-4" />}
              label="Camera"
              description="Your webcam will be monitored during the test"
              required
            />
          )}
          {requireMic && (
            <PermissionRow
              icon={<Mic className="w-4 h-4" />}
              label="Microphone"
              description="Audio will be monitored during the test"
              required
            />
          )}
          {requireScreen && (
            <PermissionRow
              icon={<Monitor className="w-4 h-4" />}
              label="Screen Share"
              description="Your screen will be monitored during the test"
              required
            />
          )}
        </div>

        {/* Privacy note */}
        <div className="bg-muted/50 rounded-lg p-3 mb-6 text-xs text-muted-foreground">
          <strong>Privacy notice:</strong> Periodic snapshots are captured and stored
          securely. Only authorised administrators can view your monitoring data.
          Data is used solely to verify test integrity.
        </div>

        {/* Agreement checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm text-foreground">
            I understand that my camera, microphone, and/or screen will be monitored
            and I consent to this proctoring.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDecline}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={handleConsent}
            disabled={!agreed || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {loading ? "Requesting permissions..." : "Accept & Continue"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PermissionRow({
  icon,
  label,
  description,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {required && (
            <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
