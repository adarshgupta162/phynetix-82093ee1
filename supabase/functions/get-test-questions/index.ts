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

    // First get the test type
    const { data: testData, error: testError } = await supabaseClient
      .from("tests")
      .select("test_type")
      .eq("id", test_id)
      .single();

    if (testError) {
      console.error("Failed to fetch test:", testError);
      throw new Error("Failed to fetch test");
    }

    const testType = testData?.test_type;
    console.log(`Test type: ${testType}`);

    let questions = [];

    if (testType === "pdf") {
      // PDF Tests: Fetch from test_section_questions via subjects/sections
      const { data: sectionQuestions, error: sqError } = await supabaseClient
        .from("test_section_questions")
        .select(`
          id, 
          question_number, 
          question_text, 
          options, 
          correct_answer,
          marks, 
          negative_marks,
          order_index,
          pdf_page,
          image_url,
          section:test_sections(
            id,
            name,
            section_type,
            subject:test_subjects(id, name)
          )
        `)
        .eq("test_id", test_id)
        .order("question_number");

      if (sqError) {
        console.error("Failed to fetch PDF test questions:", sqError);
        throw new Error("Failed to fetch questions");
      }

      questions = (sectionQuestions || []).map((q: any, index: number) => ({
        id: q.id,
        order: q.order_index ?? q.question_number ?? index,
        question_text: q.question_text || `Question ${q.question_number}`,
        options: q.options,
        difficulty: "medium",
        marks: q.marks ?? 4,
        negative_marks: q.negative_marks ?? 1,
        question_type: q.section?.section_type || "single_choice",
        subject: q.section?.subject?.name ?? "General",
        chapter: q.section?.name ?? "General",
        pdf_page: q.pdf_page,
        image_url: q.image_url,
        correct_answer: q.correct_answer
      }));
    } else {
      // Normal Tests: Fetch from test_questions joined with questions table
      const { data: testQuestions, error: questionsError } = await supabaseClient
        .from("test_questions")
        .select(`
          order_index, 
          question_id, 
          questions(
            id, 
            question_text, 
            options, 
            difficulty, 
            marks, 
            negative_marks, 
            question_type, 
            image_url, 
            correct_answer,
            chapters(id, name, courses(id, name))
          )
        `)
        .eq("test_id", test_id)
        .order("order_index");

      if (questionsError) {
        console.error("Failed to fetch normal test questions:", questionsError);
        throw new Error("Failed to fetch questions");
      }

      questions = (testQuestions || []).map((tq: any, index: number) => {
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
          image_url: q?.image_url,
          subject: course?.name ?? "General",
          chapter: chapter?.name ?? "General",
          correct_answer: q?.correct_answer
        };
      });

      // If no questions in test_questions, try fetching from test_section_questions
      // (this handles tests created with JEE preset that use section-based structure)
      if (questions.length === 0) {
        console.log("No questions in test_questions, trying test_section_questions...");
        
        const { data: sectionQuestions, error: sqError } = await supabaseClient
          .from("test_section_questions")
          .select(`
            id, 
            question_number, 
            question_text, 
            options, 
            correct_answer,
            marks, 
            negative_marks,
            order_index,
            image_url,
            section:test_sections(
              id,
              name,
              section_type,
              order_index,
              subject:test_subjects(id, name, order_index)
            )
          `)
          .eq("test_id", test_id)
          .order("question_number");

        if (!sqError && sectionQuestions && sectionQuestions.length > 0) {
          // Sort by subject order, then section order, then question number
          const sorted = sectionQuestions.sort((a: any, b: any) => {
            const subjectOrderA = a.section?.subject?.order_index ?? 0;
            const subjectOrderB = b.section?.subject?.order_index ?? 0;
            if (subjectOrderA !== subjectOrderB) return subjectOrderA - subjectOrderB;
            
            const sectionOrderA = a.section?.order_index ?? 0;
            const sectionOrderB = b.section?.order_index ?? 0;
            if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
            
            return (a.question_number ?? 0) - (b.question_number ?? 0);
          });

          questions = sorted.map((q: any, index: number) => ({
            id: q.id,
            order: index,
            question_text: q.question_text || null,
            options: q.options,
            difficulty: "medium",
            marks: q.marks ?? 4,
            negative_marks: q.negative_marks ?? 1,
            question_type: q.section?.section_type || "single_choice",
            subject: q.section?.subject?.name ?? "General",
            chapter: q.section?.name ?? "General",
            image_url: q.image_url || null,
            correct_answer: q.correct_answer
          }));
          
          console.log("Sample question data:", JSON.stringify(questions[0]));
        }
      }
    }

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
