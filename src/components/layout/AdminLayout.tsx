import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  MessageSquare,
  History,
  Send,
  Bell,
  Library,
  IndianRupee,
  CreditCard,
  GraduationCap,
  UserPlus
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useStaffRoles } from "@/hooks/useStaffRoles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { AtomIcon } from "@/components/icons/AtomIcon";
import RoleSwitcher from "@/components/admin/RoleSwitcher";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

// Navigation sections by role
const allNavSections = {
  admin: [
    {
      title: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      ]
    },
    {
      title: "Departments",
      items: [
        { icon: GraduationCap, label: "Academic", path: "/admin/academic" },
        { icon: Users, label: "Operations", path: "/admin/operations" },
        { icon: IndianRupee, label: "Finance", path: "/admin/finance" },
      ]
    },
    {
      title: "Content",
      items: [
        { icon: FileText, label: "PDF Tests", path: "/admin/pdf-tests" },
        { icon: ClipboardList, label: "Tests", path: "/admin/tests" },
        { icon: BookOpen, label: "Question Bank", path: "/admin/question-bank" },
        { icon: Library, label: "PhyNetix Library", path: "/admin/phynetix-library" },
        { icon: Bell, label: "Batches", path: "/admin/batches" },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: MessageSquare, label: "Community", path: "/admin/community" },
        { icon: Send, label: "Requests", path: "/admin/requests" },
        { icon: History, label: "Audit Logs", path: "/admin/audit-logs" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
      ]
    }
  ],
  academic_admin: [
    {
      title: "Academic",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/academic" },
      ]
    },
    {
      title: "Content",
      items: [
        { icon: FileText, label: "PDF Tests", path: "/admin/pdf-tests" },
        { icon: ClipboardList, label: "Tests", path: "/admin/tests" },
        { icon: BookOpen, label: "Question Bank", path: "/admin/question-bank" },
        { icon: Library, label: "PhyNetix Library", path: "/admin/phynetix-library" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    }
  ],
  operations_admin: [
    {
      title: "Operations",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/operations" },
      ]
    },
    {
      title: "Students",
      items: [
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: UserPlus, label: "Enrollments", path: "/admin/operations" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: MessageSquare, label: "Community", path: "/admin/community" },
        { icon: Send, label: "Requests", path: "/admin/requests" },
      ]
    }
  ],
  finance_admin: [
    {
      title: "Finance",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/finance" },
      ]
    },
    {
      title: "Transactions",
      items: [
        { icon: CreditCard, label: "Payments", path: "/admin/finance" },
        { icon: IndianRupee, label: "Revenue", path: "/admin/finance" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    }
  ],
};

// Default navigation for other roles
const defaultNavSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    ]
  }
];

function getNavSections(role: AppRole | null) {
  if (!role) return defaultNavSections;
  return allNavSections[role as keyof typeof allNavSections] || defaultNavSections;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut, setViewMode } = useAuth();
  const { activeRole, userRoles } = useStaffRoles();

  // Get navigation sections based on active role
  const navSections = useMemo(() => getNavSections(activeRole), [activeRole]);

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
    <div className="min-h-screen bg-background flex admin-layout">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen border-r border-border bg-card/50 backdrop-blur-xl z-50"
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center flex-shrink-0">
              <AtomIcon className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-[19px] font-bold tracking-[0.1em] uppercase text-teal"
                >
                  PhyNetix
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Role Switcher - show if user has multiple roles */}
          {userRoles.length > 1 && (
            <div className="mb-4">
              <RoleSwitcher collapsed={collapsed} />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title}>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2"
                    >
                      {section.title}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const hasNotification = item.path === "/admin/requests" && unreadRequests > 0;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
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
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="font-medium flex-1 text-sm"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {!collapsed && hasNotification && (
                          <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                            {unreadRequests}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Back to Student View */}
          <button
            onClick={() => {
              setViewMode('student');
              navigate("/dashboard");
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mb-2"
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="font-medium"
                >
                  Student View
                </motion.span>
              )}
            </AnimatePresence>
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
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}