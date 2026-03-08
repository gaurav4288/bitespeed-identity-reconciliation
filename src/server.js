const { createApp } = require("./app");
const { env } = require("./config/env");
const { pool } = require("./config/database");
const { initDatabase } = require("./db/schema");

function registerGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Closing HTTP server...`);

    server.close(async () => {
      try {
        await pool.end();
        console.log("PostgreSQL pool closed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

async function bootstrap() {
  await initDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });

  registerGracefulShutdown(server);
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap application:", error);
  process.exit(1);
});
