import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProctoringConfig {
  enabled: boolean;
  requireCamera: boolean;
  requireMic: boolean;
  requireScreen: boolean;
  snapshotInterval: number; // seconds
}

export interface ProctoringStatus {
  sessionId: string | null;
  cameraGranted: boolean;
  micGranted: boolean;
  screenGranted: boolean;
  isActive: boolean;
  error: string | null;
}

export function useProctoringSession(
  testId: string | undefined,
  attemptId: string | null,
  userId: string | undefined,
  config: ProctoringConfig
) {
  const [status, setStatus] = useState<ProctoringStatus>({
    sessionId: null,
    cameraGranted: false,
    micGranted: false,
    screenGranted: false,
    isActive: false,
    error: null,
  });

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Initialise lazily created off-screen elements ──────────
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    return canvasRef.current;
  }, []);

  // ── Log an event to proctoring_events ──────────────────────
  const logEvent = useCallback(
    async (
      eventType: string,
      eventData?: Record<string, unknown>
    ) => {
      const sid = sessionIdRef.current;
      if (!sid || !userId || !testId) return;
      try {
        await supabase.from("proctoring_events").insert({
          session_id: sid,
          user_id: userId,
          test_id: testId,
          event_type: eventType,
          event_data: eventData ?? null,
        });
      } catch {
        // non-critical — swallow
      }
    },
    [userId, testId]
  );

  // ── Capture a frame from a video element and return base64 ─
  const captureFrame = useCallback(
    (videoEl: HTMLVideoElement, width = 640, height = 360): string | null => {
      try {
        const canvas = getCanvas();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(videoEl, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", 0.7);
      } catch {
        return null;
      }
    },
    [getCanvas]
  );

  // ── Convert base64 data-url to Blob ────────────────────────
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, data] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  // ── Upload snapshot to Supabase Storage ───────────────────
  const uploadSnapshot = useCallback(
    async (
      blob: Blob,
      kind: "camera" | "screen"
    ): Promise<string | null> => {
      if (!userId || !testId || !sessionIdRef.current) return null;
      const path = `${userId}/${testId}/${kind}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("proctoring-snapshots")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) return null;
      const { data } = supabase.storage
        .from("proctoring-snapshots")
        .getPublicUrl(path);
      return data?.publicUrl ?? null;
    },
    [userId, testId]
  );

  // ── Take a snapshot of camera and/or screen ───────────────
  const takeSnapshot = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    let cameraUrl: string | null = null;
    let screenUrl: string | null = null;

    if (videoElRef.current && cameraStreamRef.current) {
      const frame = captureFrame(videoElRef.current);
      if (frame) {
        cameraUrl = await uploadSnapshot(dataUrlToBlob(frame), "camera");
      }
    }

    if (screenVideoElRef.current && screenStreamRef.current) {
      const frame = captureFrame(screenVideoElRef.current, 1280, 720);
      if (frame) {
        screenUrl = await uploadSnapshot(dataUrlToBlob(frame), "screen");
      }
    }

    if (cameraUrl || screenUrl) {
      const updates: Record<string, unknown> = {
        snapshot_count: supabase.rpc as unknown, // incremented server-side via trigger would be ideal; we'll just set
      };
      // Update session's latest snapshot URLs
      const updateData: Record<string, string | number> = {};
      if (cameraUrl) updateData.latest_camera_url = cameraUrl;
      if (screenUrl) updateData.latest_screen_url = screenUrl;
      await supabase
        .from("proctoring_sessions")
        .update(updateData)
        .eq("id", sid);
      await logEvent("camera_snapshot", { camera_url: cameraUrl, screen_url: screenUrl });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureFrame, uploadSnapshot, logEvent]);

  // ── Start periodic snapshots ───────────────────────────────
  const startSnapshots = useCallback(
    (intervalSecs: number) => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      // Take one immediately
      takeSnapshot();
      snapshotIntervalRef.current = setInterval(
        takeSnapshot,
        intervalSecs * 1000
      );
    },
    [takeSnapshot]
  );

  // ── Attach camera stream to hidden video element ───────────
  const attachCameraStream = useCallback((stream: MediaStream) => {
    if (!videoElRef.current) {
      const v = document.createElement("video");
      v.muted = true;
      v.autoplay = true;
      v.style.display = "none";
      document.body.appendChild(v);
      videoElRef.current = v;
    }
    videoElRef.current.srcObject = stream;
    videoElRef.current.play().catch(() => {});
  }, []);

  // ── Attach screen stream to hidden video element ───────────
  const attachScreenStream = useCallback((stream: MediaStream) => {
    if (!screenVideoElRef.current) {
      const v = document.createElement("video");
      v.muted = true;
      v.autoplay = true;
      v.style.display = "none";
      document.body.appendChild(v);
      screenVideoElRef.current = v;
    }
    screenVideoElRef.current.srcObject = stream;
    screenVideoElRef.current.play().catch(() => {});
  }, []);

  // ── Request permissions ────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<{
    camera: boolean;
    mic: boolean;
    screen: boolean;
  }> => {
    let camera = false;
    let mic = false;
    let screen = false;

    // Camera + Mic (getUserMedia)
    if (config.requireCamera || config.requireMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: config.requireCamera,
          audio: config.requireMic,
        });
        if (config.requireCamera) {
          cameraStreamRef.current = stream;
          attachCameraStream(stream);
          camera = true;
        }
        if (config.requireMic) {
          micStreamRef.current = stream;
          mic = true;
        }
      } catch {
        // permission denied — camera/mic remain false
      }
    }

    // Screen share (getDisplayMedia)
    if (config.requireScreen) {
      try {
        const stream = await (navigator.mediaDevices as MediaDevices & {
          getDisplayMedia: (c: MediaStreamConstraints) => Promise<MediaStream>;
        }).getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = stream;
        attachScreenStream(stream);
        screen = true;
      } catch {
        // user cancelled or denied
      }
    }

    return { camera, mic, screen };
  }, [config, attachCameraStream, attachScreenStream]);

  // ── Create the proctoring session row ─────────────────────
  const createSession = useCallback(
    async (cameraGranted: boolean, micGranted: boolean, screenGranted: boolean) => {
      if (!attemptId || !userId || !testId) return null;
      const { data, error } = await supabase
        .from("proctoring_sessions")
        .upsert(
          {
            attempt_id: attemptId,
            test_id: testId,
            user_id: userId,
            camera_enabled: cameraGranted,
            mic_enabled: micGranted,
            screen_enabled: screenGranted,
            status: "active",
          },
          { onConflict: "attempt_id" }
        )
        .select("id")
        .single();
      if (error) return null;
      return data?.id ?? null;
    },
    [attemptId, userId, testId]
  );

  // ── Public: start the proctoring session ──────────────────
  const startSession = useCallback(async () => {
    if (!config.enabled || !attemptId || !userId || !testId) return;

    const { camera, mic, screen } = await requestPermissions();

    const sid = await createSession(camera, mic, screen);
    if (!sid) {
      setStatus((s) => ({ ...s, error: "Failed to create proctoring session" }));
      return;
    }
    sessionIdRef.current = sid;

    setStatus({
      sessionId: sid,
      cameraGranted: camera,
      micGranted: mic,
      screenGranted: screen,
      isActive: true,
      error: null,
    });

    await logEvent("test_start", {
      camera_granted: camera,
      mic_granted: mic,
      screen_granted: screen,
    });

    startSnapshots(config.snapshotInterval);
  }, [
    config,
    attemptId,
    userId,
    testId,
    requestPermissions,
    createSession,
    logEvent,
    startSnapshots,
  ]);

  // ── Public: stop the session ───────────────────────────────
  const stopSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }

    // Final snapshot before ending
    await takeSnapshot();
    await logEvent("test_end");

    await supabase
      .from("proctoring_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", sid);

    // Stop all tracks
    [cameraStreamRef, micStreamRef, screenStreamRef].forEach((ref) => {
      ref.current?.getTracks().forEach((t) => t.stop());
      ref.current = null;
    });
    // Remove hidden video elements
    [videoElRef, screenVideoElRef].forEach((ref) => {
      if (ref.current) {
        ref.current.remove();
        ref.current = null;
      }
    });

    sessionIdRef.current = null;
    setStatus((s) => ({ ...s, isActive: false }));
  }, [takeSnapshot, logEvent]);

  // ── Public: log arbitrary events from the test UI ─────────
  const emitEvent = useCallback(
    (eventType: string, data?: Record<string, unknown>) => {
      logEvent(eventType, data);
    },
    [logEvent]
  );

  // ── Focus/visibility monitoring ───────────────────────────
  useEffect(() => {
    if (!status.isActive) return;
    const onHide = () => emitEvent("tab_switch", { hidden: true });
    const onShow = () => emitEvent("focus_gain", { hidden: false });
    document.addEventListener("visibilitychange", () => {
      document.hidden ? onHide() : onShow();
    });
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [status.isActive, emitEvent]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      [cameraStreamRef, micStreamRef, screenStreamRef].forEach((ref) => {
        ref.current?.getTracks().forEach((t) => t.stop());
      });
      [videoElRef, screenVideoElRef].forEach((ref) => {
        ref.current?.remove();
      });
    };
  }, []);

  return { status, startSession, stopSession, emitEvent };
}
