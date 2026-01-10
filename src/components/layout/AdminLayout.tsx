import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  MessageSquare,
  History,
  Send,
  Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FileText, label: "PDF Tests", path: "/admin/pdf-tests" },
  { icon: BookOpen, label: "Question Bank", path: "/admin/question-bank" },
  { icon: ClipboardList, label: "Tests", path: "/admin/tests" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: MessageSquare, label: "Community", path: "/admin/community" },
  { icon: Send, label: "Requests", path: "/admin/requests" },
  { icon: History, label: "Audit Logs", path: "/admin/audit-logs" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut, setViewMode } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch unread requests count
  useEffect(() => {
    if (user) {
      fetchUnreadRequests();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('staff-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'staff_requests',
          },
          () => {
            fetchUnreadRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadRequests = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('staff_requests')
      .select('id')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      setUnreadRequests(data.length);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
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
          <Link to="/admin" className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold font-display gradient-text"
              >
                PhyNetix Admin
              </motion.span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const hasNotification = item.path === "/admin/requests" && unreadRequests > 0;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {hasNotification && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                    )}
                  </div>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {!collapsed && hasNotification && (
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {unreadRequests}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Back to Student View */}
          <button
            onClick={() => {
              setViewMode('student');
              navigate("/dashboard");
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mb-2"
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Student View</span>}
          </button>

          {/* Theme Toggle */}
          <div className="flex items-center justify-center py-2">
            <ThemeToggle />
          </div>
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