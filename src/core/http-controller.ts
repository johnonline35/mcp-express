// src/core/http-controller.ts
import { Application, Request, Response } from "express";
import { SessionManager } from "./session-manager";
import { authMiddleware } from "../middleware/auth";
import { JsonRpcErrorCode, createJsonRpcError } from "../shared/errors";

/**
 * Sets up all MCP-related routes in the Express application
 */
export function setupMcpRoutes(
  app: Application,
  sessionManager: SessionManager
): void {
  // MCP endpoint - POST for client-to-server requests
  // Apply auth middleware to protect these endpoints
  app.post("/mcp", authMiddleware, (req: Request, res: Response) => {
    // Pass along user info to the session
    const sessionOptions = {
      userId: req.user?.id,
      username: req.user?.username,
    };

    sessionManager.handleRequest(req, res, "POST", sessionOptions);
  });

  // MCP endpoint - GET for server-to-client notifications
  app.get("/mcp", authMiddleware, (req: Request, res: Response) => {
    const sessionOptions = {
      userId: req.user?.id,
      username: req.user?.username,
    };

    sessionManager.handleRequest(req, res, "GET", sessionOptions);
  });

  // MCP endpoint - DELETE for session termination
  app.delete("/mcp", authMiddleware, (req: Request, res: Response) => {
    sessionManager.handleRequest(req, res, "DELETE");
  });

  // Health check endpoint (no auth needed)
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Catch-all for invalid routes
  app.use((_req: Request, res: Response) => {
    if (!res.headersSent) {
      res
        .status(404)
        .json(
          createJsonRpcError(
            JsonRpcErrorCode.MethodNotFound,
            "Endpoint not found"
          )
        );
    }
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error("Unhandled error:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json(
          createJsonRpcError(
            JsonRpcErrorCode.InternalError,
            "Internal server error",
            { details: err.message }
          )
        );
    }
  });
}
