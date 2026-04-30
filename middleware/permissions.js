// @ts-nocheck
// middleware/permissions.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for all role → permission mappings.
// Both authorizePermission middleware and service-layer guards
// import from here.
// ─────────────────────────────────────────────────────────────

/** All roles that are considered "admin-side" (non-employee) */
const ADMIN_ROLES = ["super_admin", "hr_admin", "manager", "finance_admin"];

/**
 * Role → permission strings map.
 */
const ROLE_PERMISSIONS = {
    // ── Super Admin — full access ──────────────────────────────
    super_admin: [
        "manage_users",        // Create/update/delete users, assign roles
        "manage_employees",    // Full employee CRUD
        "manage_attendance",   // Mark, bulk-mark, update, delete attendance
        "approve_leave",       // Approve or reject any leave request
        "manage_payroll",      // Generate, run, update, delete payroll
        "manage_expenditure",  // Expenses, income, advances
        "manage_wages",        // Wage records
        "view_reports",        // All financial & HR reports
        "manage_settings",     // System-wide settings
        "manage_recruitment",  // Job postings, applications
        "manage_tasks",        // Create/assign/delete tasks
        "manage_announcements",// Create/edit/delete announcements
        "manage_performance",  // Create/update performance reviews
        "manage_tracking",     // Location & time tracking
        "manage_holidays",     // Add/edit/delete holidays
    ],

    // ── HR Admin ──────────────────────────────────────────────
    hr_admin: [
        "manage_employees",
        "manage_attendance",
        "approve_leave",
        "view_reports",
        "manage_recruitment",
        "manage_tasks",
        "manage_announcements",
        "manage_performance",
        "manage_holidays",
    ],

    // ── Manager ───────────────────────────────────────────────
    manager: [
        "approve_leave",       // Team leaves only (enforced in controller)
        "view_reports",        // Team-scoped reports
        "manage_performance",  // Team performance
        "manage_tasks",        // Assign tasks to team
    ],

    // ── Finance Admin ─────────────────────────────────────────
    finance_admin: [
        "manage_payroll",
        "manage_expenditure",
        "manage_wages",
        "view_reports",
    ],

    // ── Employee ──────────────────────────────────────────────
    employee: [
        "view_own_attendance",
        "request_leave",
        "view_own_payroll",
        "view_own_performance",
    ],
};


/**
 * Check whether a given role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};

module.exports = { ADMIN_ROLES, ROLE_PERMISSIONS, hasPermission };
