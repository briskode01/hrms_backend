// @ts-nocheck

const SHIFT_START = "10:00 AM";
const LATE_GRACE_MINUTES = 15;
const HALF_DAY_HOURS = 4;

const toMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();
  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatTime12 = (date) => {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // IST (UTC+5:30)
  });
};

const resolveCheckInStatus = (checkIn) => {
  const checkInMinutes = toMinutes(checkIn);
  const shiftStartMinutes = toMinutes(SHIFT_START);
  if (checkInMinutes === null || shiftStartMinutes === null) return "Present";
  return checkInMinutes > shiftStartMinutes + LATE_GRACE_MINUTES ? "Late" : "Present";
};

module.exports = {
  SHIFT_START,
  LATE_GRACE_MINUTES,
  HALF_DAY_HOURS,
  formatTime12,
  resolveCheckInStatus,
};
