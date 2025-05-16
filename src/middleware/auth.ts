// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../shared/config";
import { JsonRpcErrorCode, createJsonRpcError } from "../shared/errors";

// Interfaces
export interface AuthUser {
  id: string;
  username: string;
  // Add any other user properties you need
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get token from header, query, or body
  const token =
    req.headers.authorization?.split(" ")[1] || // Bearer TOKEN format
    (req.query.token as string) ||
    req.body.token;

  // If no token is provided
  if (!token) {
    res
      .status(401)
      .json(
        createJsonRpcError(
          JsonRpcErrorCode.AuthenticationRequired,
          "Authentication required"
        )
      );
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;

    // Attach user to request
    req.user = decoded;

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res
      .status(401)
      .json(
        createJsonRpcError(
          JsonRpcErrorCode.AuthenticationRequired,
          "Invalid authentication token",
          { details: error instanceof Error ? error.message : "Unknown error" }
        )
      );
  }
}
