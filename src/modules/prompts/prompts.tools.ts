// src/modules/prompts/prompts.tools.ts
import { McpServerService } from "../../core/mcp-server-service";
import { PromptsService } from "./prompts.service";

/**
 * Register prompt-related tools with the MCP server service
 */
export function registerPromptTools(
  serverService: McpServerService,
  promptsService: PromptsService
): void {
  // List available prompts
  serverService.registerTool("listPrompts", {}, async (params, context) => {
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

    const templates = promptsService.getPromptTemplates(context.sessionId);

    if (templates.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No prompt templates available",
          },
        ],
      };
    }

    const promptsList = templates
      .map(
        (template) =>
          `- ${template.title} (ID: ${template.id}): ${template.description}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Available prompt templates:\n\n${promptsList}`,
        },
      ],
    };
  });
}
