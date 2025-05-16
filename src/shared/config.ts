// src/shared/config.ts
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  serverName: process.env.SERVER_NAME || "MCP Express Demo",
  serverVersion: process.env.SERVER_VERSION || "1.0.0",
  jwt: {
    secret: process.env.JWT_SECRET || "development-secret-key",
    expiresIn: "24h",
  },
};
