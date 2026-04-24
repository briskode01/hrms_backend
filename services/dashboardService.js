// @ts-nocheck

const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const Performance = require("../models/Performance");
const Tracking = require("../models/Tracking");
const User = require("../models/User");
const Leave = require("../models/Leave");
const {
  createAttendanceSummary,
  createGradeDistribution,
  createEmployeeAttendanceSummary,
  createEmployeeProfilePayload,
} = require("../utils/dashboardHelpers");

const withStatus = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [totalEmployees, activeEmployees, onLeaveEmployees, inactiveEmployees] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "Active" }),
    Employee.countDocuments({ status: "On Leave" }),
    Employee.countDocuments({ status: "Inactive" }),
  ]);

  const departmentStats = await Employee.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const attendanceToday = await Attendance.aggregate([
    { $match: { date: { $gte: today, $lt: tomorrow } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const attendanceSummary = createAttendanceSummary(attendanceToday);

  const payrollRecords = await Payroll.find({ month: currentMonth, year: currentYear });
  const totalPayroll = payrollRecords.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);
  const paidCount = payrollRecords.filter((payroll) => payroll.status === "Paid").length;
  const pendingCount = payrollRecords.filter((payroll) => payroll.status !== "Paid").length;

  const performanceRecords = await Performance.find({ year: currentYear });
  const avgScore = performanceRecords.length > 0
    ? Math.round(performanceRecords.reduce((sum, record) => sum + (record.overallScore || 0), 0) / performanceRecords.length)
    : 0;
  const gradeDistribution = createGradeDistribution(performanceRecords);

  const recentEmployees = await Employee.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("firstName lastName email department designation employeeId status createdAt");

  const [pendingRequests, approvedRequests, rejectedRequests, activeLeavesToday] = await Promise.all([
    Leave.countDocuments({ status: "Pending" }),
    Leave.countDocuments({ status: "Approved" }),
    Leave.countDocuments({ status: "Rejected" }),
    Leave.countDocuments({ status: "Approved", startDate: { $lte: today }, endDate: { $gte: today } }),
  ]);

  const recentLeaveRequests = await Leave.find()
    .populate("employee", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("employee leaveType startDate endDate numberOfDays status createdAt");

  // ─── Birthday Today ──────────────────────────────────────────
  const todayMonth = new Date().getMonth() + 1;
  const todayDate = new Date().getDate();

  const birthdayEmployees = await Employee.find({
    dateOfBirth: { $exists: true, $ne: null },
    status: "Active",
    $expr: {
      $and: [
        { $eq: [{ $month: "$dateOfBirth" }, todayMonth] },
        { $eq: [{ $dayOfMonth: "$dateOfBirth" }, todayDate] },
      ],
    },
  }).select("firstName lastName department designation avatar employeeId dateOfBirth");

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      onLeave: onLeaveEmployees,
      inactive: inactiveEmployees,
      departmentStats,
    },
    attendance: attendanceSummary,
    payroll: {
      totalExpense: totalPayroll,
      paid: paidCount,
      pending: pendingCount,
      totalRecords: payrollRecords.length,
    },
    performance: {
      avgScore,
      gradeDistribution,
      totalReviews: performanceRecords.length,
    },
    leaves: {
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      activeToday: activeLeavesToday,
    },
    recentLeaveRequests,
    recentEmployees,
    birthdayEmployees,
  };
};

const getEmployeeDashboardStats = async (userId) => {
  const user = await User.findById(userId).populate("employee");
  if (!user) {
    throw withStatus("User not found", 404);
  }

  if (!user.employee) {
    return {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        hasEmployeeRecord: false,
      },
      attendance: null,
      payroll: null,
      performance: null,
      tracking: null,
    };
  }

  const employee = user.employee;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [attendanceRecords, todayAttendance, latestPayroll, latestPerformance, latestTracking] = await Promise.all([
    Attendance.find({ employee: employee._id, date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: -1 }),
    Attendance.findOne({ employee: employee._id, date: { $gte: todayStart, $lt: todayEnd } }).sort({ date: -1 }),
    Payroll.findOne({ employee: employee._id }).sort({ year: -1, month: -1, createdAt: -1 }),
    Performance.findOne({ employee: employee._id }).sort({ year: -1, reviewDate: -1, createdAt: -1 }),
    employee.isFieldAgent
      ? Tracking.findOne({ agent: employee._id }).sort({ date: -1, createdAt: -1 })
      : Promise.resolve(null),
  ]);

  const { summary, attendanceRate } = createEmployeeAttendanceSummary(attendanceRecords);

  return {
    profile: createEmployeeProfilePayload(employee, user),
    attendance: {
      summary,
      attendanceRate,
      today: todayAttendance,
      recent: attendanceRecords.slice(0, 5),
    },
    payroll: latestPayroll,
    performance: latestPerformance,
    tracking: latestTracking,
  };
};

module.exports = {
  getDashboardStats,
  getEmployeeDashboardStats,
};
