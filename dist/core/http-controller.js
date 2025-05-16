"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMcpRoutes = setupMcpRoutes;
const auth_1 = require("../middleware/auth");
/**
 * Sets up all MCP-related routes in the Express application
 */
function setupMcpRoutes(app, sessionManager) {
    // MCP endpoint - POST for client-to-server requests
    // Apply auth middleware to protect these endpoints
    app.post("/mcp", auth_1.authMiddleware, (req, res) => {
        // Pass along user info to the session
        const sessionOptions = {
            userId: req.user?.id,
            username: req.user?.username,
        };
        sessionManager.handleRequest(req, res, "POST", sessionOptions);
    });
    // MCP endpoint - GET for server-to-client notifications
    app.get("/mcp", auth_1.authMiddleware, (req, res) => {
        const sessionOptions = {
            userId: req.user?.id,
            username: req.user?.username,
        };
        sessionManager.handleRequest(req, res, "GET", sessionOptions);
    });
    // MCP endpoint - DELETE for session termination
    app.delete("/mcp", auth_1.authMiddleware, (req, res) => {
        sessionManager.handleRequest(req, res, "DELETE");
    });
    // Health check endpoint (no auth needed)
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
}
