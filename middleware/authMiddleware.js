// @ts-nocheck
// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { hasPermission, ADMIN_ROLES } = require("./permissions");

// ─────────────────────────────────────────────────────────────
// protect — verify JWT and attach user to req
// ─────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided. Please log in.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Token is valid but user no longer exists",
            });
        }
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Your account has been deactivated. Contact admin.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please log in again.",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please log in again.",
            });
        }
        res.status(500).json({
            success: false,
            message: "Authentication error",
            error: error.message,
        });
    }
};

// ─────────────────────────────────────────────────────────────
// authorizeRoles — allow only specific role strings
// ─────────────────────────────────────────────────────────────
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not allowed. Required: ${roles.join(", ")}`,
            });
        }
        next();
    };
};

// ─────────────────────────────────────────────────────────────
// authorizePermission — allow any role that has the permission
// ─────────────────────────────────────────────────────────────
const authorizePermission = (permission) => {
    return (req, res, next) => {
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Your role '${req.user.role}' does not have the '${permission}' permission.`,
            });
        }
        next();
    };
};

// ─────────────────────────────────────────────────────────────
// authorizeRolesOrHR — allow specific roles OR HR dept employees
// Updated to include new hr_admin role and legacy aliases
// ─────────────────────────────────────────────────────────────
const authorizeRolesOrHR = (...roles) => {
    return async (req, res, next) => {
        const userRole = req.user.role;

        // Allow if role is explicitly listed
        if (roles.includes(userRole)) return next();

        // Allow if user is any admin-type role with approve_leave permission
        if (hasPermission(userRole, "approve_leave")) return next();

        // Allow if employee belongs to HR department (legacy behaviour)
        if (userRole === "employee") {
            try {
                const Employee = require("../models/Employee");
                const emp = await Employee.findById(req.user.employee);
                if (emp && emp.department === "HR") return next();
            } catch (err) {
                console.error("HR Authorization error:", err);
            }
        }

        return res.status(403).json({
            success: false,
            message: "Access denied. Insufficient permissions.",
        });
    };
};

// ─────────────────────────────────────────────────────────────
// isAnyAdmin — convenience: passes if user is any admin role
// ─────────────────────────────────────────────────────────────
const isAnyAdmin = (req, res, next) => {
    if (ADMIN_ROLES.includes(req.user.role)) return next();
    return res.status(403).json({
        success: false,
        message: "Access denied. Admin access required.",
    });
};

module.exports = { protect, authorizeRoles, authorizePermission, authorizeRolesOrHR, isAnyAdmin };