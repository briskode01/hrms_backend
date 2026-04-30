// @ts-nocheck
const express = require("express");
const router = express.Router();

const {
    getPublicJobs,
    getPublicJobById,
    getAllJobs,
    createJob,
    updateJob,
    deleteJob,
    getRecruitmentStats,
} = require("../controllers/admin/jobController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateCreateJobInput } = require("../middleware/jobValidationMiddleware");

// Roles that can manage recruitment
const recruitmentManagers = ["super_admin", "hr_admin"];

// ─── PUBLIC routes (no token needed) ──────────────────────────
router.get("/public",     getPublicJobs);
router.get("/public/:id", getPublicJobById);

// ─── PRIVATE routes ───────────────────────────────────────────
router.get("/stats", protect, authorizeRoles(...recruitmentManagers), getRecruitmentStats);

router.route("/")
    .get(protect,  authorizeRoles(...recruitmentManagers), getAllJobs)
    .post(protect, authorizeRoles(...recruitmentManagers), validateCreateJobInput, createJob);

router.route("/:id")
    .put(protect,    authorizeRoles(...recruitmentManagers), updateJob)
    .delete(protect, authorizeRoles("super_admin"), deleteJob);

module.exports = router;