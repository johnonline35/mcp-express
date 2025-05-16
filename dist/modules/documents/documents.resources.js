"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDocumentResources = registerDocumentResources;
// src/modules/documents/documents.resources.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
/**
 * Register document-related resources with the MCP server service
 */
function registerDocumentResources(serverService, documentsService) {
    // Register individual document resource
    serverService.registerResource("document", new mcp_js_1.ResourceTemplate("document://{id}", { list: undefined }), async (uri, { id }, context) => {
        if (!context.sessionId) {
            return {
                contents: [],
                isError: true,
                errorMessage: "No active session",
            };
        }
        if (Array.isArray(id)) {
            return {
                contents: [],
                isError: true,
                errorMessage: "Invalid document ID format",
            };
        }
        const document = await documentsService.getDocument(id, context.sessionId);
        // Handle not found or no access
        if (!document) {
            return {
                contents: [],
                isError: true,
                errorMessage: "Document not found or access denied",
            };
        }
        // Return document with metadata
        return {
            contents: [
                {
                    uri: uri.href,
                    text: document.content,
                    metadata: {
                        title: document.title,
                        lastUpdated: document.updatedAt.toISOString(),
                        tags: document.tags.join(", "),
                        owner: document.ownerId,
                    },
                },
            ],
        };
    });
    // Register document listing resource
    serverService.registerResource("document-list", new mcp_js_1.ResourceTemplate("documents://list", { list: undefined }), async (uri, params, context) => {
        if (!context.sessionId) {
            return {
                contents: [],
                isError: true,
                errorMessage: "No active session",
            };
        }
        const documents = await documentsService.getAccessibleDocuments(context.sessionId);
        // Format documents as a list
        const documentsList = documents
            .map((doc) => `- ${doc.title} (ID: ${doc.id}, Tags: ${doc.tags.join(", ")})`)
            .join("\n");
        // Return the formatted list
        return {
            contents: [
                {
                    uri: uri.href,
                    text: documentsList ? documentsList : "No documents found",
                    metadata: {
                        count: documents.length,
                        timestamp: new Date().toISOString(),
                    },
                },
            ],
        };
    });
    // Register documents by tag resource
    serverService.registerResource("documents-by-tag", new mcp_js_1.ResourceTemplate("documents://tag/{tag}", { list: undefined }), async (uri, { tag }, context) => {
        if (!context.sessionId) {
            return {
                contents: [],
                isError: true,
                errorMessage: "No active session",
            };
        }
        if (Array.isArray(tag)) {
            return {
                contents: [],
                isError: true,
                errorMessage: "Invalid tag format",
            };
        }
        const documents = await documentsService.getDocumentsByTag(tag, context.sessionId);
        // Format documents as a list
        const documentsList = documents
            .map((doc) => `- ${doc.title} (ID: ${doc.id})`)
            .join("\n");
        // Return the formatted list
        return {
            contents: [
                {
                    uri: uri.href,
                    text: documentsList
                        ? documentsList
                        : `No documents found with tag: ${tag}`,
                    metadata: {
                        tag,
                        count: documents.length,
                        timestamp: new Date().toISOString(),
                    },
                },
            ],
        };
    });
}
