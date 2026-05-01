// @ts-nocheck
// routes/expenditureRoutes.js
const express = require("express");
const router  = express.Router();
const {
    getExpenses, createExpense, updateExpense, deleteExpense,
    getIncome,   createIncome,  updateIncome,  deleteIncome,
    getAdvances, createAdvance, updateAdvance, deleteAdvance, clearAdvance,
    getExpenditureStats, getExpenditureReport, uploadPnlReport,
} = require("../controllers/admin/expenditureController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadPnlReport: uploadPnlReportMiddleware } = require("../middleware/reportUploadMiddleware");

// Roles that can manage expenditure
const financeRoles = [protect, authorizeRoles("super_admin", "admin", "finance_admin")];

// ─── Overview / Stats ─────────────────────────────────────────
router.get("/stats",  ...financeRoles, getExpenditureStats);
router.get("/report", ...financeRoles, getExpenditureReport);
router.post("/reports/pnl-upload", ...financeRoles, uploadPnlReportMiddleware, uploadPnlReport);

// ─── Expenses ─────────────────────────────────────────────────
router.route("/expenses")
    .get( ...financeRoles, getExpenses)
    .post(...financeRoles, createExpense);

router.route("/expenses/:id")
    .put(   ...financeRoles, updateExpense)
    .delete(...financeRoles, deleteExpense);

// ─── Income ───────────────────────────────────────────────────
router.route("/income")
    .get( ...financeRoles, getIncome)
    .post(...financeRoles, createIncome);

router.route("/income/:id")
    .put(   ...financeRoles, updateIncome)
    .delete(...financeRoles, deleteIncome);

// ─── Advances ─────────────────────────────────────────────────
router.route("/advances")
    .get( ...financeRoles, getAdvances)
    .post(...financeRoles, createAdvance);

router.route("/advances/:id")
    .put(   ...financeRoles, updateAdvance)
    .delete(...financeRoles, deleteAdvance);

router.patch("/advances/:id/clear", ...financeRoles, clearAdvance);

module.exports = router;
