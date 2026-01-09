// Role-based permission system
export type AppRole = 'admin' | 'head' | 'manager' | 'teacher' | 'data_manager' | 'test_manager' | 'student';

export interface RolePermissions {
  // Test & Question permissions
  canCreateTest: boolean;
  canEditTest: boolean;
  canDeleteTest: boolean;
  canPublishTest: boolean;
  canViewTestAnalytics: boolean;
  canManageQuestionBank: boolean;
  
  // Student data permissions
  canViewStudentData: boolean;
  canEditStudentData: boolean;
  canDeleteStudent: boolean;
  canCreateStudent: boolean;
  
  // User management
  canCreateUser: boolean;
  canEditUserRole: boolean;
  canDeleteUser: boolean;
  canViewAllUsers: boolean;
  
  // Staff features
  canAccessAdminPanel: boolean;
  canAccessCommunity: boolean;
  canViewAuditLogs: boolean;
  canSendNotifications: boolean;
  canApproveRequests: boolean;
  
  // Settings
  canManageSettings: boolean;
  canManageDepartments: boolean;
}

export const rolePermissions: Record<AppRole, RolePermissions> = {
  admin: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: true,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: true,
    canEditStudentData: true,
    canDeleteStudent: true,
    canCreateStudent: true,
    canCreateUser: true,
    canEditUserRole: true,
    canDeleteUser: true,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: true,
    canManageSettings: true,
    canManageDepartments: true,
  },
  head: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: true,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false, // Requires request
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
  manager: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: false,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
  teacher: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: false,
    canPublishTest: false, // Requires approval
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false, // Requires request
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: false,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
  data_manager: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: true,
    canManageQuestionBank: false,
    canViewStudentData: true,
    canEditStudentData: true,
    canDeleteStudent: false,
    canCreateStudent: true,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
  test_manager: {
    canCreateTest: false,
    canEditTest: true, // Only test settings
    canDeleteTest: false,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: false,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: false,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
  student: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: false,
    canManageQuestionBank: false,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: false,
    canAccessCommunity: false,
    canViewAuditLogs: false,
    canSendNotifications: false,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
  },
};

export function getPermissions(role: AppRole): RolePermissions {
  return rolePermissions[role] || rolePermissions.student;
}

export function hasPermission(role: AppRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[role]?.[permission] ?? false;
}

export function isStaffRole(role: AppRole): boolean {
  return role !== 'student';
}

export const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  head: 'Head',
  manager: 'Manager',
  teacher: 'Teacher',
  data_manager: 'Data Manager',
  test_manager: 'Test Manager',
  student: 'Student',
};

export const roleBadgeColors: Record<AppRole, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  head: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  teacher: 'bg-green-500/10 text-green-500 border-green-500/20',
  data_manager: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  test_manager: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  student: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};
