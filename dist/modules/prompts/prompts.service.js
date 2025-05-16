"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptsService = void 0;
/**
 * Service for prompt management
 */
class PromptsService {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        // Sample prompt templates
        this.promptTemplates = [
            {
                id: "document-summary",
                title: "Document Summary",
                description: "Create a concise summary of a document",
                template: "Please provide a concise summary of the following document: {{content}}",
            },
            {
                id: "api-usage",
                title: "API Usage Example",
                description: "Generate example code for using an API endpoint",
                template: "Generate a code example in {{language}} showing how to use the {{endpoint}} API endpoint with the following parameters: {{parameters}}",
            },
        ];
    }
    /**
     * Get all available prompt templates
     */
    getPromptTemplates(sessionId) {
        // In a real implementation, you might filter based on user permissions
        const session = this.sessionManager.getSession(sessionId);
        // For this demo, we'll return all templates regardless of user
        return this.promptTemplates;
    }
    /**
     * Get a specific prompt template by ID
     */
    getPromptTemplate(templateId, sessionId) {
        // In a real implementation, you might check user permissions
        return (this.promptTemplates.find((template) => template.id === templateId) ||
            null);
    }
}
exports.PromptsService = PromptsService;
