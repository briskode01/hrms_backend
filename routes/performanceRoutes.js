// @ts-nocheck
const express = require("express");
const router = express.Router();
const {
    getReviews, getReviewById, createReview,
    updateReview, deleteReview, getPerformanceStats,
} = require("../controllers/admin/performanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateCreateReviewInput } = require("../middleware/performanceValidationMiddleware");

// Roles that can manage performance reviews
const performanceManagers = ["super_admin", "hr_admin", "manager"];

router.get("/stats/summary", protect, authorizeRoles(...performanceManagers), getPerformanceStats);

router.route("/")
    .get(protect,  authorizeRoles(...performanceManagers, "employee"), getReviews)
    .post(protect, authorizeRoles(...performanceManagers), validateCreateReviewInput, createReview);

router.route("/:id")
    .get(protect,    authorizeRoles(...performanceManagers, "employee"), getReviewById)
    .put(protect,    authorizeRoles(...performanceManagers), updateReview)
    .delete(protect, authorizeRoles("super_admin"), deleteReview);

module.exports = router;