import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { test_id } = await req.json();
    if (!test_id) {
      throw new Error("test_id is required");
    }

    console.log(`Starting test ${test_id} for user ${user.id}`);

    // Check if user has already attempted this test
    const { data: existingAttempt, error: existingError } = await supabaseClient
      .from("test_attempts")
      .select("id, completed_at, started_at, fullscreen_exit_count, answers")
      .eq("test_id", test_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // If there's an existing attempt that's not completed, return it for resume
    if (existingAttempt && !existingAttempt.completed_at) {
      console.log(`User ${user.id} resuming test ${test_id}, attempt: ${existingAttempt.id}`);
      
      // Get test info
      const { data: test } = await supabaseClient
        .from("tests")
        .select("id, name, duration_minutes")
        .eq("id", test_id)
        .single();

      if (!test) {
        throw new Error("Test not found");
      }

      // Calculate remaining time
      const startedAt = new Date(existingAttempt.started_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const totalSeconds = test.duration_minutes * 60;
      const remainingMinutes = Math.max(0, Math.ceil((totalSeconds - elapsedSeconds) / 60));

      return new Response(
        JSON.stringify({
          attempt_id: existingAttempt.id,
          test_name: test.name,
          duration_minutes: remainingMinutes,
          fullscreen_exit_count: existingAttempt.fullscreen_exit_count || 0,
          existing_answers: existingAttempt.answers || {},
          is_resume: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If attempt is completed, don't allow re-attempt
    if (existingAttempt && existingAttempt.completed_at) {
      console.log(`User ${user.id} already completed test ${test_id}`);
      throw new Error("You have already completed this test. Each test can only be attempted once.");
    }

    const { data: test, error: testError } = await supabaseClient
      .from("tests")
      .select("id, name, duration_minutes, is_published")
      .eq("id", test_id)
      .eq("is_published", true)
      .maybeSingle();

    if (testError || !test) {
      console.error("Test not found:", testError);
      throw new Error("Test not found or not published");
    }

    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .insert({
        test_id: test_id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        answers: {},
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Failed to create attempt:", attemptError);
      throw new Error("Failed to start test");
    }

    console.log(`Created attempt ${attempt.id} for test ${test_id}`);

    return new Response(
      JSON.stringify({
        attempt_id: attempt.id,
        test_name: test.name,
        duration_minutes: test.duration_minutes,
        is_resume: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in start-test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
