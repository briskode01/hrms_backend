
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

router.get("/stats/summary", protect, authorizeRoles("admin"), getPayrollStats);
router.post("/generate", protect, authorizeRoles("admin"), validateGeneratePayrollInput, generatePayroll);
router.post("/run-all", protect, authorizeRoles("admin"), validateRunPayrollInput, runPayrollForAll);
router.put("/:id/mark-paid", protect, authorizeRoles("admin"), markAsPaid);
router.get("/", protect, authorizeRoles("admin", "employee"), getPayrolls);
router.route("/:id")
    .get(protect, authorizeRoles("admin", "employee"), getPayrollById)
    .put(protect, authorizeRoles("admin"), updatePayroll)
    .delete(protect, authorizeRoles("admin"), deletePayroll);

module.exports = router;