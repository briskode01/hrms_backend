// @ts-nocheck

const Attendance = require("../../models/Attendance");
const User = require("../../models/User");
const Leave = require("../../models/Leave");
const { calculateHours, buildDateRangeForDay, calculateDistance } = require("../../utils/attendanceHelpers");
const { formatTime12, resolveCheckInStatus, HALF_DAY_HOURS } = require("../../utils/attendanceTime");

const getUserEmployee = async (userId) => {
  const user = await User.findById(userId).populate("employee");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!user.employee) {
    const err = new Error("Employee profile not found");
    err.statusCode = 404;
    throw err;
  }
  return user.employee;
};

const OFFICE_LAT = 20.324516918102926;
const OFFICE_LNG = 85.81699229181855;
const MAX_DISTANCE_METERS = 50;

const employeeCheckIn = async (userId, locationPayload) => {
  const employee = await getUserEmployee(userId);
  const todayDateObj = new Date();
  
  if (todayDateObj.getDay() === 0 || todayDateObj.getDay() === 6) {
    const err = new Error("Check-in is disabled on weekends (Mon-Fri only)");
    err.statusCode = 400;
    throw err;
  }

  if (!locationPayload || !locationPayload.lat || !locationPayload.lng) {
    const err = new Error("Location access is required to check in. Please enable GPS permissions.");
    err.statusCode = 400;
    throw err;
  }

  const { lat, lng } = locationPayload;
  const distance = calculateDistance(OFFICE_LAT, OFFICE_LNG, lat, lng);
  if (distance > MAX_DISTANCE_METERS) {
    const err = new Error(`You are too far from the office (${Math.round(distance)}m). Required: 50m. Your device reported: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    err.statusCode = 400;
    throw err;
  }

  const todayStr = todayDateObj.toISOString().split("T")[0];
  const todayRange = buildDateRangeForDay(todayStr);

  const startOfToday = new Date(todayStr);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(todayStr);
  endOfToday.setHours(23, 59, 59, 999);

  const approvedLeave = await Leave.findOne({
    employee: employee._id,
    status: "Approved",
    startDate: { $lte: endOfToday },
    endDate: { $gte: startOfToday }
  });

  if (approvedLeave) {
    const err = new Error("You have an approved leave for today and cannot check in");
    err.statusCode = 400;
    throw err;
  }

  let record = await Attendance.findOne({ employee: employee._id, date: todayRange });
  if (record?.status === "On Leave") {
    const err = new Error("You are marked on leave today");
    err.statusCode = 400;
    throw err;
  }
  if (record?.checkIn) {
    const err = new Error("Check-in already recorded");
    err.statusCode = 400;
    throw err;
  }

  const checkIn = formatTime12(new Date());
  const status = resolveCheckInStatus(checkIn);

  if (record) {
    record.checkIn = checkIn;
    record.status = status;
    record.location = { lat, lng };
    await record.save();
  } else {
    record = await Attendance.create({
      employee: employee._id,
      date: new Date(todayStr),
      status,
      checkIn,
      location: { lat, lng },
    });
  }

  await record.populate("employee", "firstName lastName employeeId department");
  return record;
};

const employeeCheckOut = async (userId) => {
  const employee = await getUserEmployee(userId);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRange = buildDateRangeForDay(todayStr);

  const record = await Attendance.findOne({ employee: employee._id, date: todayRange });
  if (!record) {
    const err = new Error("No check-in found for today");
    err.statusCode = 400;
    throw err;
  }
  if (record.status === "On Leave") {
    const err = new Error("You are marked on leave today");
    err.statusCode = 400;
    throw err;
  }
  if (!record.checkIn) {
    const err = new Error("Please check in first");
    err.statusCode = 400;
    throw err;
  }
  if (record.checkOut) {
    const err = new Error("Check-out already recorded");
    err.statusCode = 400;
    throw err;
  }

  const checkOut = formatTime12(new Date());
  const hoursWorked = calculateHours(record.checkIn, checkOut);

  record.checkOut = checkOut;
  record.hoursWorked = hoursWorked;

  if (["Present", "Late", "Half Day"].includes(record.status)) {
    record.status = hoursWorked > 0 && hoursWorked < HALF_DAY_HOURS ? "Half Day" : record.status;
  }

  await record.save();
  await record.populate("employee", "firstName lastName employeeId department");
  return record;
};

module.exports = {
  employeeCheckIn,
  employeeCheckOut,
};
