// Admin utility functions for session management and permission checking

export class AdminAuth {
  // Get current admin info from session
  static getCurrentAdmin() {
    if (typeof window === "undefined") return null;

    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (adminAuthenticated !== "true") return null;

    return {
      email: sessionStorage.getItem("adminEmail"),
      type: sessionStorage.getItem("adminType"), // 'root' or 'firebase'
      id: sessionStorage.getItem("adminId"),
      permissions: JSON.parse(
        sessionStorage.getItem("adminPermissions") || "{}"
      ),
      loginTime: sessionStorage.getItem("adminLoginTime"),
    };
  }

  // Check if current admin has specific permission
  static hasPermission(permission) {
    const admin = this.getCurrentAdmin();
    if (!admin) return false;

    // Root admin has all permissions
    if (admin.type === "root") return true;

    // Check specific permission for Firebase admins
    return admin.permissions[permission] === true;
  }

  // Check if current admin can edit
  static canEdit() {
    return this.hasPermission("edit");
  }

  // Check if current admin can delete
  static canDelete() {
    return this.hasPermission("delete");
  }

  // Check if current admin can input/create
  static canInput() {
    return this.hasPermission("input");
  }

  // Check if current admin is root admin
  static isRootAdmin() {
    const admin = this.getCurrentAdmin();
    return admin?.type === "root";
  }

  // Logout function
  static logout() {
    if (typeof window === "undefined") return;

    // Clear all admin session data from sessionStorage
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("adminLoginTime");
    sessionStorage.removeItem("adminEmail");
    sessionStorage.removeItem("adminType");
    sessionStorage.removeItem("adminId");
    sessionStorage.removeItem("adminPermissions");

    // Clear all admin session data from localStorage (just in case)
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminLoginTime");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminType");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminPermissions");

    // Clear any other admin-related data that might be stored
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("admin")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("admin")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Redirect to login page
    window.location.href = "/admin/login";
  }

  // Get admin display name
  static getDisplayName() {
    const admin = this.getCurrentAdmin();
    if (!admin) return "Unknown Admin";

    if (admin.type === "root") {
      return "Root Administrator";
    }

    return admin.email || "Admin User";
  }

  // Get admin permissions as array of strings
  static getPermissionsList() {
    const admin = this.getCurrentAdmin();
    if (!admin) return [];

    if (admin.type === "root") {
      return ["edit", "delete", "input", "admin_management"];
    }

    const permissions = [];
    if (admin.permissions.edit) permissions.push("edit");
    if (admin.permissions.delete) permissions.push("delete");
    if (admin.permissions.input) permissions.push("input");

    return permissions;
  }
}
