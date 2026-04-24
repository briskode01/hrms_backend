// @ts-nocheck

const Leave = require("../models/Leave");
const User = require("../models/User");
const notificationService = require("./notificationService");
const {
  buildLeavesFilter,
  getCurrentYearRange,
  buildOverlapQuery,
  ALLOWED_UPDATE_STATUSES,
} = require("../utils/leaveHelpers");

const withStatus = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getLeaves = async (query) => {
  const filter = buildLeavesFilter(query || {});

  return Leave.find(filter)
    .populate("employee", "firstName lastName email designation")
    .populate("approvedBy", "name email")
    .sort({ createdAt: -1 });
};

const getLeaveStats = async (employeeId) => {
  const { startOfYear, endOfYear } = getCurrentYearRange();

  const [totalApproved, totalPending, totalRejected] = await Promise.all([
    Leave.countDocuments({
      employee: employeeId,
      status: "Approved",
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }),
    Leave.countDocuments({
      employee: employeeId,
      status: "Pending",
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }),
    Leave.countDocuments({
      employee: employeeId,
      status: "Rejected",
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }),
  ]);

  const approvedLeaves = await Leave.find({
    employee: employeeId,
    status: "Approved",
    startDate: { $gte: startOfYear, $lte: endOfYear },
  });

  const totalDaysUsed = approvedLeaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);

  return {
    totalApproved,
    totalPending,
    totalRejected,
    totalDaysUsed,
  };
};

const createLeave = async ({ employee, leaveType, startDate, endDate, numberOfDays, reason }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw withStatus("Start date must be before end date", 400);
  }

  const overlapping = await Leave.findOne(buildOverlapQuery(employee, start, end));
  if (overlapping) {
    throw withStatus("You already have a leave request for overlapping dates", 400);
  }

  const newLeave = new Leave({
    employee,
    leaveType,
    startDate: start,
    endDate: end,
    numberOfDays,
    reason,
    status: "Pending",
  });

  await newLeave.save();
  await newLeave.populate("employee", "firstName lastName email designation");

  const employeeName = `${newLeave.employee?.firstName || ""} ${newLeave.employee?.lastName || ""}`.trim();
  await notificationService.createNotification({
    recipientRole: "admin",
    title: "New leave request",
    message: `${employeeName || "An employee"} requested ${leaveType} from ${start.toDateString()} to ${end.toDateString()}.`,
    type: "leave_request",
    link: "/leaves",
  });

  return newLeave;
};

const getRecentLeaves = async (employeeId) => {
  return Leave.find({ employee: employeeId })
    .sort({ createdAt: -1 })
    .limit(5);
};

const updateLeave = async (leaveId, { status, managerNotes }, approvedBy) => {
  if (!ALLOWED_UPDATE_STATUSES.includes(status)) {
    throw withStatus("Invalid status", 400);
  }

  const leave = await Leave.findByIdAndUpdate(
    leaveId,
    {
      status,
      managerNotes: managerNotes || "",
      approvedBy: approvedBy || null,
      updatedAt: new Date(),
    },
    { new: true }
  ).populate("employee", "firstName lastName email designation");

  if (!leave) {
    throw withStatus("Leave request not found", 404);
  }

  if (["Approved", "Rejected"].includes(status)) {
    const employeeUser = await User.findOne({ employee: leave.employee?._id });
    if (employeeUser) {
      const employeeName = `${leave.employee?.firstName || ""} ${leave.employee?.lastName || ""}`.trim();
      await notificationService.createNotification({
        recipientUser: employeeUser._id,
        title: `Leave ${status.toLowerCase()}`,
        message: `${employeeName || "Your"} leave request for ${leave.leaveType} was ${status.toLowerCase()}.`,
        type: "leave_status",
        link: "/leaves",
      });
    }
  }

  return leave;
};

const deleteLeave = async (leaveId) => {
  const leave = await Leave.findByIdAndDelete(leaveId);

  if (!leave) {
    throw withStatus("Leave request not found", 404);
  }

  return true;
};

module.exports = {
  getLeaves,
  getLeaveStats,
  createLeave,
  getRecentLeaves,
  updateLeave,
  deleteLeave,
};
