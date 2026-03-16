import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { logger } from "./config/logger.js";

let server;

const startServer = async () => {
  await connectDatabase();

  server = app.listen(env.port, () => {
    logger.info(`API server listening on port ${env.port}`);
  });
};

const shutdown = async (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully.`);

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  logger.error("Failed to start server", { error: error.message });
  process.exit(1);
});
