"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPromptTemplates = registerPromptTemplates;
// src/modules/prompts/prompt-templates.ts
const zod_1 = require("zod");
/**
 * Register prompt templates with the MCP server service
 */
function registerPromptTemplates(serverService, promptsService) {
    // Document summary prompt
    serverService.registerPrompt("document-summary", {
        content: zod_1.z.string().describe("The document content to summarize"),
    }, ({ content }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please provide a concise summary of the following document:\n\n${content}`,
                },
            },
        ],
    }));
    // API usage example prompt
    serverService.registerPrompt("api-usage-example", {
        language: zod_1.z.string().describe("Programming language for the example"),
        endpoint: zod_1.z.string().describe("API endpoint name"),
        parameters: zod_1.z.string().describe("Parameters to include in the example"),
    }, ({ language, endpoint, parameters }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate a code example in ${language} showing how to use the ${endpoint} API endpoint with the following parameters: ${parameters}`,
                },
            },
        ],
    }));
}
