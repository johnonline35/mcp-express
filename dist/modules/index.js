"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllModules = registerAllModules;
// User module
const user_service_1 = require("./user/user.service");
const user_tools_1 = require("./user/user.tools");
// Documents module
const documents_service_1 = require("./documents/documents.service");
const documents_resources_1 = require("./documents/documents.resources");
const documents_tools_1 = require("./documents/documents.tools");
// Prompts module
const prompts_service_1 = require("./prompts/prompts.service");
const prompt_templates_1 = require("./prompts/prompt-templates");
const prompts_tools_1 = require("./prompts/prompts.tools");
/**
 * Register all modules with the MCP server
 */
function registerAllModules(serverService, sessionManager) {
    // Create module services
    const userService = new user_service_1.UserService(sessionManager);
    const documentsService = new documents_service_1.DocumentsService(sessionManager);
    const promptsService = new prompts_service_1.PromptsService(sessionManager);
    // Register module components with the serverService
    (0, user_tools_1.registerUserTools)(serverService, userService);
    (0, documents_resources_1.registerDocumentResources)(serverService, documentsService);
    (0, documents_tools_1.registerDocumentTools)(serverService, documentsService);
    (0, prompt_templates_1.registerPromptTemplates)(serverService, promptsService);
    (0, prompts_tools_1.registerPromptTools)(serverService, promptsService);
    console.log("All modules registered");
    // Return all services for potential cross-module usage
    return {
        userService,
        documentsService,
        promptsService,
    };
}
