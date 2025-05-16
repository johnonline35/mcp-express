// src/modules/documents/documents.tools.ts
import { z } from "zod";
import { McpServerService } from "../../core/mcp-server-service";
import { DocumentsService } from "./documents.service";

/**
 * Registers document-related tools with the MCP server service.
 * This function sets up both regular and dynamic tools that can be used to interact with documents.
 *
 * @param {McpServerService} serverService - The MCP server service instance to register tools with
 * @param {DocumentsService} documentsService - The documents service instance for document operations
 * @returns {void}
 */
export function registerDocumentTools(
  serverService: McpServerService,
  documentsService: DocumentsService
): void {
  /**
   * Regular tool for searching documents by tag.
   * This tool is always available and doesn't require dynamic registration.
   *
   * @param {Object} params - The parameters object
   * @param {string} params.tag - The tag to search for in documents
   * @param {Object} context - The execution context containing session information
   * @returns {Promise<Object>} A response object containing the search results
   */
  serverService.registerTool(
    "searchDocuments",
    {
      tag: z.string().describe("Tag to search for"),
    },
    async ({ tag }, context) => {
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

      const documents = await documentsService.getDocumentsByTag(
        tag,
        context.sessionId
      );

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
    }
  );

  /**
   * Dynamic tool for document summarization.
   * This tool is registered dynamically and provides a summary of document content,
   * including word count, key sentences, and metadata.
   *
   * @param {Object} params - The parameters object
   * @param {string} params.documentId - The ID of the document to summarize
   * @param {Object} context - The execution context containing session information
   * @returns {Promise<Object>} A response object containing the document summary
   */
  serverService.registerDynamicTool(
    "summarizeDocument",
    {
      documentId: z.string().describe("ID of the document to summarize"),
    },
    async ({ documentId }, context) => {
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

      const document = await documentsService.getDocument(
        documentId,
        context.sessionId
      );

      if (!document) {
        return {
          content: [
            {
              type: "text",
              text: `Document not found or access denied: ${documentId}`,
            },
          ],
          isError: true,
        };
      }

      // Simple mock summarization for demo purposes
      const wordCount = document.content.split(/\s+/).length;
      const sentences = document.content
        .split(/[.!?]+/)
        .filter((s) => s.trim());
      const topSentences = sentences.slice(0, Math.min(3, sentences.length));

      const summary = `
# Document Summary: ${document.title}

## Overview
This document contains approximately ${wordCount} words and was last updated on ${document.updatedAt.toLocaleDateString()}.

## Key Points
${topSentences.map((s) => `- ${s.trim()}`).join("\n")}

## Tags
${document.tags.join(", ")}
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      };
    }
  );

  /**
   * Dynamic tool for word and character counting.
   * This tool analyzes a document and provides detailed statistics about its content,
   * including character count, word count, sentence count, and paragraph count.
   *
   * @param {Object} params - The parameters object
   * @param {string} params.documentId - The ID of the document to analyze
   * @param {Object} context - The execution context containing session information
   * @returns {Promise<Object>} A response object containing the document statistics
   */
  serverService.registerDynamicTool(
    "countWordsAndCharacters",
    {
      documentId: z.string().describe("ID of the document to analyze"),
    },
    async ({ documentId }, context) => {
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

      const document = await documentsService.getDocument(
        documentId,
        context.sessionId
      );

      if (!document) {
        return {
          content: [
            {
              type: "text",
              text: `Document not found or access denied: ${documentId}`,
            },
          ],
          isError: true,
        };
      }

      // Count words and characters
      const text = document.content;
      const charCount = text.length;
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim()).length;
      const paragraphCount = text
        .split(/\n\s*\n/)
        .filter((p) => p.trim()).length;

      const analysis = `
# Document Statistics: ${document.title}

- Character count: ${charCount}
- Word count: ${wordCount}
- Sentence count: ${sentenceCount}
- Paragraph count: ${paragraphCount}
- Average words per sentence: ${(
        wordCount / Math.max(1, sentenceCount)
      ).toFixed(1)}
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: analysis,
          },
        ],
      };
    }
  );

  /**
   * Dynamic tool for document format detection.
   * This tool analyzes a document's content to determine its likely format
   * (e.g., Markdown, HTML, JSON, source code) based on content patterns.
   *
   * @param {Object} params - The parameters object
   * @param {string} params.documentId - The ID of the document to analyze
   * @param {Object} context - The execution context containing session information
   * @returns {Promise<Object>} A response object containing the format analysis
   *
   * @description
   * The tool performs the following format detection:
   * - Checks for Markdown syntax (headings, links, lists)
   * - Detects HTML tags
   * - Identifies JSON structure
   * - Looks for programming language keywords
   *
   * The confidence level is determined based on the number and strength of indicators found.
   */
  serverService.registerDynamicTool(
    "detectDocumentFormat",
    {
      documentId: z.string().describe("ID of the document to analyze"),
    },
    async ({ documentId }, context) => {
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

      const document = await documentsService.getDocument(
        documentId,
        context.sessionId
      );

      if (!document) {
        return {
          content: [
            {
              type: "text",
              text: `Document not found or access denied: ${documentId}`,
            },
          ],
          isError: true,
        };
      }

      // Simple format detection (mock for demo purposes)
      const content = document.content;

      // Detect if it's likely Markdown
      const hasMarkdownHeadings = /^#+\s+.+$/m.test(content);
      const hasMarkdownLinks = /\[.+\]\(.+\)/.test(content);
      const hasMarkdownLists = /^[-*+]\s+.+$/m.test(content);

      // Detect if it's likely HTML
      const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(content);

      // Detect if it's likely JSON
      const isLikelyJson =
        /^\s*[{\[]/.test(content) && /[}\]]\s*$/.test(content);

      // Detect if it's likely code
      const hasCodeElements =
        /(function|class|import|export|const|let|var|if|for|while)\s/.test(
          content
        );

      // Make a determination
      let format = "Plain text";
      let confidence = "Low";

      if (hasHtmlTags) {
        format = "HTML";
        confidence = hasHtmlTags ? "High" : "Medium";
      } else if (isLikelyJson) {
        format = "JSON";
        confidence = "High";
      } else if (hasMarkdownHeadings || hasMarkdownLinks || hasMarkdownLists) {
        format = "Markdown";
        confidence =
          hasMarkdownHeadings && hasMarkdownLinks ? "High" : "Medium";
      } else if (hasCodeElements) {
        format = "Source code";
        confidence = "Medium";
      }

      const analysis = `
# Document Format Analysis: ${document.title}

- Detected format: ${format}
- Confidence: ${confidence}

## Format indicators detected:
${hasHtmlTags ? "- HTML tags\n" : ""}${
        isLikelyJson ? "- JSON structure\n" : ""
      }${hasMarkdownHeadings ? "- Markdown headings\n" : ""}${
        hasMarkdownLinks ? "- Markdown links\n" : ""
      }${hasMarkdownLists ? "- Markdown lists\n" : ""}${
        hasCodeElements ? "- Programming language keywords\n" : ""
      }
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: analysis,
          },
        ],
      };
    }
  );
}
