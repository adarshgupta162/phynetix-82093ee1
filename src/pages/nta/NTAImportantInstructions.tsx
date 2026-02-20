import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LocationState {
  testName?: string;
  studentName?: string;
  studentAvatar?: string | null;
  systemId?: string;
  testDuration?: number;
  fullscreenEnabled?: boolean;
  examType?: string;
  testType?: string;
}

export default function NTAImportantInstructions() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const {
    testName = "Test",
    studentName = "Student",
    studentAvatar = null,
    systemId = "",
    testDuration = 0,
    fullscreenEnabled = true,
    examType = "custom",
    testType = "full",
  } = state;

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const getExamInstructions = () => {
    if (examType === "jee_mains") {
      return (
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            The motive for enabling this mock test is to familiarize the candidates with the
            Computer Based Test (CBT) environment.
          </p>
          <p>
            The types of questions and marking scheme is only illustrative and is in no way
            indicative or representation of the type of questions and marking scheme of the actual
            question paper.
          </p>

          <h4 className="font-bold text-gray-800 mt-4">Section wise Instructions</h4>
          <p className="italic">Note: There will be 25% negative marking in both the sections.</p>

          <p>
            <strong>SECTION 1:</strong> Subject Proficiency Test (Subject Code 101)
            <br />
            Maximum marks: 50
          </p>
          <p>
            <strong>SECTION 2:</strong> Research Aptitude Test (Subject Code 102)
            <br />
            Maximum marks: 100
          </p>

          <p>No clarification will be provided during the exam.</p>
          <p>
            Calculators and other electronic devices are not allowed during the exam. Rough sheets
            and pens will be provided in the exam center. A virtual on-screen calculator is
            available for use.
          </p>
          <p>
            Some questions may have more than one answer correct. Points will be given only when ALL
            the correct answers are marked and NONE of the incorrect are marked.
          </p>
          <p>
            The exam is spread over two sections, Section 1 and Section 2. You cannot review your
            answers to Section 1 once you start answering Section 2.
          </p>
        </div>
      );
    }

    if (examType === "jee_advanced") {
      return (
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            The test consists of multiple subjects with section-wise questions. Each section may
            have different marking schemes.
          </p>

          <h4 className="font-bold text-gray-800 mt-4">Section wise Instructions</h4>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              For single correct answer questions: +3 marks for correct answer, -1 for incorrect
              answer.
            </li>
            <li>
              For multiple correct answer questions: +4 marks for all correct answers (partial
              marking applies), 0 for incorrect.
            </li>
            <li>For numerical questions: +3 marks for correct answer, 0 for incorrect.</li>
          </ul>

          <p className="mt-4">No clarification will be provided during the exam.</p>
          <p>
            Calculators and other electronic devices are not allowed during the exam. A virtual
            on-screen calculator is available for use.
          </p>
          <p>
            The exam is divided into sections by subject. You can navigate between sections freely
            during the test duration.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-sm text-gray-700">
        <p className="font-semibold">General Test Instructions:</p>
        <p>
          This test contains questions of various types. Please read each question carefully before
          answering.
        </p>

        <h4 className="font-bold text-gray-800 mt-4">Marking Scheme:</h4>
        <ul className="list-disc ml-6 space-y-2">
          <li>Correct Answer: +4 marks</li>
          <li>Incorrect Answer: -1 mark</li>
          <li>Unattempted: 0 marks</li>
        </ul>

        <p className="mt-4">You can navigate freely between all questions during the test.</p>
        <p>Use the question palette on the right to track your progress.</p>
        <p>Mark questions for review if you want to revisit them.</p>
      </div>
    );
  };

  const handleBegin = async () => {
    if (!agreed) {
      toast({
        title: "Please agree to the terms",
        description: "You must agree to the test rules before starting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: startData, error: startError } = await supabase.functions.invoke(
        "start-test",
        { body: { test_id: testId } }
      );

      if (startError || startData?.error) {
        throw new Error(startData?.error || startError?.message || "Failed to start test");
      }

      navigate(`/test/${testId}/nta`, {
        state: {
          testName: startData.test_name || testName,
          studentName,
          studentAvatar,
          systemId,
          fullscreenEnabled,
          examType,
          testType,
          testDuration,
          attemptId: startData.attempt_id,
          timeLeft: startData.duration_minutes * 60,
          existingAnswers: startData.is_resume ? startData.existing_answers : null,
          existingTimePerQuestion: startData.is_resume
            ? startData.existing_time_per_question
            : null,
          fullscreenExitCount: startData.fullscreen_exit_count || 0,
        },
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start test. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-[#fbbf24] px-6 py-3 flex items-center justify-between">
        <div className="text-sm font-medium">System Name: {systemId}</div>
        <div className="text-sm text-right">
          <div className="font-medium">Candidate Name: {studentName}</div>
          <div className="text-[#fbbf24]">Subject: {testName}</div>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-[#1a73e8] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Other Important Instructions</h2>
            <p className="text-white/80 text-sm">General instructions:</p>
          </div>

          <div className="p-6 space-y-6">
            {getExamInstructions()}

            {/* Fullscreen Warning */}
            {fullscreenEnabled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-yellow-800">Fullscreen Mode Required</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      This test requires fullscreen mode. Exiting fullscreen more than 7 times will
                      auto-submit your test.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div className="border-t border-gray-200 pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
                <span className="text-gray-700 text-sm">
                  I have read and understood the instructions. All computer hardware allotted to me
                  are in proper working condition. I declare that I am not in possession of, not
                  wearing, or not carrying any prohibited gadget like mobile phone, bluetooth
                  devices, etc., or any prohibited material with me into the Examination Hall. I
                  agree that in case of not adhering to the instructions, I shall be liable to be
                  debarred from this Test/Examination and/or to disciplinary action, which may
                  include a ban from future Tests/Examinations.
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="px-8 py-2 text-lg"
            >
              Previous
            </Button>
            <Button
              onClick={handleBegin}
              disabled={!agreed || loading}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-8 py-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "I am ready to begin"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
