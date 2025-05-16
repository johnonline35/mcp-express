// src/modules/user/user.service.ts
import { SessionManager } from "../../core/session-manager";

/**
 * Service for user-related functionality
 */
export class UserService {
  constructor(private sessionManager: SessionManager) {}

  /**
   * Get information about the current user
   */
  getUserInfo(sessionId: string): { id?: string; username?: string } | null {
    const session = this.sessionManager.getSession(sessionId);

    if (!session?.userId) {
      return null;
    }

    return {
      id: session.userId,
      username: session.username,
    };
  }
}
