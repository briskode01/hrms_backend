// @ts-nocheck

const Tracking = require("../../models/Tracking");
const Employee = require("../../models/Employee");

const logLocation = async (req, res) => {
    try {
        const {
            agentId,      // Employee._id of the field agent
            latitude,
            longitude,
            accuracy,     // GPS accuracy in metres (optional)
            clientName,   // name of client being visited (optional)
            notes,        // visit notes (optional)
            visitStatus,  // "Travelling" | "At Client" | "Break" etc.
            address,      // human readable address (optional, from tracking software)
        } = req.body;

        if (!agentId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "agentId, latitude and longitude are required",
            });
        }

        // Step 2: Check that agent exists and IS a field agent
        const agent = await Employee.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent (employee) not found",
            });
        }
        if (!agent.isFieldAgent) {
            return res.status(400).json({
                success: false,
                message: `${agent.firstName} ${agent.lastName} is not marked as a Field Agent`,
            });
        }
        await Tracking.updateMany(
            { agent: agentId, isLatest: true },
            { $set: { isLatest: false } }
        );

        const ping = await Tracking.create({
            agent: agentId,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: accuracy || 0,
            clientName: clientName || "",
            notes: notes || "",
            visitStatus: visitStatus || "Travelling",
            address: address || "",
            date: new Date(),
            isLatest: true, // this is now the latest ping
        });

        await ping.populate("agent", "firstName lastName employeeId department designation");

        res.status(201).json({
            success: true,
            message: "Location logged successfully",
            data: ping,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error logging location",
            error: error.message,
        });
    }
};

const getLiveAgents = async (req, res) => {
    try {
        const fieldAgents = await Employee.find({
            isFieldAgent: true,
            status: "Active",
        }).select("_id firstName lastName employeeId department designation");

        if (fieldAgents.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: "No field agents found. Mark employees as Field Agent first.",
            });
        }
        const agentIds = fieldAgents.map((a) => a._id);
        const latestPings = await Tracking.find({
            agent: { $in: agentIds },
            isLatest: true,
        }).populate("agent", "firstName lastName employeeId department designation");
        const agentMap = {};
        latestPings.forEach((ping) => {
            agentMap[ping.agent._id.toString()] = ping;
        });

        const result = fieldAgents.map((agent) => {
            const ping = agentMap[agent._id.toString()];
            return {
                agent: {
                    _id: agent._id,
                    firstName: agent.firstName,
                    lastName: agent.lastName,
                    employeeId: agent.employeeId,
                    department: agent.department,
                    designation: agent.designation,
                },
                hasLocation: !!ping,
                latitude: ping?.latitude || null,
                longitude: ping?.longitude || null,
                accuracy: ping?.accuracy || null,
                clientName: ping?.clientName || "",
                notes: ping?.notes || "",
                visitStatus: ping?.visitStatus || "Unknown",
                address: ping?.address || "",
                lastSeen: ping?.createdAt || null,
            };
        });

        res.status(200).json({
            success: true,
            count: result.length,
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching live agent locations",
            error: error.message,
        });
    }
};

const getAgentHistory = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { date } = req.query; // e.g. ?date=2026-03-11

        // Default to today if no date provided
        const targetDate = date ? new Date(date) : new Date();
        const start = new Date(targetDate.setHours(0, 0, 0, 0));
        const end = new Date(targetDate.setHours(23, 59, 59, 999));

        // Check agent exists
        const agent = await Employee.findById(agentId).select("firstName lastName employeeId isFieldAgent");
        if (!agent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }

        // Get all pings for this agent on this day, oldest first
        const history = await Tracking.find({
            agent: agentId,
            date: { $gte: start, $lte: end },
        }).sort({ createdAt: 1 }); // chronological order

        // Build a summary of the day
        const summary = {
            totalPings: history.length,
            clientsVisited: [...new Set(history.filter((h) => h.clientName).map((h) => h.clientName))],
            timeOnField: history.length > 1
                ? Math.round((new Date(history[history.length - 1].createdAt) - new Date(history[0].createdAt)) / 60000)
                : 0, // minutes
            firstPing: history[0]?.createdAt || null,
            lastPing: history[history.length - 1]?.createdAt || null,
        };

        res.status(200).json({
            success: true,
            agent: {
                name: `${agent.firstName} ${agent.lastName}`,
                employeeId: agent.employeeId,
            },
            summary,
            data: history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching agent history",
            error: error.message,
        });
    }
};

const getTrackingStats = async (req, res) => {
    try {
        // Today's date range
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);

        const [
            totalFieldAgents,
            activeToday,
            totalPingsToday,
            atClientNow,
        ] = await Promise.all([
            Employee.countDocuments({ isFieldAgent: true, status: "Active" }),
            Tracking.distinct("agent", { date: { $gte: start, $lte: end } }),
            Tracking.countDocuments({ date: { $gte: start, $lte: end } }),
            Tracking.countDocuments({ isLatest: true, visitStatus: "At Client" }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalFieldAgents,
                activeToday: activeToday.length,
                inactiveToday: totalFieldAgents - activeToday.length,
                totalPingsToday,
                atClientNow,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching tracking stats",
            error: error.message,
        });
    }
};

const toggleFieldAgent = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        employee.isFieldAgent = !employee.isFieldAgent;
        await employee.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `${employee.firstName} ${employee.lastName} is now ${employee.isFieldAgent ? "✅ a Field Agent" : "❌ no longer a Field Agent"}`,
            data: employee,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error toggling field agent status",
            error: error.message,
        });
    }
};

const deleteTracking = async (req, res) => {
    try {
        const record = await Tracking.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }
        res.status(200).json({ success: true, message: "Tracking record deleted", data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting record", error: error.message });
    }
};

module.exports = {
    logLocation,
    getLiveAgents,
    getAgentHistory,
    getTrackingStats,
    toggleFieldAgent,
    deleteTracking,
};