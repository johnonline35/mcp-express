// src/modules/index.ts
import { McpServerService } from "../core/mcp-server-service";
import { SessionManager } from "../core/session-manager";

// User module
import { UserService } from "./user/user.service";
import { registerUserTools } from "./user/user.tools";

// Documents module
import { DocumentsService } from "./documents/documents.service";
import { registerDocumentResources } from "./documents/documents.resources";
import { registerDocumentTools } from "./documents/documents.tools";

// Prompts module
import { PromptsService } from "./prompts/prompts.service";
import { registerPromptTemplates } from "./prompts/prompt-templates";
import { registerPromptTools } from "./prompts/prompts.tools";

/**
 * Register all modules with the MCP server
 */
export function registerAllModules(
  serverService: McpServerService,
  sessionManager: SessionManager
) {
  // Create module services
  const userService = new UserService(sessionManager);
  const documentsService = new DocumentsService(sessionManager);
  const promptsService = new PromptsService(sessionManager);

  // Register module components with the serverService
  registerUserTools(serverService, userService);
  registerDocumentResources(serverService, documentsService);
  registerDocumentTools(serverService, documentsService);
  registerPromptTemplates(serverService, promptsService);
  registerPromptTools(serverService, promptsService);

  console.log("All modules registered");

  // Return all services for potential cross-module usage
  return {
    userService,
    documentsService,
    promptsService,
  };
}
