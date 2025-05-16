// src/shared/errors.ts
/**
 * Standard JSON-RPC error codes as defined in the specification
 */
export enum JsonRpcErrorCode {
  // Standard JSON-RPC error codes
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  // Server error codes (reserved from -32000 to -32099)
  ServerError = -32000,
  // MCP specific error codes
  AuthenticationRequired = -32001,
  ResourceNotFound = -32002,
  ToolNotFound = -32003,
  PromptNotFound = -32004,
}

/**
 * JSON-RPC error response
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

/**
 * JSON-RPC error response wrapper
 */
export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  error: JsonRpcError;
  id: string | number | null;
}

/**
 * Create a standard JSON-RPC error response
 */
export function createJsonRpcError(
  code: JsonRpcErrorCode,
  message: string,
  data?: any,
  id: string | number | null = null
): JsonRpcErrorResponse {
  return {
    jsonrpc: "2.0",
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
    id,
  };
}

/**
 * Helper class for MCP error handling
 */
export class McpError extends Error {
  code: JsonRpcErrorCode;
  data?: any;

  constructor(code: JsonRpcErrorCode, message: string, data?: any) {
    super(message);
    this.name = "McpError";
    this.code = code;
    this.data = data;
  }

  /**
   * Convert to JSON-RPC error response
   */
  toJsonRpcError(id: string | number | null = null): JsonRpcErrorResponse {
    return createJsonRpcError(this.code, this.message, this.data, id);
  }
}
