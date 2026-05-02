// @ts-nocheck
// routes/settingsRoutes.js
const express = require("express");
const { protect, authorizePermission } = require("../middleware/authMiddleware");
const {
    getOrganization,
    setOrganization,
    getBankDetails,
    setBankDetails,
    getEPFESICDetails,
    setEPFESICDetails,
} = require("../controllers/settingsController");

const router = express.Router();

// ─── Protected Routes (require authentication) ─────────────
router.use(protect);

// ─── Organization Settings ────────────────────────────────
router.get("/organization", getOrganization);
router.post("/organization", authorizePermission("manage_organization"), setOrganization);

// ─── Bank Details ─────────────────────────────────────────
router.get("/bank", getBankDetails);
router.post("/bank", authorizePermission("manage_organization"), setBankDetails);

// ─── EPF/ESIC Details ─────────────────────────────────────
router.get("/epf-esic", getEPFESICDetails);
router.post("/epf-esic", authorizePermission("manage_organization"), setEPFESICDetails);

module.exports = router;
