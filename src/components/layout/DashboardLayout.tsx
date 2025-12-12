import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  User, 
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Test Library", path: "/tests" },
  { icon: ClipboardList, label: "My Attempts", path: "/attempts" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, signOut, isAdmin, viewMode, setViewMode } = useAuth();

  // Auth guard - redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'admin' ? 'student' : 'admin';
    setViewMode(newMode);
    if (newMode === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen border-r border-border bg-card/50 backdrop-blur-xl z-50"
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold font-display gradient-text"
              >
                QuizMaster
              </motion.span>
            )}
          </Link>

          {/* Admin View Toggle */}
          {isAdmin && (
            <button
              onClick={toggleViewMode}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg mb-4 transition-all duration-200",
                viewMode === 'admin'
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {viewMode === 'admin' ? (
                <>
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium text-sm"
                    >
                      Admin Mode
                    </motion.span>
                  )}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium text-sm"
                    >
                      Student Mode
                    </motion.span>
                  )}
                </>
              )}
            </button>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          {/* Theme Toggle */}
          <div className="flex items-center justify-center py-2">
            <ThemeToggle />
          </div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-20" : "ml-[260px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
