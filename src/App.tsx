import { Toaster } from "@/components/ui/toaster";
import DetailedAnalysis from "@/pages/DetailedAnalysis";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TestLibrary from "./pages/TestLibrary";
import TestInterface from "./pages/TestInterface";
import PDFTestInterface from "./pages/PDFTestInterface";
import TestAnalysis from "./pages/TestAnalysis";
import QuestionWiseAnalysis from "./pages/QuestionWiseAnalysis";
import MyAttempts from "./pages/MyAttempts";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminQuestions from "./pages/admin/AdminQuestions";
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
            <Route path="/test/:testId" element={<TestInterface />} />
            <Route path="/pdf-test/:testId" element={<PDFTestInterface />} />
            <Route path="/test/:testId/analysis" element={<QuestionWiseAnalysis />} />
            <Route path="/test/:testId/detailed-analysis" element={<DetailedAnalysis />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attempts" element={<MyAttempts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/test-creator" element={<TestCreator />} />
            <Route path="/admin/test-editor/:testId" element={<TestEditor />} />
            <Route path="/admin/pdf-tests" element={<PDFTestList />} />
            <Route path="/admin/pdf-tests/create" element={<PDFTestCreate />} />
            <Route path="/admin/pdf-tests/:testId/edit" element={<PDFTestEditor />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
