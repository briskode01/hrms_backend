// @ts-nocheck
// routes/wageRoutes.js
const express = require("express");
const router = express.Router();
const { createWage, getWages, markWageAsPaid, deleteWage } = require("../controllers/admin/wageController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Roles that can manage wages
const wageManagers = ["super_admin", "finance_admin"];

// GET  /api/wages            — fetch all wage records
router.get("/", protect, authorizeRoles(...wageManagers), getWages);

// POST /api/wages            — create a new wage record
router.post("/", protect, authorizeRoles(...wageManagers), createWage);

// PUT  /api/wages/:id/mark-paid — mark as paid
router.put("/:id/mark-paid", protect, authorizeRoles(...wageManagers), markWageAsPaid);

// DELETE /api/wages/:id     — delete (super_admin only)
router.delete("/:id", protect, authorizeRoles("super_admin"), deleteWage);

module.exports = router;
