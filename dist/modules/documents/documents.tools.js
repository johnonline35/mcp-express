"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDocumentTools = registerDocumentTools;
// src/modules/documents/documents.tools.ts
const zod_1 = require("zod");
/**
 * Register document-related tools with the MCP server service
 */
function registerDocumentTools(serverService, documentsService) {
    // Search documents tool
    serverService.registerTool("searchDocuments", {
        tag: zod_1.z.string().describe("Tag to search for"),
    }, async ({ tag }, context) => {
        if (!context.sessionId) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No active session found",
                    },
                ],
            };
        }
        const documents = await documentsService.getDocumentsByTag(tag, context.sessionId);
        if (documents.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No documents found with tag: ${tag}`,
                    },
                ],
            };
        }
        const resultText = documents
            .map((doc) => `- ${doc.title} (ID: ${doc.id})`)
            .join("\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${documents.length} document(s) with tag "${tag}":\n\n${resultText}`,
                },
            ],
        };
    });
}
