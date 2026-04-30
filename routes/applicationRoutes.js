// @ts-nocheck
const express = require("express");
const router  = express.Router();

const {
    submitApplication,
    getApplications,
    getApplicationById,
    updateApplication,
    downloadResume,
    deleteApplication,
} = require("../controllers/admin/applicationController");

const { protect, authorizeRoles }  = require("../middleware/authMiddleware");
const { uploadSingleResume }       = require("../middleware/uploadMiddleware");

// Roles that can manage job applications
const recruitmentManagers = ["super_admin", "hr_admin"];

// ─── PUBLIC — candidates submit applications ───────────────────
router.post("/", uploadSingleResume, submitApplication);

// ─── PRIVATE — HR manages applications ────────────────────────
router.get("/",           protect, authorizeRoles(...recruitmentManagers), getApplications);
router.get("/:id/resume", protect, authorizeRoles(...recruitmentManagers), downloadResume);

router
    .route("/:id")
    .get(protect,    authorizeRoles(...recruitmentManagers), getApplicationById)
    .put(protect,    authorizeRoles(...recruitmentManagers), updateApplication)
    .delete(protect, authorizeRoles("super_admin"),         deleteApplication);

module.exports = router;