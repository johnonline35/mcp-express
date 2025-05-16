"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = exports.ProgressContext = void 0;
const crypto_1 = require("crypto");
/**
 * Simple progress context for tracking operation progress
 */
class ProgressContext {
    constructor(sessionId, sessionManager) {
        this.sessionId = sessionId;
        this.sessionManager = sessionManager;
    }
    /**
     * Update progress for the session
     */
    update(stage, percent, message) {
        this.sessionManager.sendProgress(this.sessionId, stage, percent, message);
    }
    /**
     * Mark operation as complete (success or failure)
     */
    complete(success, error) {
        this.sessionManager.sendComplete(this.sessionId, success, error);
    }
    /**
     * Get the session ID
     */
    getSessionId() {
        return this.sessionId;
    }
}
exports.ProgressContext = ProgressContext;
/**
 * Manages MCP sessions and handles requests
 */
class SessionManager {
    constructor(serverService) {
        this.serverService = serverService;
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour
        this.sessions = new Map();
    }
    /**
     * Get or create a session
     */
    getOrCreateSession(id, res, options) {
        let session = this.sessions.get(id);
        if (!session) {
            session = {
                id,
                res,
                createdAt: new Date(),
                userId: options?.userId,
                username: options?.username,
                userRole: options?.userRole,
            };
            this.sessions.set(id, session);
            console.log(`Created session ${id}${options?.username ? ` for user ${options.username}` : ""}`);
        }
        else if (res) {
            // Update response object if provided
            session.res = res;
            // Update user info if provided
            if (options?.userId)
                session.userId = options.userId;
            if (options?.username)
                session.username = options.username;
            if (options?.userRole)
                session.userRole = options.userRole;
        }
        return session;
    }
    /**
     * Get a session by ID
     */
    getSession(id) {
        return this.sessions.get(id);
    }
    /**
     * Delete a session
     */
    deleteSession(id) {
        this.sessions.delete(id);
        console.log(`Deleted session ${id}`);
    }
    /**
     * Create a progress context for a session
     */
    createProgressContext(sessionId) {
        return new ProgressContext(sessionId, this);
    }
    /**
     * Send progress update to a session
     */
    sendProgress(id, stage, percent, message) {
        const session = this.sessions.get(id);
        if (!session?.res) {
            console.warn(`Cannot send progress update - session ${id} not found or no response object`);
            return false;
        }
        const update = {
            stage,
            percent,
            message,
            timestamp: new Date().toISOString(),
        };
        session.lastUpdate = update;
        try {
            console.log(`[${id}] Progress update: ${stage} (${percent}%) - ${message}`);
            session.res.write(`data: ${JSON.stringify(update)}\n\n`);
            return true;
        }
        catch (error) {
            console.error(`Error sending progress to session ${id}:`, error);
            return false;
        }
    }
    /**
     * Send completion event and close the connection
     */
    sendComplete(id, success, error) {
        const session = this.sessions.get(id);
        if (!session?.res) {
            console.warn(`Cannot send completion - session ${id} not found or no response object`);
            return false;
        }
        try {
            const completeEvent = {
                type: "complete",
                success,
                error,
                timestamp: new Date().toISOString(),
            };
            console.log(`[${id}] Completion event: ${success ? "Success" : "Failed"} ${error ? "- " + error : ""}`);
            session.res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
            session.res.end();
            this.deleteSession(id);
            return true;
        }
        catch (error) {
            console.error(`Error sending completion to session ${id}:`, error);
            return false;
        }
    }
    /**
     * Handle all MCP HTTP requests (unified handler)
     */
    async handleRequest(req, res, method, options) {
        try {
            // Get or generate session ID
            const sessionId = req.headers["mcp-session-id"] ||
                (method === "POST" ? (0, crypto_1.randomUUID)() : undefined);
            // Validate session ID for non-POST requests
            if (!sessionId) {
                this.sendError(res, 400, "Missing session ID");
                return;
            }
            // Get or create server
            const { transport } = await this.serverService.getOrCreateServer(sessionId);
            // Set up SSE for GET requests
            if (method === "GET") {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                // Store response object for progress updates
                this.getOrCreateSession(sessionId, res, options);
            }
            // Handle the request via transport
            await transport.handleRequest(req, res, method === "POST" ? req.body : undefined);
            // Clean up session for DELETE requests
            if (method === "DELETE") {
                this.serverService.closeServer(sessionId);
            }
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    /**
     * Handle errors in request processing
     */
    handleError(res, error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
            this.sendError(res, 500, error instanceof Error ? error.message : "Internal server error");
        }
    }
    /**
     * Send standard JSON-RPC error response
     */
    sendError(res, status, message) {
        res.status(status).json({
            jsonrpc: "2.0",
            error: {
                code: status === 400 ? -32000 : -32603,
                message,
            },
            id: null,
        });
    }
}
exports.SessionManager = SessionManager;
