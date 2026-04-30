// @ts-nocheck
const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");
const {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleLike,
    addComment,
    deleteComment,
} = require("../controllers/announcementController");

// Roles that can create/manage announcements
const announcementManagers = ["super_admin", "hr_admin"];

// Read — all authenticated users
router.get("/", protect, getAnnouncements);
router.put("/:id/like", protect, toggleLike);

// Write — super_admin + hr_admin only
router.post("/",   protect, authorizeRoles(...announcementManagers), uploadImage, createAnnouncement);
router.put("/:id", protect, authorizeRoles(...announcementManagers), uploadImage, updateAnnouncement);
router.delete("/:id", protect, authorizeRoles(...announcementManagers), deleteAnnouncement);

// Comments — all authenticated users
router.post("/:id/comments", protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;
