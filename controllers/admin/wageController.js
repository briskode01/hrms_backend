// server/controllers/admin/wageController.js
// @ts-nocheck

const WageRecord = require("../../models/WageRecord");

// ─── Create a new wage record ──────────────────────────────────
const createWage = async (req, res) => {
    try {
        const { workerId, month, year, workerType, rateAmount, workingDays, workingHours, totalPayable, dateFrom, dateTo } = req.body;

        if (!workerId || !month || !year || !workerType || !rateAmount || totalPayable === undefined) {
            return res.status(400).json({ success: false, message: "workerId, month, year, workerType, rateAmount and totalPayable are required" });
        }

        const wage = await WageRecord.create({
            worker: workerId,
            month,
            year,
            workerType,
            rateAmount,
            workingDays: workingDays ?? null,
            workingHours: workingHours ?? null,
            totalPayable,
            dateFrom: dateFrom || null,
            dateTo:   dateTo   || null,
        });

        const populated = await wage.populate("worker", "fullName phone bank");

        return res.status(201).json({
            success: true,
            message: "Wage record created successfully",
            data: populated,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create wage record",
        });
    }
};

// ─── Get all wage records (filterable by month/year/status) ───
const getWages = async (req, res) => {
    try {
        const { month, year, status } = req.query;
        const filter = {};

        if (month) filter.month = Number(month);
        if (year)  filter.year  = Number(year);
        if (status && status !== "All") filter.status = status;

        const wages = await WageRecord.find(filter)
            .populate("worker", "fullName phone bank")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: wages.length,
            data: wages,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch wage records",
            error: error.message,
        });
    }
};

// ─── Mark a wage record as paid ───────────────────────────────
const markWageAsPaid = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        const wage = await WageRecord.findByIdAndUpdate(
            req.params.id,
            {
                status: "Paid",
                paidAt: new Date(),
                paymentMethod: paymentMethod || "Bank Transfer",
            },
            { new: true }
        ).populate("worker", "fullName phone bank");

        if (!wage) {
            return res.status(404).json({ success: false, message: "Wage record not found" });
        }

        return res.status(200).json({
            success: true,
            message: `Wage marked as paid for ${wage.worker.fullName}`,
            data: wage,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to mark wage as paid",
            error: error.message,
        });
    }
};

// ─── Delete a wage record ─────────────────────────────────────
const deleteWage = async (req, res) => {
    try {
        const wage = await WageRecord.findByIdAndDelete(req.params.id);

        if (!wage) {
            return res.status(404).json({ success: false, message: "Wage record not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Wage record deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete wage record",
            error: error.message,
        });
    }
};

module.exports = { createWage, getWages, markWageAsPaid, deleteWage };
