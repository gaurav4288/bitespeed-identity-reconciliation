const dotenv = require("dotenv");

dotenv.config();

function readSslMode(value) {
  if (value === undefined || value === null || value === "") {
    return "auto";
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "auto") {
    return "auto";
  }

  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  throw new Error('PG_SSL must be one of: "true", "false", or "auto".');
}

function inferPgSslFromDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const sslMode = (parsed.searchParams.get("sslmode") || "").trim().toLowerCase();

    return (
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full"
    );
  } catch (_error) {
    return false;
  }
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

const databaseUrl = readRequired("DATABASE_URL");
const sslMode = readSslMode(process.env.PG_SSL);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  databaseUrl,
  pgSsl: sslMode === "auto" ? inferPgSslFromDatabaseUrl(databaseUrl) : sslMode
};

module.exports = {
  env
};
