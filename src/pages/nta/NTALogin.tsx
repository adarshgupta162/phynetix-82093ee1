import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function NTALogin() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState("");
  const [systemId, setSystemId] = useState("");
  const [testDuration, setTestDuration] = useState(0);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [examType, setExamType] = useState("custom");
  const [testType, setTestType] = useState("full");

  useEffect(() => {
    if (testId) loadData();
  }, [testId]);

  const loadData = async () => {
    try {
      const { data: testData } = await supabase
        .from("tests")
        .select("name, duration_minutes, fullscreen_enabled, exam_type, test_type")
        .eq("id", testId!)
        .single();

      if (testData) {
        setTestName(testData.name);
        setTestDuration(testData.duration_minutes);
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
        setExamType(testData.exam_type || "custom");
        setTestType(testData.test_type || "full");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, roll_number")
          .eq("id", user.id)
          .single();

        setStudentName(profile?.full_name || "Student");
        setStudentAvatar(profile?.avatar_url || null);
        setRollNumber(profile?.roll_number || user.id.substring(0, 8));

        const storageKey = `systemId_${testId}`;
        let storedId = localStorage.getItem(storageKey);
        if (!storedId) {
          storedId = `C${Math.floor(100 + Math.random() * 900)}`;
          localStorage.setItem(storageKey, storedId);
        }
        setSystemId(storedId);

        // Check existing attempt
        const { data: existing } = await supabase
          .from("test_attempts")
          .select("id, completed_at")
          .eq("test_id", testId!)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing?.completed_at) {
          navigate(`/test/${testId}/analysis`);
          return;
        }
        if (existing) {
          // Resume – skip login/instruction screens
          navigate(`/test/${testId}/nta`, {
            state: {
              testName: testData?.name,
              studentName: profile?.full_name || "Student",
              studentAvatar: profile?.avatar_url || null,
              systemId: storedId,
              fullscreenEnabled: testData?.fullscreen_enabled ?? true,
              examType: testData?.exam_type || "custom",
              testType: testData?.test_type || "full",
              testDuration: testData?.duration_minutes,
            },
          });
          return;
        }
      }
    } catch (err) {
      console.error("NTALogin load error:", err);
    }
    setLoading(false);
  };

  const handleSignIn = () => {
    navigate(`/test/${testId}/nta-instructions`, {
      state: {
        testName,
        studentName,
        studentAvatar,
        systemId,
        testDuration,
        fullscreenEnabled,
        examType,
        testType,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

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

      {/* Disclaimer */}
      <div className="bg-[#1e3a5f] text-white/90 px-6 py-3 text-center text-sm">
        Please contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen, or if the photograph is not yours.
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Student photo */}
        <div className="absolute top-8 right-8 w-40 h-40 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
          {studentAvatar ? (
            <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl" role="img" aria-label="User avatar">👤</span>
          )}
        </div>

        {/* Login box */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username / ID</label>
              <input
                type="text"
                value={rollNumber}
                disabled
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value="••••••••"
                  disabled
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed pr-10"
                />
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <Button
              onClick={handleSignIn}
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-3 text-lg mt-6"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
