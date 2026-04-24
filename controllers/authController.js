// @ts-nocheck

const {
    registerUser,
    loginUser,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    changeCurrentUserPassword,
    getUsers,
    toggleStatus,
} = require("../services/auth/authService");
const { sendTokenResponse } = require("../utils/authToken");

const resolveStatusCode = (error, fallback = 500) => error?.statusCode || fallback;


const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);
        return sendTokenResponse(user, 201, res, "Account created successfully! 🎉");
    } catch (error) {
        return res.status(resolveStatusCode(error, 400)).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const user = await loginUser(req.body);
        return sendTokenResponse(user, 200, res, `Welcome back, ${user.name}! 👋`);
    } catch (error) {
        return res.status(resolveStatusCode(error, 500)).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await getCurrentUserProfile(req.user._id);
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: error.message,
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await updateCurrentUserProfile(req.user._id, req.body);
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating profile",
            error: error.message,
        });
    }
};

const changePassword = async (req, res) => {
    try {
        await changeCurrentUserPassword(req.user._id, req.body.currentPassword, req.body.newPassword);
        return res.status(200).json({
            success: true,
            message: "Password changed successfully! Please log in again.",
        });
    } catch (error) {
        return res.status(resolveStatusCode(error, 400)).json({
            success: false,
            message: "Error changing password",
            error: error.message,
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await getUsers();
        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const user = await toggleStatus(req.params.id);
        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            data: user,
        });
    } catch (error) {
        return res.status(resolveStatusCode(error, 500)).json({
            success: false,
            message: "Error toggling user status",
            error: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    getAllUsers,
    toggleUserStatus,
};