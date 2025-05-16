// src/app.ts
import express from "express";
import cors from "cors";
import { McpServerService } from "./core/mcp-server-service";
import { SessionManager } from "./core/session-manager";
import { setupMcpRoutes } from "./core/http-controller";
import { setupAuthRoutes } from "./routes/auth";
import { registerAllModules } from "./modules/index";
import { config } from "./shared/config";

/**
 * Bootstrap the application
 */
export async function bootstrap() {
  // Create Express app
  const app = express();

  // Configure middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(cors());

  // Create core services
  const serverService = new McpServerService("Test MCP Server", "1.0.0");
  const sessionManager = new SessionManager(serverService);

  // Register all modules
  registerAllModules(serverService, sessionManager);

  // Set up auth routes
  setupAuthRoutes(app);

  // Set up MCP routes
  setupMcpRoutes(app, sessionManager);

  // Start server
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
  });

  return { app, serverService, sessionManager };
}
