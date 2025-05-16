// src/core/session-manager.ts
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { McpServerService } from "./mcp-server-service";
import {
  JsonRpcErrorCode,
  createJsonRpcError,
  McpError,
} from "../shared/errors";

export interface SessionOptions {
  userId?: string;
  username?: string;
  userRole?: string;
}

export interface Session {
  id: string;
  res?: Response;
  createdAt: Date;
  userId?: string;
  username?: string;
  userRole?: string;
  lastUpdate?: {
    stage: string;
    percent: number;
    message: string;
    timestamp: string;
  };
}

/**
 * Simple progress context for tracking operation progress
 */
export class ProgressContext {
  constructor(
    private sessionId: string,
    private sessionManager: SessionManager
  ) {}

  /**
   * Update progress for the session
   */
  update(stage: string, percent: number, message: string): void {
    this.sessionManager.sendProgress(this.sessionId, stage, percent, message);
  }

  /**
   * Mark operation as complete (success or failure)
   */
  complete(success: boolean, error?: string): void {
    this.sessionManager.sendComplete(this.sessionId, success, error);
  }

  /**
   * Get the session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Manages MCP sessions and handles requests
 */
export class SessionManager {
  private readonly sessionTimeout = 60 * 60 * 1000; // 1 hour
  private sessions = new Map<string, Session>();

  // Track which sessions have already had dynamic tools enabled
  private sessionsWithDynamicTools = new Set<string>();

  // Document-related keywords that will trigger dynamic tools
  private readonly documentKeywords = [
    "document",
    "file",
    "text",
    "analyze",
    "parse",
    "extract",
    "content",
    "read",
    "summarize",
    "pdf",
    "doc",
    "docx",
    "txt",
  ];

  // Document-related dynamic tool IDs
  private readonly documentToolIds = [
    "summarizeDocument",
    "countWordsAndCharacters",
    "detectDocumentFormat",
  ];

  constructor(private serverService: McpServerService) {}

  /**
   * Get or create a session
   */
  getOrCreateSession(
    id: string,
    res?: Response,
    options?: SessionOptions
  ): Session {
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
      console.log(
        `Created session ${id}${
          options?.username ? ` for user ${options.username}` : ""
        }`
      );
    } else if (res) {
      // Update response object if provided
      session.res = res;

      // Update user info if provided
      if (options?.userId) session.userId = options.userId;
      if (options?.username) session.username = options.username;
      if (options?.userRole) session.userRole = options.userRole;
    }

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Delete a session
   */
  deleteSession(id: string): void {
    this.sessions.delete(id);
    this.sessionsWithDynamicTools.delete(id);
    console.log(`Deleted session ${id}`);
  }

  /**
   * Analyze a user message for keywords that might trigger dynamic tools
   */
  analyzeMessage(sessionId: string, message: string): void {
    // Skip analysis if dynamic tools already enabled for this session
    if (this.sessionsWithDynamicTools.has(sessionId)) {
      return;
    }

    // Convert to lowercase for case-insensitive matching
    const lowercaseMessage = message.toLowerCase();

    // Check for document-related keywords
    const hasDocumentKeywords = this.documentKeywords.some((keyword) =>
      lowercaseMessage.includes(keyword)
    );

    if (hasDocumentKeywords) {
      console.log(`Detected document-related keywords in session ${sessionId}`);

      // Enable document-related tools for this session
      const toolsEnabled = this.serverService.enableDynamicToolsForSession(
        sessionId,
        this.documentToolIds
      );

      if (toolsEnabled) {
        // Mark that we've enabled tools for this session
        this.sessionsWithDynamicTools.add(sessionId);

        // Notify the user that document tools are now available
        this.sendNotification(
          sessionId,
          "Document analysis tools have been activated based on your query."
        );
      }
    }
  }

  /**
   * Send a notification message to the client
   */
  sendNotification(id: string, message: string): boolean {
    const session = this.sessions.get(id);
    if (!session?.res) {
      console.warn(
        `Cannot send notification - session ${id} not found or no response object`
      );
      return false;
    }

    const notification = {
      type: "notification",
      message,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(`[${id}] Notification: ${message}`);
      session.res.write(`data: ${JSON.stringify(notification)}\n\n`);
      return true;
    } catch (error) {
      console.error(`Error sending notification to session ${id}:`, error);
      return false;
    }
  }

  /**
   * Create a progress context for a session
   */
  createProgressContext(sessionId: string): ProgressContext {
    return new ProgressContext(sessionId, this);
  }

  /**
   * Send progress update to a session
   */
  sendProgress(
    id: string,
    stage: string,
    percent: number,
    message: string
  ): boolean {
    const session = this.sessions.get(id);
    if (!session?.res) {
      console.warn(
        `Cannot send progress update - session ${id} not found or no response object`
      );
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
      console.log(
        `[${id}] Progress update: ${stage} (${percent}%) - ${message}`
      );
      session.res.write(`data: ${JSON.stringify(update)}\n\n`);
      return true;
    } catch (error) {
      console.error(`Error sending progress to session ${id}:`, error);
      return false;
    }
  }

  /**
   * Send completion event and close the connection
   */
  sendComplete(id: string, success: boolean, error?: string): boolean {
    const session = this.sessions.get(id);
    if (!session?.res) {
      console.warn(
        `Cannot send completion - session ${id} not found or no response object`
      );
      return false;
    }

    try {
      const completeEvent = {
        type: "complete",
        success,
        error,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `[${id}] Completion event: ${success ? "Success" : "Failed"} ${
          error ? "- " + error : ""
        }`
      );
      session.res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
      session.res.end();
      this.deleteSession(id);
      return true;
    } catch (error) {
      console.error(`Error sending completion to session ${id}:`, error);
      return false;
    }
  }

  /**
   * Extract text content from MCP request body
   */
  extractMessageContent(body: any): string {
    // Handle different possible message formats in MCP
    if (!body || typeof body !== "object") {
      return "";
    }

    // Check for JSON-RPC format with params
    if (body.method === "generate" && body.params?.messages) {
      const messages = body.params.messages;
      if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        // Handle different message content formats
        if (typeof lastMessage.content === "string") {
          return lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          // Handle content parts array (multimodal content)
          return lastMessage.content
            .filter(
              (part: any) =>
                part.type === "text" && typeof part.text === "string"
            )
            .map((part: any) => part.text)
            .join(" ");
        } else if (lastMessage.content?.type === "text") {
          return lastMessage.content.text || "";
        }
      }
    }

    // Add more extraction logic for other message formats if needed

    return "";
  }

  /**
   * Handle all MCP HTTP requests (unified handler)
   */
  async handleRequest(
    req: Request,
    res: Response,
    method: "GET" | "POST" | "DELETE",
    options?: SessionOptions
  ): Promise<void> {
    try {
      // Get or generate session ID
      const sessionId =
        (req.headers["mcp-session-id"] as string) ||
        (method === "POST" ? randomUUID() : undefined);

      // Validate session ID for non-POST requests
      if (!sessionId) {
        this.sendJsonRpcError(
          res,
          JsonRpcErrorCode.InvalidRequest,
          "Missing session ID"
        );
        return;
      }

      // For POST requests, analyze message content for dynamic tool detection
      if (method === "POST" && req.body) {
        const messageContent = this.extractMessageContent(req.body);
        if (messageContent) {
          this.analyzeMessage(sessionId, messageContent);
        }
      }

      // Get or create server
      const { transport } = await this.serverService.getOrCreateServer(
        sessionId
      );

      // Set up SSE for GET requests
      if (method === "GET") {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Store response object for progress updates
        this.getOrCreateSession(sessionId, res, options);
      }

      // Handle the request via transport
      await transport.handleRequest(
        req,
        res,
        method === "POST" ? req.body : undefined
      );

      // Clean up session for DELETE requests
      if (method === "DELETE") {
        this.serverService.closeServer(sessionId);
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Handle errors in request processing
   */
  private handleError(res: Response, error: unknown): void {
    console.error("Error handling MCP request:", error);

    if (!res.headersSent) {
      if (error instanceof McpError) {
        // Handle MCP-specific errors
        this.sendJsonRpcError(res, error.code, error.message, error.data);
      } else {
        // Handle generic errors
        this.sendJsonRpcError(
          res,
          JsonRpcErrorCode.InternalError,
          error instanceof Error ? error.message : "Internal server error"
        );
      }
    }
  }

  /**
   * Send standard JSON-RPC error response
   */
  private sendJsonRpcError(
    res: Response,
    code: JsonRpcErrorCode,
    message: string,
    data?: any
  ): void {
    const errorResponse = createJsonRpcError(code, message, data);
    const status = this.getHttpStatusForErrorCode(code);
    res.status(status).json(errorResponse);
  }

  /**
   * Convert JSON-RPC error code to HTTP status code
   */
  private getHttpStatusForErrorCode(code: JsonRpcErrorCode): number {
    switch (code) {
      case JsonRpcErrorCode.ParseError:
      case JsonRpcErrorCode.InvalidRequest:
      case JsonRpcErrorCode.InvalidParams:
        return 400; // Bad Request
      case JsonRpcErrorCode.MethodNotFound:
        return 404; // Not Found
      case JsonRpcErrorCode.AuthenticationRequired:
        return 401; // Unauthorized
      case JsonRpcErrorCode.ResourceNotFound:
      case JsonRpcErrorCode.ToolNotFound:
      case JsonRpcErrorCode.PromptNotFound:
        return 404; // Not Found
      case JsonRpcErrorCode.ServerError:
      case JsonRpcErrorCode.InternalError:
      default:
        return 500; // Internal Server Error
    }
  }
}
