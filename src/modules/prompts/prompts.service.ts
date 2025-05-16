// src/modules/prompts/prompts.service.ts
import { SessionManager } from "../../core/session-manager";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
}

/**
 * Service for prompt management
 */
export class PromptsService {
  // Sample prompt templates
  private promptTemplates: PromptTemplate[] = [
    {
      id: "document-summary",
      title: "Document Summary",
      description: "Create a concise summary of a document",
      template:
        "Please provide a concise summary of the following document: {{content}}",
    },
    {
      id: "api-usage",
      title: "API Usage Example",
      description: "Generate example code for using an API endpoint",
      template:
        "Generate a code example in {{language}} showing how to use the {{endpoint}} API endpoint with the following parameters: {{parameters}}",
    },
  ];

  constructor(private sessionManager: SessionManager) {}

  /**
   * Get all available prompt templates
   */
  getPromptTemplates(sessionId: string): PromptTemplate[] {
    // In a real implementation, you might filter based on user permissions
    const session = this.sessionManager.getSession(sessionId);

    // For this demo, we'll return all templates regardless of user
    return this.promptTemplates;
  }

  /**
   * Get a specific prompt template by ID
   */
  getPromptTemplate(
    templateId: string,
    sessionId: string
  ): PromptTemplate | null {
    // In a real implementation, you might check user permissions
    return (
      this.promptTemplates.find((template) => template.id === templateId) ||
      null
    );
  }
}
