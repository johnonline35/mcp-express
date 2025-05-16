"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuthRoutes = setupAuthRoutes;
// src/routes/auth.ts
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../shared/config");
const auth_1 = require("../middleware/auth");
// In a real app, you'd use a database
const DEMO_USERS = [
    { id: "1", username: "user1", password: "password1" },
    { id: "2", username: "user2", password: "password2" },
];
/**
 * Create and configure auth router
 */
function setupAuthRoutes(app) {
    const authRouter = (0, express_1.Router)();
    // Login route
    authRouter.post("/login", ((req, res) => {
        const { username, password } = req.body;
        // Simple validation
        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password are required",
            });
        }
        // Find user (in a real app, you'd query a database)
        const user = DEMO_USERS.find((u) => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials",
            });
        }
        // Create JWT payload (exclude password)
        const userForToken = {
            id: user.id,
            username: user.username,
        };
        // Generate token
        const token = jsonwebtoken_1.default.sign(userForToken, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
        // Send response
        res.json({
            user: userForToken,
            token,
            expiresIn: config_1.config.jwt.expiresIn,
        });
    }));
    // Get current user info
    authRouter.get("/me", auth_1.authMiddleware, (req, res) => {
        // The authMiddleware will already have handled token validation
        // and attached the user to the request
        res.json({ user: req.user });
    });
    // Mount the router
    app.use("/auth", authRouter);
}
