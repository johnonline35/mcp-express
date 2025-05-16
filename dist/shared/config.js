"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/shared/config.ts
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    serverName: process.env.SERVER_NAME || "MCP Express Demo",
    serverVersion: process.env.SERVER_VERSION || "1.0.0",
    jwt: {
        secret: process.env.JWT_SECRET || "development-secret-key",
        expiresIn: "24h",
    },
};
