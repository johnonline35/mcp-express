"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPromptTools = registerPromptTools;
/**
 * Register prompt-related tools with the MCP server service
 */
function registerPromptTools(serverService, promptsService) {
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
            .map((template) => `- ${template.title} (ID: ${template.id}): ${template.description}`)
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
