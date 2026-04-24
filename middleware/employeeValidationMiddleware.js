// @ts-nocheck

const validateCreateEmployeeInput = (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    department,
    designation,
    salary,
    joiningDate,
    createLogin,
    loginPassword,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !department || !designation || !salary || !joiningDate) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  if (createLogin && (!loginPassword || loginPassword.length < 6)) {
    return res.status(400).json({
      success: false,
      message: "Login password must be at least 6 characters",
    });
  }

  next();
};

module.exports = {
  validateCreateEmployeeInput,
};
