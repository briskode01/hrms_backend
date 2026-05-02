// @ts-nocheck
// controllers/settingsController.js
const Organization = require("../models/Organization");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ─── Organization Settings ─────────────────────────────────
exports.getOrganization = async (req, res) => {
    try {
        const org = await Organization.findOne({});
        if (!org) {
            return sendSuccess(res, {}, "No organization found", 200);
        }
        sendSuccess(res, org);
    } catch (err) {
        sendError(res, "Error fetching organization", 500, err.message);
    }
};

exports.setOrganization = async (req, res) => {
    try {
        const { organizationName, registrationNumber, industry, address, city, state, zipCode, country, phone, email, website } = req.body;

        if (!organizationName) {
            return sendError(res, "Organization name is required", 400);
        }

        let org = await Organization.findOne({});
        if (!org) {
            org = new Organization(req.body);
        } else {
            Object.assign(org, req.body);
        }

        await org.save();
        sendSuccess(res, org, "Organization updated successfully", 201);
    } catch (err) {
        sendError(res, "Error updating organization", 500, err.message);
    }
};

// ─── Bank Details ──────────────────────────────────────────
exports.getBankDetails = async (req, res) => {
    try {
        const org = await Organization.findOne({});
        if (!org || !org.bankDetails) {
            return sendSuccess(res, {}, "No bank details found", 200);
        }
        sendSuccess(res, org.bankDetails);
    } catch (err) {
        sendError(res, "Error fetching bank details", 500, err.message);
    }
};

exports.setBankDetails = async (req, res) => {
    try {
        const { bankName, accountNumber, ifscCode, panNumber } = req.body;

        if (!bankName || !accountNumber || !ifscCode) {
            return sendError(res, "Bank name, account number, and IFSC code are required", 400);
        }

        let org = await Organization.findOne({});
        if (!org) {
            org = new Organization({
                organizationName: "Organization",
                bankDetails: req.body,
            });
        } else {
            org.bankDetails = { ...org.bankDetails, ...req.body };
        }

        await org.save();
        sendSuccess(res, org.bankDetails, "Bank details updated successfully", 201);
    } catch (err) {
        sendError(res, "Error updating bank details", 500, err.message);
    }
};

// ─── EPF/ESIC Details ──────────────────────────────────────
exports.getEPFESICDetails = async (req, res) => {
    try {
        const org = await Organization.findOne({});
        if (!org || !org.epfesicDetails) {
            return sendSuccess(res, {}, "No EPF/ESIC details found", 200);
        }
        sendSuccess(res, org.epfesicDetails);
    } catch (err) {
        sendError(res, "Error fetching EPF/ESIC details", 500, err.message);
    }
};

exports.setEPFESICDetails = async (req, res) => {
    try {
        const { pfNumber, pfUAN, esicNumber } = req.body;

        let org = await Organization.findOne({});
        if (!org) {
            org = new Organization({
                organizationName: "Organization",
                epfesicDetails: req.body,
            });
        } else {
            org.epfesicDetails = { ...org.epfesicDetails, ...req.body };
        }

        await org.save();
        sendSuccess(res, org.epfesicDetails, "EPF/ESIC details updated successfully", 201);
    } catch (err) {
        sendError(res, "Error updating EPF/ESIC details", 500, err.message);
    }
};
