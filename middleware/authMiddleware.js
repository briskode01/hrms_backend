// @ts-nocheck
// server/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");


const protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1]; // get the token part
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

        next(); // move to the next middleware or route handler
    } catch (error) {
        // Handle specific JWT errors
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

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user was set by the protect middleware above
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not allowed to perform this action. Required: ${roles.join(", ")}`,
            });
        }
        next();
    };
};

const authorizeRolesOrHR = (...roles) => {
    return async (req, res, next) => {
        if (roles.includes(req.user.role)) {
            return next();
        }
        
        if (req.user.role === "employee") {
            try {
                // To avoid circular dependency or import issues, require it locally or globally.
                const Employee = require("../models/Employee");
                const emp = await Employee.findById(req.user.employee);
                if (emp && emp.department === "HR") {
                    return next();
                }
            } catch (err) {
                console.error("HR Authorization error:", err);
            }
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Admins or HR employees only.`,
        });
    };
};

module.exports = { protect, authorizeRoles, authorizeRolesOrHR };