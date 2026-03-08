const AppError = require("../../utils/AppError");

function normalizeEmail(email) {
  if (email === undefined || email === null) {
    return null;
  }

  if (typeof email !== "string") {
    throw AppError.badRequest("email must be a string or null.");
  }

  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function normalizePhoneNumber(phoneNumber) {
  if (phoneNumber === undefined || phoneNumber === null) {
    return null;
  }

  if (typeof phoneNumber !== "string" && typeof phoneNumber !== "number") {
    throw AppError.badRequest("phoneNumber must be a string, number, or null.");
  }

  const normalized = String(phoneNumber).trim();
  return normalized || null;
}

function normalizeIdentifyPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};

  const normalized = {
    email: normalizeEmail(safePayload.email),
    phoneNumber: normalizePhoneNumber(safePayload.phoneNumber)
  };

  if (!normalized.email && !normalized.phoneNumber) {
    throw AppError.badRequest("Either email or phoneNumber is required.");
  }

  return normalized;
}

module.exports = {
  normalizeIdentifyPayload
};
