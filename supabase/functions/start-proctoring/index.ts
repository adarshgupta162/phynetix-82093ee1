import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StartPayload = {
  test_id: string;
  attempt_id: string;
  camera_enabled?: boolean;
  mic_enabled?: boolean;
  screen_enabled?: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body = (await req.json()) as StartPayload;
    if (!body?.test_id || !body?.attempt_id) {
      throw new Error("test_id and attempt_id are required");
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, proctoring_enabled, proctoring_provider, proctoring_require_camera, proctoring_require_mic, proctoring_require_screen, proctoring_allowlist_enabled")
      .eq("id", body.test_id)
      .single();

    if (testError || !test) {
      throw new Error("Test not found");
    }

    if (!test.proctoring_enabled) {
      return new Response(
        JSON.stringify({ enabled: false, reason: "proctoring_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let allowlist = null;
    if (test.proctoring_allowlist_enabled) {
      const { data: allowlistRow } = await supabaseAdmin
        .from("proctoring_allowlist")
        .select("is_allowed, require_camera, require_mic, require_screen")
        .eq("test_id", body.test_id)
        .eq("user_id", user.id)
        .maybeSingle();
      allowlist = allowlistRow;

      if (!allowlistRow || allowlistRow.is_allowed === false) {
        return new Response(
          JSON.stringify({ enabled: false, blocked: true, reason: "user_not_allowlisted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const requireCamera = allowlist?.require_camera ?? test.proctoring_require_camera ?? false;
    const requireMic = allowlist?.require_mic ?? test.proctoring_require_mic ?? false;
    const requireScreen = allowlist?.require_screen ?? test.proctoring_require_screen ?? false;

    if (requireCamera && !body.camera_enabled) {
      throw new Error("Camera permission is required");
    }
    if (requireMic && !body.mic_enabled) {
      throw new Error("Microphone permission is required");
    }
    if (requireScreen && !body.screen_enabled) {
      throw new Error("Screen sharing is required");
    }

    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .select("id")
      .eq("id", body.attempt_id)
      .eq("test_id", body.test_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError || !attempt) {
      throw new Error("Attempt not found");
    }

    const { data: existingSession } = await supabaseAdmin
      .from("proctoring_sessions")
      .select("*")
      .eq("attempt_id", body.attempt_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const sessionPayload = {
      test_id: body.test_id,
      attempt_id: body.attempt_id,
      user_id: user.id,
      provider: test.proctoring_provider || "webrtc",
      camera_enabled: !!body.camera_enabled,
      mic_enabled: !!body.mic_enabled,
      screen_enabled: !!body.screen_enabled,
      status: "active",
      last_event_at: new Date().toISOString(),
    };

    const session = existingSession
      ? await supabaseAdmin
        .from("proctoring_sessions")
        .update(sessionPayload)
        .eq("id", existingSession.id)
        .select()
        .single()
      : await supabaseAdmin
        .from("proctoring_sessions")
        .insert(sessionPayload)
        .select()
        .single();

    if (session.error || !session.data) {
      throw new Error("Failed to start proctoring session");
    }

    return new Response(
      JSON.stringify({
        enabled: true,
        session: session.data,
        requirements: { requireCamera, requireMic, requireScreen },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in start-proctoring:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
