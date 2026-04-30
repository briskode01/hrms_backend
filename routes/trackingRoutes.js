// @ts-nocheck
const express = require("express");
const router = express.Router();
const {
    logLocation,
    getLiveAgents,
    getAgentHistory,
    getTrackingStats,
    toggleFieldAgent,
    deleteTracking,
} = require("../controllers/admin/trackingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Tracking — super_admin only (sensitive live location data)
const trackingAdmins = ["super_admin"];

router.post("/log", protect, logLocation);

router.get("/live",                protect, authorizeRoles(...trackingAdmins), getLiveAgents);
router.get("/stats",               protect, authorizeRoles(...trackingAdmins), getTrackingStats);
router.get("/history/:agentId",    protect, authorizeRoles(...trackingAdmins), getAgentHistory);
router.put("/agents/:employeeId/toggle", protect, authorizeRoles(...trackingAdmins), toggleFieldAgent);
router.delete("/:id",              protect, authorizeRoles(...trackingAdmins), deleteTracking);

module.exports = router;