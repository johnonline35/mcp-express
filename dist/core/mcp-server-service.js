"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServerService = void 0;
// src/core/mcp-server-service.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
/**
 * Core service for managing MCP servers and their transports
 */
class McpServerService {
    constructor(serverName = "MCP Server", version = "1.0.0") {
        this.serverName = serverName;
        this.version = version;
        this.servers = new Map();
        // Registration tracking
        this.registeredTools = new Map();
        this.registeredStringResources = new Map();
        this.registeredTemplateResources = new Map();
        this.registeredPrompts = new Map();
        // Create default server for registration template
        this.defaultServer = new mcp_js_1.McpServer({
            name: serverName,
            version,
        });
    }
    /**
     * Register a tool with the MCP service
     */
    registerTool(name, paramSchema, handler) {
        // Store registration
        const registration = { name, paramSchema, handler };
        this.registeredTools.set(name, registration);
        // Register with default server (for validation/schema)
        this.defaultServer.tool(name, paramSchema, handler);
        console.log(`Registered tool: ${name}`);
    }
    /**
     * Register a resource with the MCP service
     */
    registerResource(name, template, handler) {
        if (template instanceof mcp_js_1.ResourceTemplate) {
            // Store template resource registration
            const registration = {
                name,
                template,
                handler: handler,
            };
            this.registeredTemplateResources.set(name, registration);
            // Register with default server
            this.defaultServer.resource(name, template, handler);
        }
        else {
            // Store string resource registration
            const registration = {
                name,
                uri: template,
                handler: handler,
            };
            this.registeredStringResources.set(name, registration);
            // Register with default server
            this.defaultServer.resource(name, template, handler);
        }
        console.log(`Registered resource: ${name}`);
    }
    /**
     * Register a prompt with the MCP service
     */
    registerPrompt(name, paramSchema, handler) {
        // Store registration
        const registration = { name, paramSchema, handler };
        this.registeredPrompts.set(name, registration);
        // Register with default server (for validation/schema)
        this.defaultServer.prompt(name, paramSchema, handler);
        console.log(`Registered prompt: ${name}`);
    }
    /**
     * Get or create a server for a session
     */
    async getOrCreateServer(sessionId) {
        // Check if server exists
        const existingServer = this.servers.get(sessionId);
        if (existingServer) {
            return existingServer;
        }
        // Create transport with session ID
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: () => sessionId,
        });
        // Set up transport close handler to ensure proper cleanup
        transport.onclose = () => {
            // Remove the server from our map when transport closes
            if (transport.sessionId) {
                this.servers.delete(transport.sessionId);
                console.log(`Transport closed, removed server for session ${transport.sessionId}`);
            }
            // Additional cleanup that might be needed
            this.closeServer(sessionId).catch((error) => {
                console.error(`Error in additional cleanup during transport close: ${error}`);
            });
        };
        // Create a new MCP server instance for this session
        const server = new mcp_js_1.McpServer({
            name: this.serverName,
            version: this.version,
        });
        // Apply all registrations to the new server
        this.applyRegistrationsToServer(server);
        // Connect server to transport
        await server.connect(transport);
        // Store server and transport
        const config = { server, transport };
        this.servers.set(sessionId, config);
        console.log(`Created server for session ${sessionId}`);
        return config;
    }
    /**
     * Apply all registered handlers to a server instance
     */
    applyRegistrationsToServer(server) {
        // Apply tools
        for (const { name, paramSchema, handler, } of this.registeredTools.values()) {
            server.tool(name, paramSchema, handler);
        }
        // Apply string resources
        for (const { name, uri, handler, } of this.registeredStringResources.values()) {
            server.resource(name, uri, handler);
        }
        // Apply template resources
        for (const { name, template, handler, } of this.registeredTemplateResources.values()) {
            server.resource(name, template, handler);
        }
        // Apply prompts
        for (const { name, paramSchema, handler, } of this.registeredPrompts.values()) {
            server.prompt(name, paramSchema, handler);
        }
    }
    /**
     * Close and clean up a server
     */
    async closeServer(sessionId) {
        const serverConfig = this.servers.get(sessionId);
        if (serverConfig) {
            try {
                // The McpServer class has a close() method that returns a Promise
                await serverConfig.server.close();
                console.log(`Closed server for session ${sessionId}`);
            }
            catch (error) {
                console.error(`Error closing server for session ${sessionId}:`, error);
            }
            finally {
                // Always remove from map even if close fails
                this.servers.delete(sessionId);
            }
        }
    }
    /**
     * Clean up all servers
     */
    async closeAllServers() {
        const closingPromises = [];
        for (const sessionId of this.servers.keys()) {
            closingPromises.push(this.closeServer(sessionId));
        }
        await Promise.all(closingPromises);
    }
    /**
     * Get a server by session ID
     */
    getServer(sessionId) {
        return this.servers.get(sessionId);
    }
}
exports.McpServerService = McpServerService;
