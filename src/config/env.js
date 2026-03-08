const dotenv = require("dotenv");

dotenv.config();

function readBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function readRequired(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required.`);
  }

  return String(value).trim();
}

const port = Number(process.env.PORT || 3000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error("PORT must be a valid positive number.");
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  databaseUrl: readRequired("DATABASE_URL"),
  pgSsl: readBoolean(process.env.PG_SSL, false)
};

module.exports = {
  env
};
