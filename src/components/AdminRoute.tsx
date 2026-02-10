import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { validateDomainAccess, getMainDomainUrl, isAdminDomain } from "@/utils/domain";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated, redirect to auth page
        navigate('/auth');
      } else if (!isAdmin) {
        // Authenticated but not admin
        // Check if on admin domain - if so, redirect to main domain
        const onAdminDomain = isAdminDomain();
        if (onAdminDomain && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          // In production, redirect to main domain
          window.location.href = getMainDomainUrl('/dashboard');
        } else {
          // In development or already on main domain, navigate to dashboard
          navigate('/dashboard');
        }
      } else {
        // User is admin, validate domain access
        const hasValidAccess = validateDomainAccess(isAdmin);
        if (!hasValidAccess && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          // In production, if on wrong domain, redirect to correct one
          window.location.href = getMainDomainUrl('/dashboard');
        }
      }
    }
  }, [user, isLoading, isAdmin, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
