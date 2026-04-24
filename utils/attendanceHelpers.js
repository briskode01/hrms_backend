// @ts-nocheck
// server/utils/attendanceHelpers.js

const calculateHours = (checkIn, checkOut) => {
  try {
    const toMinutes = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const diff = toMinutes(checkOut) - toMinutes(checkIn);
    return diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 0;
  } catch {
    return 0;
  }
};

const buildDateRangeForDay = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const buildDateRangeForMonth = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);
  return { $gte: start, $lte: end };
};


const summariseRecords = (records) => ({
  totalDays:  records.length,
  present:    records.filter((r) => r.status === "Present").length,
  absent:     records.filter((r) => r.status === "Absent").length,
  late:       records.filter((r) => r.status === "Late").length,
  halfDay:    records.filter((r) => r.status === "Half Day").length,
  onLeave:    records.filter((r) => r.status === "On Leave").length,
  totalHours: parseFloat(
    records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1)
  ),
});

// Haversine formula to calculate the distance between two coordinate points in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const toRadians = (deg) => deg * (Math.PI / 180);

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // returns distance in meters
};

module.exports = { calculateDistance, calculateHours, buildDateRangeForDay, buildDateRangeForMonth, summariseRecords };