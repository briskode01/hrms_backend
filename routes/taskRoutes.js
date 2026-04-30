// @ts-nocheck
const express = require("express");
const { protect, authorizeRoles, authorizePermission } = require("../middleware/authMiddleware");
const {
    createTask,
    getTasks,
    addTaskUpdate,
} = require("../controllers/taskController");

const router = express.Router();

// Roles that can CREATE / ASSIGN tasks
const taskManagers = ["super_admin", "hr_admin", "manager"];

// GET all tasks — task managers + employee (employee sees own tasks in service layer)
router.get("/", protect, authorizeRoles(...taskManagers, "employee"), getTasks);

// POST create/assign task — only task managers
router.post("/", protect, authorizeRoles(...taskManagers), createTask);

// PATCH add progress update — employee only
router.patch("/:id/update", protect, authorizeRoles("employee"), addTaskUpdate);

module.exports = router;
