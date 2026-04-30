// @ts-nocheck
const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    getAllUsers,
    toggleUserStatus,
    updateUserRole,
} = require("../controllers/authController");

const { protect, authorizeRoles, authorizePermission } = require("../middleware/authMiddleware");
const {
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
} = require("../middleware/authValidationMiddleware");

// ─── Public Routes ────────────────────────────────────────────
router.post("/register", validateRegisterInput, register);
router.post("/login", validateLoginInput, login);

// ─── Private Routes ───────────────────────────────────────────
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, validateChangePasswordInput, changePassword);

// ─── User Management (super_admin + legacy admin only) ────────
// GET all users
router.get(
    "/users",
    protect,
    authorizeRoles("super_admin", "admin"),
    getAllUsers
);

// Toggle user active status — super_admin & hr_admin
router.put(
    "/users/:id/toggle-status",
    protect,
    authorizeRoles("super_admin", "admin", "hr_admin"),
    toggleUserStatus
);

// Change a user's role — super_admin only
router.put(
    "/users/:id/role",
    protect,
    authorizeRoles("super_admin", "admin"),
    updateUserRole
);

module.exports = router;