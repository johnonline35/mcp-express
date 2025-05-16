"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mcp_server_service_1 = require("./core/mcp-server-service");
const session_manager_1 = require("./core/session-manager");
const http_controller_1 = require("./core/http-controller");
const auth_1 = require("./routes/auth");
const index_1 = require("./modules/index");
const config_1 = require("./shared/config");
/**
 * Bootstrap the application
 */
async function bootstrap() {
    // Create Express app
    const app = (0, express_1.default)();
    // Configure middleware
    app.use(express_1.default.json({ limit: "50mb" }));
    app.use((0, cors_1.default)());
    // Create core services
    const serverService = new mcp_server_service_1.McpServerService("Test MCP Server", "1.0.0");
    const sessionManager = new session_manager_1.SessionManager(serverService);
    // Register all modules
    (0, index_1.registerAllModules)(serverService, sessionManager);
    // Set up auth routes
    (0, auth_1.setupAuthRoutes)(app);
    // Set up MCP routes
    (0, http_controller_1.setupMcpRoutes)(app, sessionManager);
    // Start server
    const PORT = config_1.config.port || 3000;
    app.listen(PORT, () => {
        console.log(`Verdex MCP Server running on port ${PORT}`);
    });
    return { app, serverService, sessionManager };
}
