"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
// Mock data
const DOCUMENTS = [
    {
        id: "doc1",
        title: "Getting Started Guide",
        content: "This guide helps you get started with our product...",
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date("2023-03-10"),
        ownerId: "1", // user1
        tags: ["guide", "onboarding"],
        isPublic: true,
    },
    {
        id: "doc2",
        title: "Internal Product Roadmap",
        content: "Our Q3 plans include launching the following features...",
        createdAt: new Date("2023-02-20"),
        updatedAt: new Date("2023-04-05"),
        ownerId: "1", // user1
        tags: ["roadmap", "internal"],
        isPublic: false,
    },
    {
        id: "doc3",
        title: "API Documentation",
        content: "The API provides the following endpoints...",
        createdAt: new Date("2023-01-05"),
        updatedAt: new Date("2023-04-15"),
        ownerId: "2", // user2
        tags: ["api", "documentation"],
        isPublic: true,
    },
];
/**
 * Service for document management
 */
class DocumentsService {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }
    /**
     * Get a document by ID, respecting access control
     */
    async getDocument(documentId, sessionId) {
        // Get user info from session
        const session = this.sessionManager.getSession(sessionId);
        const userId = session?.userId;
        // Find the document
        const document = DOCUMENTS.find((doc) => doc.id === documentId);
        // If document doesn't exist, return null
        if (!document) {
            return null;
        }
        // Check access: public documents are accessible to all,
        // private documents are only accessible to their owners
        if (document.isPublic || document.ownerId === userId) {
            return document;
        }
        // No access
        return null;
    }
    /**
     * Get all documents accessible to the user
     */
    async getAccessibleDocuments(sessionId) {
        // Get user info from session
        const session = this.sessionManager.getSession(sessionId);
        const userId = session?.userId;
        // Filter documents: return public ones and ones owned by the user
        return DOCUMENTS.filter((doc) => doc.isPublic || doc.ownerId === userId);
    }
    /**
     * Get documents by tag
     */
    async getDocumentsByTag(tag, sessionId) {
        const accessibleDocs = await this.getAccessibleDocuments(sessionId);
        return accessibleDocs.filter((doc) => doc.tags.includes(tag));
    }
}
exports.DocumentsService = DocumentsService;
