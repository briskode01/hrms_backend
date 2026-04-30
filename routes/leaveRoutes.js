// @ts-nocheck
const express = require("express");
const leaveController = require("../controllers/employee/leaveController");
const { protect, authorizeRoles, authorizeRolesOrHR } = require("../middleware/authMiddleware");
const {
    validateCreateLeaveInput,
    validateEmployeeIdQuery,
    validateUpdateLeaveStatusInput,
} = require("../middleware/leaveValidationMiddleware");

const router = express.Router();

// ─── GET Routes ───────────────────────────────────────────────
router.get("/", protect, leaveController.getLeaves);
router.get("/stats",  protect, validateEmployeeIdQuery, leaveController.getLeaveStats);
router.get("/recent", protect, validateEmployeeIdQuery, leaveController.getRecentLeaves);

// ─── POST Routes ──────────────────────────────────────────────
router.post("/", protect, validateCreateLeaveInput, leaveController.createLeave);

// ─── PUT Routes — Approve/Reject ──────────────────────────────
// super_admin, hr_admin, manager can approve/reject leaves
router.put(
    "/:leaveId",
    protect,
    authorizeRolesOrHR("super_admin", "admin", "hr_admin", "manager"),
    validateUpdateLeaveStatusInput,
    leaveController.updateLeave
);

// ─── DELETE Routes ────────────────────────────────────────────
router.delete("/:leaveId", protect, leaveController.deleteLeave);

module.exports = router;
