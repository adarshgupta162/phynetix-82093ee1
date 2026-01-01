import { Toaster } from "@/components/ui/toaster";
import DetailedAnalysis from "@/pages/DetailedAnalysis";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AdminRoute from "@/components/AdminRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TestLibrary from "./pages/TestLibrary";
import PDFTestLibrary from "./pages/PDFTestLibrary";
import TestInterface from "./pages/TestInterface";
import PDFTestInterface from "./pages/PDFTestInterface";
import TestAnalysis from "./pages/TestAnalysis";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tests" element={<TestLibrary />} />
            <Route path="/pdf-tests" element={<PDFTestLibrary />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/test/:testId" element={<TestInterface />} />
            <Route path="/pdf-test/:testId" element={<PDFTestInterface />} />
            <Route path="/test/:testId/analysis" element={<DetailedAnalysis />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attempts" element={<MyAttempts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Admin Routes - All protected with AdminRoute */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/question-bank" element={<AdminRoute><AdminQuestionBank /></AdminRoute>} />
            <Route path="/admin/tests" element={<AdminRoute><AdminTests /></AdminRoute>} />
            <Route path="/admin/test-creator" element={<AdminRoute><TestCreator /></AdminRoute>} />
            <Route path="/admin/test-editor/:testId" element={<AdminRoute><TestEditor /></AdminRoute>} />
            <Route path="/admin/pdf-tests" element={<AdminRoute><PDFTestList /></AdminRoute>} />
            <Route path="/admin/pdf-tests/create" element={<AdminRoute><PDFTestCreate /></AdminRoute>} />
            <Route path="/admin/pdf-tests/:testId/edit" element={<AdminRoute><PDFTestEditor /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
