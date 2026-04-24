// @ts-nocheck

const payrollService = require("../../services/payroll/payrollService");

const resolveStatusCode = (error, fallback = 500) => error?.statusCode || fallback;

const getPayrolls = async (req, res) => {
  try {
    const { payrolls, count } = await payrollService.getPayrolls(req.query, req.user);

    return res.status(200).json({
      success: true,
      count,
      data: payrolls,
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 500)).json({
      success: false,
      message: "Error fetching payroll records",
      error: error.message,
    });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const payroll = await payrollService.getPayrollById(req.params.id);
    return res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    return res.status(resolveStatusCode(error, 500)).json({
      success: false,
      message: "Error fetching payroll record",
      error: error.message,
    });
  }
};

const generatePayroll = async (req, res) => {
  try {
    const { payroll, message, isUpdated } = await payrollService.generatePayroll(req.body);
    return res.status(isUpdated ? 200 : 201).json({
      success: true,
      message,
      data: payroll,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this employee and month",
      });
    }

    return res.status(resolveStatusCode(error, 400)).json({
      success: false,
      message: "Error generating payroll",
      error: error.message,
    });
  }
};

const runPayrollForAll = async (req, res) => {
  try {
    const { message, results } = await payrollService.runPayrollForAll(req.body);
    return res.status(201).json({
      success: true,
      message,
      data: results,
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 500)).json({
      success: false,
      message: "Error running bulk payroll",
      error: error.message,
    });
  }
};

const updatePayroll = async (req, res) => {
  try {
    const payroll = await payrollService.updatePayroll(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 400)).json({
      success: false,
      message: "Error updating payroll",
      error: error.message,
    });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const payroll = await payrollService.markAsPaid(req.params.id, req.body.paymentMethod);
    return res.status(200).json({
      success: true,
      message: `Payroll marked as paid for ${payroll.employee.firstName} ${payroll.employee.lastName}`,
      data: payroll,
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 400)).json({
      success: false,
      message: "Error marking payroll as paid",
      error: error.message,
    });
  }
};

const deletePayroll = async (req, res) => {
  try {
    await payrollService.deletePayroll(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
      data: {},
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 500)).json({
      success: false,
      message: "Error deleting payroll record",
      error: error.message,
    });
  }
};

const getPayrollStats = async (req, res) => {
  try {
    const stats = await payrollService.getPayrollStats(req.query);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(resolveStatusCode(error, 500)).json({
      success: false,
      message: "Error fetching payroll stats",
      error: error.message,
    });
  }
};

module.exports = {
  getPayrolls,
  getPayrollById,
  generatePayroll,
  runPayrollForAll,
  updatePayroll,
  markAsPaid,
  deletePayroll,
  getPayrollStats,
};
