/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateRequired = (value, fieldName = "This field") => {
  const isValid =
    value !== null &&
    value !== undefined &&
    String(value).trim().length > 0;

  return {
    valid: isValid,
    message: isValid ? "" : `${fieldName} is required`,
  };
};

/**
 * Validate phone number (Kenyan format)
 * @param {string} phone - Phone number to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: "Phone number is required" };
  }

  const cleaned = phone.replace(/\D/g, "");

  // Accept 07XX XXX XXX or +254 XXX XXX XXX
  const isValid =
    (cleaned.length === 10 && cleaned.startsWith("0")) ||
    (cleaned.length === 12 && cleaned.startsWith("254"));

  return {
    valid: isValid,
    message: isValid ? "" : "Invalid phone number format",
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, message: string, strength: string}} Validation result
 */
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return {
      valid: false,
      message: "Password is required",
      strength: "none",
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters",
      strength: "weak",
    };
  }

  // Check for medium strength (letters and numbers)
  const hasMediumStrength = /[a-z]/.test(password) && /\d/.test(password);

  // Check for strong password (letters, numbers, special chars, uppercase)
  const hasStrongStrength =
    hasMediumStrength &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strength = "weak";
  if (hasStrongStrength) strength = "strong";
  else if (hasMediumStrength) strength = "medium";

  return {
    valid: true,
    message: "",
    strength,
  };
};

/**
 * Validate number
 * @param {any} value - Value to validate
 * @param {object} options - Validation options (min, max)
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateNumber = (value, options = {}) => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: "Must be a valid number" };
  }

  if (options.min !== undefined && num < options.min) {
    return {
      valid: false,
      message: `Must be at least ${options.min}`,
    };
  }

  if (options.max !== undefined && num > options.max) {
    return {
      valid: false,
      message: `Must be at most ${options.max}`,
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return { valid: true, message: "" };
  } catch (e) {
    return { valid: false, message: "Invalid URL format" };
  }
};

/**
 * Validate length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateLength = (value, min, max) => {
  const length = String(value || "").length;

  if (min && length < min) {
    return {
      valid: false,
      message: `Must be at least ${min} characters`,
    };
  }

  if (max && length > max) {
    return {
      valid: false,
      message: `Must be at most ${max} characters`,
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options (maxSize, allowedTypes)
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateFile = (file, options = {}) => {
  if (!file) {
    return { valid: false, message: "No file selected" };
  }

  // Check file size (in bytes)
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `File size must be less than ${maxSizeMB} MB`,
    };
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type must be one of: ${options.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true, message: "" };
};
