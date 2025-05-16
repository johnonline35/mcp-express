"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../shared/config");
/**
 * Middleware to authenticate requests using JWT
 */
function authMiddleware(req, res, next) {
    // Get token from header, query, or body
    const token = req.headers.authorization?.split(" ")[1] || // Bearer TOKEN format
        req.query.token ||
        req.body.token;
    // If no token is provided
    if (!token) {
        res.status(401).json({
            jsonrpc: "2.0",
            error: {
                code: -32001,
                message: "Authentication required",
            },
            id: null,
        });
        return;
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Attach user to request
        req.user = decoded;
        // Continue to next middleware
        next();
    }
    catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({
            jsonrpc: "2.0",
            error: {
                code: -32001,
                message: "Invalid authentication token",
            },
            id: null,
        });
    }
}
