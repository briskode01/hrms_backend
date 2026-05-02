// @ts-nocheck
// models/Organization.js
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
    {
        // ─── Basic Information ───────────────────────────────
        organizationName: {
            type: String,
            default: "",
        },
        registrationNumber: {
            type: String,
            default: "",
        },
        industry: {
            type: String,
            default: "",
        },

        // ─── Address ──────────────────────────────────────────
        address: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            default: "",
        },
        state: {
            type: String,
            default: "",
        },
        zipCode: {
            type: String,
            default: "",
        },
        country: {
            type: String,
            default: "India",
        },

        // ─── Contact Information ─────────────────────────────
        phone: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },

        // ─── Bank Details ────────────────────────────────────
        bankDetails: {
            bankName: {
                type: String,
                default: "",
            },
            accountNumber: {
                type: String,
                default: "",
            },
            ifscCode: {
                type: String,
                default: "",
            },
            panNumber: {
                type: String,
                default: "",
            },
        },

        // ─── EPF/ESIC Details ────────────────────────────────
        epfesicDetails: {
            pfNumber: {
                type: String,
                default: "",
            },
            pfUAN: {
                type: String,
                default: "",
            },
            esicNumber: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

const Organization = mongoose.model("Organization", organizationSchema);
module.exports = Organization;
