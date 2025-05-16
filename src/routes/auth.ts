// src/routes/auth.ts
import {
  Router,
  Request,
  Response,
  Application,
  RequestHandler,
} from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { AuthUser } from "../middleware/auth";
import { config } from "../shared/config";
import { authMiddleware } from "../middleware/auth";

// In a real app, you'd use a database
const DEMO_USERS = [
  { id: "1", username: "user1", password: "password1" },
  { id: "2", username: "user2", password: "password2" },
];

/**
 * Create and configure auth router
 */
export function setupAuthRoutes(app: Application): void {
  const authRouter = Router();

  // Login route
  authRouter.post("/login", ((req: Request, res: Response) => {
    const { username, password } = req.body;

    // Simple validation
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Find user (in a real app, you'd query a database)
    const user = DEMO_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create JWT payload (exclude password)
    const userForToken: AuthUser = {
      id: user.id,
      username: user.username,
    };

    // Generate token
    const token = jwt.sign(
      userForToken,
      config.jwt.secret as jwt.Secret,
      {
        expiresIn: config.jwt.expiresIn,
      } as SignOptions
    );

    // Send response
    res.json({
      user: userForToken,
      token,
      expiresIn: config.jwt.expiresIn,
    });
  }) as RequestHandler);

  // Get current user info
  authRouter.get("/me", authMiddleware, (req: Request, res: Response) => {
    // The authMiddleware will already have handled token validation
    // and attached the user to the request
    res.json({ user: req.user });
  });

  // Mount the router
  app.use("/auth", authRouter);
}
