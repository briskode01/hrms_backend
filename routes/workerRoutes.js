// @ts-nocheck
// routes/workerRoutes.js
const express = require("express");
const router = express.Router();
const { createWorker, getWorkers, updateWorker, deleteWorker } = require("../controllers/admin/workerController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Workers (field staff) — managed by super_admin and finance_admin
const workerManagers = ["super_admin", "finance_admin"];

router.get("/",       protect, authorizeRoles(...workerManagers), getWorkers);
router.post("/",      protect, authorizeRoles(...workerManagers), createWorker);
router.put("/:id",    protect, authorizeRoles(...workerManagers), updateWorker);
router.delete("/:id", protect, authorizeRoles("super_admin"),     deleteWorker);

module.exports = router;
