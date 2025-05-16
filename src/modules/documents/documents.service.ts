// src/modules/documents/documents.service.ts
import { SessionManager } from "../../core/session-manager";

// Document interface
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  tags: string[];
  isPublic: boolean;
}

// Mock data
const DOCUMENTS: Document[] = [
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
export class DocumentsService {
  constructor(private sessionManager: SessionManager) {}

  /**
   * Get a document by ID, respecting access control
   */
  async getDocument(
    documentId: string,
    sessionId: string
  ): Promise<Document | null> {
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
  async getAccessibleDocuments(sessionId: string): Promise<Document[]> {
    // Get user info from session
    const session = this.sessionManager.getSession(sessionId);
    const userId = session?.userId;

    // Filter documents: return public ones and ones owned by the user
    return DOCUMENTS.filter((doc) => doc.isPublic || doc.ownerId === userId);
  }

  /**
   * Get documents by tag
   */
  async getDocumentsByTag(tag: string, sessionId: string): Promise<Document[]> {
    const accessibleDocs = await this.getAccessibleDocuments(sessionId);
    return accessibleDocs.filter((doc) => doc.tags.includes(tag));
  }
}
