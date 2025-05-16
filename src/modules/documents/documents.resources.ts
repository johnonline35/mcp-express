// src/modules/documents/documents.resources.ts
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServerService } from "../../core/mcp-server-service";
import { DocumentsService } from "./documents.service";

/**
 * Register document-related resources with the MCP server service
 */
export function registerDocumentResources(
  serverService: McpServerService,
  documentsService: DocumentsService
): void {
  // Register individual document resource
  serverService.registerResource(
    "document",
    new ResourceTemplate("document://{id}", { list: undefined }),
    async (uri, { id }, context) => {
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

      const document = await documentsService.getDocument(
        id as string,
        context.sessionId
      );

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
    }
  );

  // Register document listing resource
  serverService.registerResource(
    "document-list",
    new ResourceTemplate("documents://list", { list: undefined }),
    async (uri, params, context) => {
      if (!context.sessionId) {
        return {
          contents: [],
          isError: true,
          errorMessage: "No active session",
        };
      }

      const documents = await documentsService.getAccessibleDocuments(
        context.sessionId
      );

      // Format documents as a list
      const documentsList = documents
        .map(
          (doc) =>
            `- ${doc.title} (ID: ${doc.id}, Tags: ${doc.tags.join(", ")})`
        )
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
    }
  );

  // Register documents by tag resource
  serverService.registerResource(
    "documents-by-tag",
    new ResourceTemplate("documents://tag/{tag}", { list: undefined }),
    async (uri, { tag }, context) => {
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

      const documents = await documentsService.getDocumentsByTag(
        tag as string,
        context.sessionId
      );

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
    }
  );
}
