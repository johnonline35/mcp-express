// src/modules/user/user.tools.ts
import { McpServerService } from "../../core/mcp-server-service";
import { UserService } from "./user.service";

/**
 * Register user-related tools with the MCP server service
 */
export function registerUserTools(
  serverService: McpServerService,
  userService: UserService
): void {
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
