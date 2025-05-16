// src/core/mcp-server-service.ts
import {
  McpServer,
  ResourceTemplate,
  ReadResourceCallback,
  ReadResourceTemplateCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Type definitions for registration tracking
type ToolHandler = (params: any, context: any) => Promise<any>;
type StringResourceHandler = ReadResourceCallback;
type TemplateResourceHandler = ReadResourceTemplateCallback;
type PromptHandler = (params: any) => any;

interface ToolRegistration {
  name: string;
  paramSchema: any;
  handler: ToolHandler;
  isDynamic: boolean;
}

interface StringResourceRegistration {
  name: string;
  uri: string;
  handler: StringResourceHandler;
}

interface TemplateResourceRegistration {
  name: string;
  template: ResourceTemplate;
  handler: TemplateResourceHandler;
}

interface PromptRegistration {
  name: string;
  paramSchema: any;
  handler: PromptHandler;
}

export interface ServerConfig {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

// Track which dynamic tools are enabled for each session
interface SessionToolState {
  enabledDynamicTools: Set<string>;
}

/**
 * Core service for managing MCP servers and their transports
 */
export class McpServerService {
  private servers = new Map<string, ServerConfig>();
  private defaultServer: McpServer;

  // Registration tracking
  private registeredTools = new Map<string, ToolRegistration>();
  private registeredStringResources = new Map<
    string,
    StringResourceRegistration
  >();
  private registeredTemplateResources = new Map<
    string,
    TemplateResourceRegistration
  >();
  private registeredPrompts = new Map<string, PromptRegistration>();

  // Track dynamic tool state per session
  private sessionToolState = new Map<string, SessionToolState>();

  constructor(
    private readonly serverName = "MCP Server",
    private readonly version = "1.0.0"
  ) {
    // Create default server for registration template
    this.defaultServer = new McpServer({
      name: serverName,
      version,
    });
  }

  /**
   * Register a tool with the MCP service
   */
  registerTool(
    name: string,
    paramSchema: any,
    handler: ToolHandler,
    isDynamic: boolean = false
  ): void {
    // Store registration
    const registration = { name, paramSchema, handler, isDynamic };
    this.registeredTools.set(name, registration);

    // If not dynamic, register with default server (for validation/schema)
    // Dynamic tools will be registered per session when enabled
    if (!isDynamic) {
      this.defaultServer.tool(name, paramSchema, handler);
    }

    console.log(`Registered tool: ${name}${isDynamic ? " (dynamic)" : ""}`);
  }

  /**
   * Register a dynamic tool that will be enabled based on context
   */
  registerDynamicTool(
    name: string,
    paramSchema: any,
    handler: ToolHandler
  ): void {
    this.registerTool(name, paramSchema, handler, true);
  }

  /**
   * Register a resource with the MCP service
   */
  registerResource(
    name: string,
    template: string | ResourceTemplate,
    handler: StringResourceHandler | TemplateResourceHandler
  ): void {
    if (template instanceof ResourceTemplate) {
      // Store template resource registration
      const registration = {
        name,
        template,
        handler: handler as TemplateResourceHandler,
      };
      this.registeredTemplateResources.set(name, registration);

      // Register with default server
      this.defaultServer.resource(
        name,
        template,
        handler as TemplateResourceHandler
      );
    } else {
      // Store string resource registration
      const registration = {
        name,
        uri: template,
        handler: handler as StringResourceHandler,
      };
      this.registeredStringResources.set(name, registration);

      // Register with default server
      this.defaultServer.resource(
        name,
        template,
        handler as StringResourceHandler
      );
    }

    console.log(`Registered resource: ${name}`);
  }

  /**
   * Register a prompt with the MCP service
   */
  registerPrompt(name: string, paramSchema: any, handler: PromptHandler): void {
    // Store registration
    const registration = { name, paramSchema, handler };
    this.registeredPrompts.set(name, registration);

    // Register with default server (for validation/schema)
    this.defaultServer.prompt(name, paramSchema, handler);

    console.log(`Registered prompt: ${name}`);
  }

  /**
   * Enable dynamic tools for a specific session
   */
  enableDynamicToolsForSession(
    sessionId: string,
    toolNames: string[]
  ): boolean {
    const serverConfig = this.servers.get(sessionId);
    if (!serverConfig) {
      console.warn(
        `Cannot enable dynamic tools - server for session ${sessionId} not found`
      );
      return false;
    }

    // Get or initialize session tool state
    let state = this.sessionToolState.get(sessionId);
    if (!state) {
      state = { enabledDynamicTools: new Set<string>() };
      this.sessionToolState.set(sessionId, state);
    }

    let toolsAdded = false;

    // For each tool, check if it's dynamic and not already enabled
    for (const toolName of toolNames) {
      const registration = this.registeredTools.get(toolName);

      if (!registration) {
        console.warn(`Cannot enable unknown tool: ${toolName}`);
        continue;
      }

      if (!registration.isDynamic) {
        console.warn(`Tool ${toolName} is not marked as dynamic`);
        continue;
      }

      // Check if already enabled for this session
      if (state.enabledDynamicTools.has(toolName)) {
        continue; // Already enabled
      }

      // Register the tool with this session's server
      serverConfig.server.tool(
        registration.name,
        registration.paramSchema,
        registration.handler
      );

      // Track that this tool is now enabled
      state.enabledDynamicTools.add(toolName);
      toolsAdded = true;

      console.log(`Enabled dynamic tool ${toolName} for session ${sessionId}`);
    }

    return toolsAdded;
  }

  /**
   * Get or create a server for a session
   */
  async getOrCreateServer(sessionId: string): Promise<ServerConfig> {
    // Check if server exists
    const existingServer = this.servers.get(sessionId);
    if (existingServer) {
      return existingServer;
    }

    // Create transport with session ID
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    // Set up transport close handler to ensure proper cleanup
    transport.onclose = () => {
      // Remove the server from our map when transport closes
      if (transport.sessionId) {
        this.servers.delete(transport.sessionId);
        // Also clean up session tool state
        this.sessionToolState.delete(transport.sessionId);
        console.log(
          `Transport closed, removed server for session ${transport.sessionId}`
        );
      }

      // Additional cleanup that might be needed
      this.closeServer(sessionId).catch((error) => {
        console.error(
          `Error in additional cleanup during transport close: ${error}`
        );
      });
    };

    // Create a new MCP server instance for this session
    const server = new McpServer({
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
  private applyRegistrationsToServer(server: McpServer): void {
    // Apply non-dynamic tools
    for (const {
      name,
      paramSchema,
      handler,
      isDynamic,
    } of this.registeredTools.values()) {
      // Skip dynamic tools, they'll be enabled on demand
      if (!isDynamic) {
        server.tool(name, paramSchema, handler);
      }
    }

    // Apply string resources
    for (const {
      name,
      uri,
      handler,
    } of this.registeredStringResources.values()) {
      server.resource(name, uri, handler);
    }

    // Apply template resources
    for (const {
      name,
      template,
      handler,
    } of this.registeredTemplateResources.values()) {
      server.resource(name, template, handler);
    }

    // Apply prompts
    for (const {
      name,
      paramSchema,
      handler,
    } of this.registeredPrompts.values()) {
      server.prompt(name, paramSchema, handler);
    }
  }

  /**
   * Close and clean up a server
   */
  async closeServer(sessionId: string): Promise<void> {
    const serverConfig = this.servers.get(sessionId);
    if (serverConfig) {
      try {
        // The McpServer class has a close() method that returns a Promise
        await serverConfig.server.close();
        console.log(`Closed server for session ${sessionId}`);
      } catch (error) {
        console.error(`Error closing server for session ${sessionId}:`, error);
      } finally {
        // Always remove from map even if close fails
        this.servers.delete(sessionId);
        // Clean up session tool state
        this.sessionToolState.delete(sessionId);
      }
    }
  }

  /**
   * Clean up all servers
   */
  async closeAllServers(): Promise<void> {
    const closingPromises: Promise<void>[] = [];
    for (const sessionId of this.servers.keys()) {
      closingPromises.push(this.closeServer(sessionId));
    }
    await Promise.all(closingPromises);
  }

  /**
   * Get a server by session ID
   */
  getServer(sessionId: string): ServerConfig | undefined {
    return this.servers.get(sessionId);
  }
}
