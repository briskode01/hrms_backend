// @ts-nocheck
const express = require("express");
const router = express.Router();

const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats,
} = require("../controllers/admin/employeeController");

const { protect, authorizeRoles, authorizePermission } = require("../middleware/authMiddleware");
const { validateCreateEmployeeInput } = require("../middleware/employeeValidationMiddleware");
const { uploadEmployeeDocs } = require("../middleware/uploadMiddleware");

// Stats — super_admin, hr_admin, manager
router.get(
    "/stats/summary",
    protect,
    authorizeRoles("super_admin", "admin", "hr_admin", "manager"),
    getEmployeeStats
);

// List — all admin roles + employee (employee sees limited view, enforced in controller)
router
    .route("/")
    .get(
        protect,
        authorizeRoles("super_admin", "admin", "hr_admin", "manager", "finance_admin", "employee"),
        getAllEmployees
    )
    .post(
        protect,
        authorizeRoles("super_admin", "admin", "hr_admin"),
        uploadEmployeeDocs,
        validateCreateEmployeeInput,
        createEmployee
    );

// Single — same as list; update + delete limited to super_admin, hr_admin
router
    .route("/:id")
    .get(
        protect,
        authorizeRoles("super_admin", "admin", "hr_admin", "manager", "finance_admin", "employee"),
        getEmployeeById
    )
    .put(
        protect,
        authorizeRoles("super_admin", "admin", "hr_admin"),
        uploadEmployeeDocs,
        updateEmployee
    )
    .delete(
        protect,
        authorizeRoles("super_admin", "admin"),
        deleteEmployee
    );

module.exports = router;