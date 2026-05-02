const express = require("express");
const router = express.Router();

const {
  create,
  getAll,
  getByDateRange,
  getById,
  update,
  remove,
  toggleApproval,
  getCalendar,
} = require("../controllers/holidayController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  validateCreateHoliday,
  validateUpdateHoliday,
  validateToggleApproval,
} = require("../middleware/holidayValidationMiddleware");

router.get("/", protect, getAll);

router.get("/calendar", protect, getCalendar);

router.get("/range", protect, getByDateRange);

router.get("/:id", protect, getById);

router.post(
  "/",
  protect,
  authorizeRoles("super_admin", "hr_admin"),
  validateCreateHoliday,
  create
);

router.put(
  "/:id",
  protect,
  authorizeRoles("super_admin", "admin", "hr_admin"),
  validateUpdateHoliday,
  update
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("super_admin", "admin", "hr_admin"),
  remove
);

router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("super_admin", "admin", "hr_admin"),
  validateToggleApproval,
  toggleApproval
);

module.exports = router;
