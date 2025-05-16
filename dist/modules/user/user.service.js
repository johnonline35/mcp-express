"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
/**
 * Service for user-related functionality
 */
class UserService {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }
    /**
     * Get information about the current user
     */
    getUserInfo(sessionId) {
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
exports.UserService = UserService;
