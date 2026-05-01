// @ts-nocheck

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const reportStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads/reports");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const year = req.body.year || req.query.year || new Date().getFullYear();
        const month = String(req.body.month || req.query.month || new Date().getMonth() + 1).padStart(2, "0");
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `pnl-${year}-${month}-${uniqueSuffix}.pdf`);
    },
});

const reportFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

const uploadPnlReport = multer({
    storage: reportStorage,
    fileFilter: reportFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single("report");

module.exports = { uploadPnlReport };