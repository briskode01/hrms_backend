// @ts-nocheck

const Attendance = require("../../models/Attendance");
const Employee   = require("../../models/Employee");
const {
  calculateHours,
  buildDateRangeForDay,
  buildDateRangeForMonth,
  summariseRecords,
} = require("../../utils/attendanceHelpers");

const getAttendance = async ({ date, employeeId, month, year }) => {
  const filter = {};

  if (date)          filter.date     = buildDateRangeForDay(date);
  if (month && year) filter.date     = buildDateRangeForMonth(parseInt(month), parseInt(year));
  if (employeeId)    filter.employee = employeeId;

  return await Attendance.find(filter)
    .populate("employee", "firstName lastName employeeId department designation avatar")
    .sort({ date: -1 });
};


// Get today's attendance summary for the admin dashboard
const getTodaySummary = async () => {
  const todayRange = buildDateRangeForDay(new Date().toISOString().split("T")[0]);

  const dateFilter = { date: todayRange };

  const [present, absent, onLeave, halfDay, late, totalEmployees] = await Promise.all([
    Attendance.countDocuments({ ...dateFilter, status: "Present"  }),
    Attendance.countDocuments({ ...dateFilter, status: "Absent"   }),
    Attendance.countDocuments({ ...dateFilter, status: "On Leave" }),
    Attendance.countDocuments({ ...dateFilter, status: "Half Day" }),
    Attendance.countDocuments({ ...dateFilter, status: "Late"     }),
    Employee.countDocuments({ status: "Active" }),
  ]);

  return {
    present,
    absent,
    onLeave,
    halfDay,
    late,
    totalEmployees,
    attendanceRate: totalEmployees > 0
      ? ((present / totalEmployees) * 100).toFixed(1)
      : 0,
  };
};

// Mark attendance for a single employee
const markAttendance = async (body) => {
  const { employee, date, status, checkIn, checkOut, leaveType, remarks } = body;

  if (!employee || !date || !status) {
    const err = new Error("Employee, date and status are required");
    err.statusCode = 400;
    throw err;
  }

  const employeeExists = await Employee.findById(employee);
  if (!employeeExists) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  const record = await Attendance.create({
    employee,
    date:        new Date(date),
    status,
    checkIn:     checkIn    || "",
    checkOut:    checkOut   || "",
    hoursWorked: checkIn && checkOut ? calculateHours(checkIn, checkOut) : 0,
    leaveType:   leaveType  || "",
    remarks:     remarks    || "",
  });

  await record.populate("employee", "firstName lastName employeeId department");
  return record;
};

// Bulk mark attendance — skips employees already marked
const markBulkAttendance = async ({ date, records }) => {
  if (!date || !records?.length) {
    const err = new Error("Date and records array are required");
    err.statusCode = 400;
    throw err;
  }

  const dateRange = buildDateRangeForDay(date);

  // Find employees already marked for this date
  const existing = await Attendance.find({
    date:     dateRange,
    employee: { $in: records.map((r) => r.employee) },
  }).select("employee");

  const alreadyMarked = new Set(existing.map((r) => r.employee.toString()));

  // Only process employees not yet marked
  const newRecords = records
    .filter((r) => !alreadyMarked.has(r.employee.toString()))
    .map((r) => ({
      employee:    r.employee,
      date:        new Date(date),
      status:      r.status    || "Present",
      checkIn:     r.checkIn   || "",
      checkOut:    r.checkOut  || "",
      hoursWorked: r.checkIn && r.checkOut ? calculateHours(r.checkIn, r.checkOut) : 0,
      leaveType:   r.leaveType || "",
      remarks:     r.remarks   || "",
    }));

  if (newRecords.length === 0) {
    return {
      result: [],
      message: `All ${records.length} employees already have attendance marked for this date`,
    };
  }

  const result  = await Attendance.insertMany(newRecords);
  const skipped = records.length - newRecords.length;

  return {
    result,
    message: skipped > 0
      ? `${result.length} marked, ${skipped} already had attendance`
      : `All ${result.length} employees marked successfully!`,
  };
};


// Update an attendance record
const updateAttendance = async (id, body) => {
  const { status, checkIn, checkOut, leaveType, remarks } = body;

  const record = await Attendance.findByIdAndUpdate(
    id,
    {
      status,
      checkIn,
      checkOut,
      hoursWorked: checkIn && checkOut ? calculateHours(checkIn, checkOut) : 0,
      leaveType,
      remarks,
    },
    { new: true, runValidators: true }
  ).populate("employee", "firstName lastName employeeId department");

  if (!record) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }

  return record;
};

// Delete an attendance record
const deleteAttendance = async (id) => {
  const record = await Attendance.findByIdAndDelete(id);

  if (!record) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }
};

// Get monthly report for one employee
const getEmployeeMonthlyReport = async (employeeId, { month, year }) => {
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year)  || new Date().getFullYear();

  const records = await Attendance.find({
    employee: employeeId,
    date:     buildDateRangeForMonth(m, y),
  }).sort({ date: 1 });

  return {
    records,
    summary: summariseRecords(records),
  };
};

module.exports = {
  getAttendance,
  getTodaySummary,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeMonthlyReport,
};
