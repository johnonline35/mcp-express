"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserTools = registerUserTools;
/**
 * Register user-related tools with the MCP server service
 */
function registerUserTools(serverService, userService) {
    // Register user info tool
    serverService.registerTool("userInfo", {}, async (params, context) => {
        if (!context.sessionId) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No active session found",
                    },
                ],
                isError: true,
            };
        }
        const userInfo = userService.getUserInfo(context.sessionId);
        if (!userInfo) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Not authenticated",
                    },
                ],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `You are logged in as: ${userInfo.username} (ID: ${userInfo.id})`,
                },
            ],
        };
    });
}
