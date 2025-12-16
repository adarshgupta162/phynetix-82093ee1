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

    console.log(`Fetching questions for test ${test_id}`);

    const { data: testQuestions, error: questionsError } = await supabaseClient
      .from("test_questions")
      .select(`order_index, question_id, questions(id, question_text, options, difficulty, marks, negative_marks, question_type, chapters(id, name, courses(id, name)))`)
      .eq("test_id", test_id)
      .order("order_index");

    if (questionsError) {
      console.error("Failed to fetch questions:", questionsError);
      throw new Error("Failed to fetch questions");
    }

    const questions = (testQuestions || []).map((tq: any, index: number) => {
      const q = tq.questions;
      const chapter = q?.chapters;
      const course = chapter?.courses;
      return {
        id: q?.id,
        order: tq.order_index ?? index,
        question_text: q?.question_text,
        options: q?.options,
        difficulty: q?.difficulty,
        marks: q?.marks ?? 4,
        negative_marks: q?.negative_marks ?? 1,
        question_type: q?.question_type,
        subject: course?.name ?? "General",
        chapter: chapter?.name ?? "General",
      };
    });

    console.log(`Returning ${questions.length} questions for test ${test_id}`);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-test-questions:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
