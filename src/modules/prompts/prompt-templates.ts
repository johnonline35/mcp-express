// src/modules/prompts/prompt-templates.ts
import { z } from "zod";
import { McpServerService } from "../../core/mcp-server-service";
import { PromptsService } from "./prompts.service";

/**
 * Register prompt templates with the MCP server service
 */
export function registerPromptTemplates(
  serverService: McpServerService,
  promptsService: PromptsService
): void {
  // Document summary prompt
  serverService.registerPrompt(
    "document-summary",
    {
      content: z.string().describe("The document content to summarize"),
    },
    ({ content }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please provide a concise summary of the following document:\n\n${content}`,
          },
        },
      ],
    })
  );

  // API usage example prompt
  serverService.registerPrompt(
    "api-usage-example",
    {
      language: z.string().describe("Programming language for the example"),
      endpoint: z.string().describe("API endpoint name"),
      parameters: z.string().describe("Parameters to include in the example"),
    },
    ({ language, endpoint, parameters }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a code example in ${language} showing how to use the ${endpoint} API endpoint with the following parameters: ${parameters}`,
          },
        },
      ],
    })
  );
}
