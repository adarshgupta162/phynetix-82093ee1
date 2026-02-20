import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function NTAInstructions() {
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

  const handleNext = () => {
    navigate(`/test/${testId}/nta-important-instructions`, {
      state,
    });
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
            <h2 className="text-xl font-bold">Instructions</h2>
            <p className="text-white/80 text-sm">Please read the instructions carefully</p>
          </div>

          <div className="p-6 space-y-6">
            {testType === "practice" && (
              <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 text-center">
                <p className="text-red-700 font-bold text-lg">
                  This Mock Exam is Only for Practice Purpose
                </p>
              </div>
            )}

            {/* General Instructions */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#1a73e8]" />
                General Instructions
              </h3>
              <ul className="list-decimal ml-6 space-y-2 text-gray-700 text-sm">
                <li>
                  Total duration of examination is <strong>{testDuration} minutes</strong>.
                </li>
                <li>
                  The clock will be set at the server. The countdown timer will display the remaining
                  time available for you to complete the examination. When the timer reaches zero,
                  the examination will end by itself. You will not be required to end or submit your
                  examination.
                </li>
                <li>
                  The Question Palette displayed on the right side of screen will show the status of
                  each question using one of the following symbols:
                </li>
              </ul>
            </div>

            {/* Question Palette Legend */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Legend:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#d1d5db] flex items-center justify-center text-gray-700 font-bold">
                    1
                  </div>
                  <span className="text-gray-700">You have not visited the question yet</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#ef4444] text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <span className="text-gray-700">You have not answered the question</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#22c55e] text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <span className="text-gray-700">You have answered the question</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#a855f7] text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <span className="text-gray-700">
                    You have NOT answered the question, but have marked the question for review
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#a855f7] text-white flex items-center justify-center font-bold relative">
                    5
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-white"></span>
                  </div>
                  <span className="text-gray-700">
                    The question(s) "Answered and Marked for Review" will be considered for
                    evaluation
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 italic">
                The Marked for Review status for a question simply indicates that you would like to
                look at that question again.
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <Button
              onClick={handleNext}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-8 py-2 text-lg"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
