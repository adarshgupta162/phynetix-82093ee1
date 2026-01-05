import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthCallback from "./pages/AuthCallback";
import { AuthProvider } from "@/hooks/useAuth";
import AdminRoute from "@/components/AdminRoute";
import ProfileGuard from "@/components/ProfileGuard";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TestLibrary from "./pages/TestLibrary";
import PDFTestLibrary from "./pages/PDFTestLibrary";
import NormalTestInterface from "./pages/NormalTestInterface";
import PDFTestInterface from "./pages/PDFTestInterface";
import NormalTestAnalysis from "./pages/NormalTestAnalysis";
import DetailedAnalysis from "./pages/DetailedAnalysis";
import QuestionWiseAnalysis from "./pages/QuestionWiseAnalysis";
import MyAttempts from "./pages/MyAttempts";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import QuestionBankPage from "./pages/QuestionBankPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQuestionBank from "./pages/admin/AdminQuestionBank";
import AdminTests from "./pages/admin/AdminTests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import TestCreator from "./pages/admin/TestCreator";
import TestEditor from "./pages/admin/TestEditor";
import PDFTestList from "./pages/admin/PDFTestList";
import PDFTestCreate from "./pages/admin/PDFTestCreate";
import PDFTestEditor from "./pages/admin/PDFTestEditor";
import NormalTestAnalytics from "./pages/admin/NormalTestAnalytics";
import NotFound from "./pages/NotFound";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

export default App;
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProfileGuard>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tests" element={<TestLibrary />} />
            <Route path="/pdf-tests" element={<PDFTestLibrary />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/test/:testId" element={<NormalTestInterface />} />
            <Route path="/pdf-test/:testId" element={<PDFTestInterface />} />
            <Route path="/test/:testId/analysis" element={<NormalTestAnalysis />} />
            <Route path="/pdf-test/:testId/analysis" element={<DetailedAnalysis />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attempts" element={<MyAttempts />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Admin Routes - All protected with AdminRoute */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/question-bank" element={<AdminRoute><AdminQuestionBank /></AdminRoute>} />
            <Route path="/admin/tests" element={<AdminRoute><AdminTests /></AdminRoute>} />
            <Route path="/admin/test-creator" element={<AdminRoute><TestCreator /></AdminRoute>} />
            <Route path="/admin/test-editor/:testId" element={<AdminRoute><TestEditor /></AdminRoute>} />
            <Route path="/admin/test-analytics/:testId" element={<AdminRoute><NormalTestAnalytics /></AdminRoute>} />
            <Route path="/admin/pdf-tests" element={<AdminRoute><PDFTestList /></AdminRoute>} />
            <Route path="/admin/pdf-tests/create" element={<AdminRoute><PDFTestCreate /></AdminRoute>} />
            <Route path="/admin/pdf-tests/:testId/edit" element={<AdminRoute><PDFTestEditor /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </ProfileGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
