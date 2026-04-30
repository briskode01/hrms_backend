// @ts-nocheck
const express = require("express");
const router = express.Router();
const {
    getAttendance, getTodaySummary, markAttendance,
    markBulkAttendance, updateAttendance, deleteAttendance,
    getEmployeeMonthlyReport,
} = require("../controllers/admin/attendanceController");
const { checkIn, checkOut } = require("../controllers/employee/attendanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Admin attendance management — super_admin, hr_admin
const attendanceAdmins = ["super_admin", "admin", "hr_admin"];

router.get(
    "/today/summary",
    protect,
    authorizeRoles(...attendanceAdmins),
    getTodaySummary
);

// Monthly report — all roles (employees see own; admins see any)
router.get(
    "/report/:employeeId",
    protect,
    authorizeRoles(...attendanceAdmins, "finance_admin", "employee"),
    getEmployeeMonthlyReport
);

// Employee self-service
router.post("/check-in",  protect, authorizeRoles("employee"), checkIn);
router.post("/check-out", protect, authorizeRoles("employee"), checkOut);

// Bulk mark — super_admin, hr_admin
router.post("/bulk", protect, authorizeRoles(...attendanceAdmins), markBulkAttendance);

router
    .route("/")
    .get(protect,  authorizeRoles(...attendanceAdmins), getAttendance)
    .post(protect, authorizeRoles(...attendanceAdmins), markAttendance);

router
    .route("/:id")
    .put(protect,    authorizeRoles(...attendanceAdmins), updateAttendance)
    .delete(protect, authorizeRoles("super_admin", "admin"), deleteAttendance);

module.exports = router;
