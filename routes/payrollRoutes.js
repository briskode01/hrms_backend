// @ts-nocheck
const express = require("express");
const router = express.Router();
const {
    getPayrolls, getPayrollById, generatePayroll,
    runPayrollForAll, updatePayroll, markAsPaid,
    deletePayroll, getPayrollStats,
} = require("../controllers/admin/payrollController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
    validateGeneratePayrollInput,
    validateRunPayrollInput,
} = require("../middleware/payrollValidationMiddleware");

// Roles that can manage payroll
const payrollManagers = ["super_admin", "admin", "finance_admin"];

router.get("/stats/summary", protect, authorizeRoles(...payrollManagers), getPayrollStats);
router.post("/generate",     protect, authorizeRoles(...payrollManagers), validateGeneratePayrollInput, generatePayroll);
router.post("/run-all",      protect, authorizeRoles(...payrollManagers), validateRunPayrollInput, runPayrollForAll);
router.put("/:id/mark-paid", protect, authorizeRoles(...payrollManagers), markAsPaid);

// View payroll — all roles (employees see own, enforced in controller)
router.get("/", protect, authorizeRoles(...payrollManagers, "hr_admin", "manager", "employee"), getPayrolls);

router
    .route("/:id")
    .get(protect,    authorizeRoles(...payrollManagers, "hr_admin", "manager", "employee"), getPayrollById)
    .put(protect,    authorizeRoles(...payrollManagers), updatePayroll)
    .delete(protect, authorizeRoles("super_admin", "admin"), deletePayroll);

module.exports = router;