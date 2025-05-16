// src/index.ts
import { bootstrap } from "./app";
import { config } from "./shared/config";

// Start the application
async function startServer() {
  try {
    const { app } = await bootstrap();

    // Start the server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`
=============================================
  MCP Express Demo Server
=============================================
  Server: ${config.serverName} v${config.serverVersion}
  Running on: http://localhost:${PORT}
  MCP Endpoint: http://localhost:${PORT}/mcp (authenticated)
  Auth Endpoint: http://localhost:${PORT}/auth/login
  Health Check: http://localhost:${PORT}/health
=============================================
  Demo Users:
  - Username: user1, Password: password1
  - Username: user2, Password: password2
=============================================
      `);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
