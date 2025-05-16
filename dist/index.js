"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const app_1 = require("./app");
const config_1 = require("./shared/config");
// Start the application
async function startServer() {
    try {
        const { app } = await (0, app_1.bootstrap)();
        // Start the server
        const PORT = config_1.config.port;
        app.listen(PORT, () => {
            console.log(`
=============================================
  MCP Express Demo Server
=============================================
  Server: ${config_1.config.serverName} v${config_1.config.serverVersion}
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
    }
    catch (error) {
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
