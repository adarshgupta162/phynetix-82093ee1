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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { attempt_id, answers, time_taken_seconds } = await req.json();
    if (!attempt_id) {
      throw new Error("attempt_id is required");
    }

    console.log(`Submitting test attempt ${attempt_id} for user ${user.id}`);

    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .select("id, test_id, user_id, completed_at")
      .eq("id", attempt_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError || !attempt) {
      console.error("Attempt not found:", attemptError);
      throw new Error("Test attempt not found");
    }

    // Check if already completed
    if (attempt.completed_at) {
      console.log("Attempt already completed");
      throw new Error("Test already submitted");
    }

    // Get test info to determine type
    const { data: test } = await supabaseAdmin
      .from("tests")
      .select("test_type, exam_type")
      .eq("id", attempt.test_id)
      .single();

    let score = 0;
    let totalMarks = 0;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    const questionResults: Record<string, any> = {};
    const subjectScores: Record<string, { correct: number; incorrect: number; skipped: number; total: number }> = {};

    // Check if PDF test (use test_section_questions)
    if (test?.test_type === 'pdf') {
      console.log("Grading PDF test");
      
      const { data: sectionQuestions, error: sqError } = await supabaseAdmin
        .from("test_section_questions")
        .select(`
          id,
          question_number,
          correct_answer,
          marks,
          negative_marks,
          section_id,
          test_sections!inner (
            section_type,
            name,
            subject_id,
            test_subjects!inner (
              name
            )
          )
        `)
        .eq("test_id", attempt.test_id)
        .order("question_number");

      if (sqError) {
        console.error("Failed to fetch section questions:", sqError);
        throw new Error("Failed to calculate score");
      }

      for (const q of sectionQuestions || []) {
        const questionId = q.id;
        const correctAnswer = q.correct_answer;
        const marks = q.marks ?? 4;
        const negativeMarks = q.negative_marks ?? 1;
        const userAnswer = answers?.[questionId];
        const section = q.test_sections as any;
        const sectionType = section?.section_type || 'single_choice';
        const subject = section?.test_subjects?.name ?? "General";

        totalMarks += marks;

        if (!subjectScores[subject]) {
          subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0 };
        }
        subjectScores[subject].total++;

        let isCorrect = false;
        let marksObtained = 0;

        if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
          skipped++;
          subjectScores[subject].skipped++;
        } else {
          // Handle different question types
          if (sectionType === 'multiple_choice') {
            // Multiple choice: compare arrays
            const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
            const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [userAnswer];
            
            if (JSON.stringify(correctArr) === JSON.stringify(userArr)) {
              correct++;
              score += marks;
              marksObtained = marks;
              isCorrect = true;
              subjectScores[subject].correct++;
            } else {
              // Partial marking for JEE Advanced
              if (test?.exam_type === 'jee_advanced') {
                const correctSet = new Set(correctArr);
                const userSet = new Set(userArr);
                const correctCount = [...userArr].filter(a => correctSet.has(a)).length;
                const wrongCount = [...userArr].filter(a => !correctSet.has(a)).length;
                
                if (wrongCount === 0 && correctCount > 0) {
                  // Partial marks
                  marksObtained = Math.floor((correctCount / correctArr.length) * marks);
                  score += marksObtained;
                  if (correctCount === correctArr.length) {
                    correct++;
                    isCorrect = true;
                    subjectScores[subject].correct++;
                  }
                } else {
                  incorrect++;
                  score -= 2; // JEE Advanced penalty
                  marksObtained = -2;
                  subjectScores[subject].incorrect++;
                }
              } else {
                incorrect++;
                subjectScores[subject].incorrect++;
              }
            }
          } else if (sectionType === 'integer') {
            // Integer: compare as numbers
            const correctNum = parseFloat(String(correctAnswer));
            const userNum = parseFloat(String(userAnswer));
            
            if (!isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.01) {
              correct++;
              score += marks;
              marksObtained = marks;
              isCorrect = true;
              subjectScores[subject].correct++;
            } else {
              incorrect++;
              subjectScores[subject].incorrect++;
            }
          } else {
            // Single choice
            if (String(userAnswer) === String(correctAnswer)) {
              correct++;
              score += marks;
              marksObtained = marks;
              isCorrect = true;
              subjectScores[subject].correct++;
            } else {
              incorrect++;
              score -= negativeMarks;
              marksObtained = -negativeMarks;
              subjectScores[subject].incorrect++;
            }
          }
        }

        questionResults[questionId] = {
          question_number: q.question_number,
          correct_answer: correctAnswer,
          user_answer: userAnswer ?? null,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          marks: marks,
          negative_marks: negativeMarks,
          subject,
          section_type: sectionType,
        };
      }
    } else {
      // Regular test (use test_questions)
      console.log("Grading regular test");
      
      const { data: testQuestions, error: questionsError } = await supabaseAdmin
        .from("test_questions")
        .select(`question_id, questions(id, correct_answer, marks, negative_marks, chapters(name, courses(name)))`)
        .eq("test_id", attempt.test_id);

      if (questionsError) {
        console.error("Failed to fetch questions:", questionsError);
        throw new Error("Failed to calculate score");
      }

      for (const tq of testQuestions || []) {
        const q = tq.questions as any;
        if (!q) continue;

        const questionId = q.id;
        const correctAnswer = q.correct_answer;
        const marks = q.marks ?? 4;
        const negativeMarks = q.negative_marks ?? 1;
        const userAnswer = answers?.[questionId];
        const chapter = q.chapters as any;
        const course = chapter?.courses as any;
        const subject = course?.name ?? "General";
        const chapterName = chapter?.name ?? "General";

        totalMarks += marks;

        if (!subjectScores[subject]) {
          subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0 };
        }
        subjectScores[subject].total++;

        let isCorrect = false;
        let marksObtained = 0;

        if (userAnswer === undefined || userAnswer === null) {
          skipped++;
          subjectScores[subject].skipped++;
        } else if (String(userAnswer) === String(correctAnswer)) {
          correct++;
          score += marks;
          marksObtained = marks;
          isCorrect = true;
          subjectScores[subject].correct++;
        } else {
          incorrect++;
          score -= negativeMarks;
          marksObtained = -negativeMarks;
          subjectScores[subject].incorrect++;
        }

        questionResults[questionId] = {
          correct_answer: correctAnswer,
          user_answer: userAnswer ?? null,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          subject,
          chapter: chapterName,
        };
      }
    }

    // Calculate rank among all attempts for this test
    const { data: allAttempts } = await supabaseAdmin
      .from("test_attempts")
      .select("id, score")
      .eq("test_id", attempt.test_id)
      .not("completed_at", "is", null)
      .order("score", { ascending: false });

    let rank = 1;
    let percentile = 100;
    
    if (allAttempts && allAttempts.length > 0) {
      // Find rank (including current attempt which we're about to save)
      const scoresWithCurrent = [...allAttempts.map(a => a.score ?? 0), score].sort((a, b) => b - a);
      rank = scoresWithCurrent.indexOf(score) + 1;
      
      const scoresBelow = scoresWithCurrent.filter(s => s < score).length;
      percentile = Math.round((scoresBelow / scoresWithCurrent.length) * 100 * 10) / 10;
    }

    // Update attempt with results
    const { error: updateError } = await supabaseClient
      .from("test_attempts")
      .update({
        answers,
        score,
        total_marks: totalMarks,
        time_taken_seconds,
        completed_at: new Date().toISOString(),
        rank,
        percentile,
      })
      .eq("id", attempt_id);

    if (updateError) {
      console.error("Failed to update attempt:", updateError);
      throw new Error("Failed to save results");
    }

    // Recalculate ranks for all attempts
    if (allAttempts && allAttempts.length > 0) {
      const updatedAttempts = [...allAttempts, { id: attempt_id, score }]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      
      for (let i = 0; i < updatedAttempts.length; i++) {
        const newRank = i + 1;
        const newPercentile = Math.round(((updatedAttempts.length - newRank) / updatedAttempts.length) * 100 * 10) / 10;
        
        await supabaseAdmin
          .from("test_attempts")
          .update({ rank: newRank, percentile: newPercentile })
          .eq("id", updatedAttempts[i].id);
      }
    }

    console.log(`Test ${attempt_id} submitted. Score: ${score}/${totalMarks}, Rank: ${rank}, Percentile: ${percentile}`);

    return new Response(
      JSON.stringify({
        score,
        total_marks: totalMarks,
        correct,
        incorrect,
        skipped,
        rank,
        percentile,
        question_results: questionResults,
        subject_scores: subjectScores,
        time_taken_seconds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in submit-test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
