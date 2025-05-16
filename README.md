# MCP Express

A demonstration implementation of the Model Context Protocol (MCP) using Express and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

MCP Express is a demonstration server implementation of the [Model Context Protocol](https://modelcontextprotocol.io/), showing how to provide LLMs with standardized access to data and functionality through a session-based architecture. This implementation explores architectural approaches to security, modularity, and context-aware capabilities.

## Key Features

- **MCP Specification Implementation**: Support for resources, tools, and prompts as defined in the MCP specification
- **Session-Based Architecture**: Per-session server instances for state isolation
- **JWT Authentication**: Basic authentication integration with user context propagation
- **Dynamic Tool Registration**: Context-aware capability activation based on message content
- **Progress Updates**: Server-Sent Events (SSE) for client feedback
- **Modular Design**: Separation between core services and domain modules

## Architecture

MCP Express demonstrates several architectural approaches:

### Core Components

- **McpServerService**: Manages MCP server instances with registrations for tools, resources, and prompts
- **SessionManager**: Handles client sessions and notification delivery
- **HTTP Controller**: Request handling for MCP protocol operations

### Per-Session Server Instances

Unlike simpler MCP implementations that use a single shared server, MCP Express creates dedicated server instances for each client session, providing:

- Isolation between users
- Session-specific state management
- Independent tool activation for each session

### Dynamic Capability Activation

The system activates tools based on context:

- Basic tools are available to authenticated users
- Additional capabilities are activated based on message content analysis
- Session state tracks which capabilities have been enabled

### Authentication Integration

The implementation includes basic authentication:

- JWT-based authentication
- User identity propagation throughout the request pipeline
- Simple access control for resources

### Real-time Communication

The implementation supports:

- Client-to-server requests via HTTP POST
- Server-to-client notifications via SSE (Server-Sent Events)
- Progress updates for longer operations
- Session termination via HTTP DELETE

---

## Modular System and Application Flow

The application is built around a modular architecture, where each domain (user, documents, prompts, etc.) is encapsulated in its own module. This makes the system extensible, maintainable, and easy to understand.

### App Bootstrap (src/app.ts)

The main entry point for the application is the `bootstrap` function, which sets up the Express app, core services, registers all modules, and configures routes:

```typescript
// src/app.ts
import express from "express";
import cors from "cors";
import { McpServerService } from "./core/mcp-server-service";
import { SessionManager } from "./core/session-manager";
import { setupMcpRoutes } from "./core/http-controller";
import { setupAuthRoutes } from "./routes/auth";
import { registerAllModules } from "./modules/index";
import { config } from "./shared/config";

/**
 * Bootstrap the application
 */
export async function bootstrap() {
  // Create Express app
  const app = express();

  // Configure middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(cors());

  // Create core services
  const serverService = new McpServerService("Test MCP Server", "1.0.0");
  const sessionManager = new SessionManager(serverService);

  // Register all modules
  registerAllModules(serverService, sessionManager);

  // Set up auth routes
  setupAuthRoutes(app);

  // Set up MCP routes
  setupMcpRoutes(app, sessionManager);

  // Start server
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
  });

  return { app, serverService, sessionManager };
}
```

### Module Registration (src/modules/index.ts)

All modules are registered in `src/modules/index.ts` via the `registerAllModules` function. This function wires up each module's tools, resources, and prompts with the core MCP server:

```typescript
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
```

### Module Types

- **User Module:** Handles user-related tools (e.g., user info).
- **Documents Module:** Provides document resources (fetch, list, filter by tag) and tools (search, summarize, analyze).
- **Prompts Module:** Manages prompt templates and prompt-related tools.

Each module typically provides:
- A service class for business logic and data access.
- Registration functions for tools, resources, or prompts.

### How the App Works

1. **Bootstrap:**  
   The app starts in `src/index.ts` by calling `bootstrap()` from `src/app.ts`.
2. **Express Setup:**  
   In `src/app.ts`, an Express app is created, middleware is configured, and core services are instantiated.
3. **Module Registration:**  
   All modules are registered with the MCP server via `registerAllModules`.
4. **Route Setup:**  
   - Auth routes (`/auth/login`, `/auth/me`) are set up.
   - MCP protocol routes (`/mcp`, etc.) are set up for client-server communication.
5. **Session Management:**  
   Each client session is managed independently, allowing for per-session state and tool activation.
6. **Extending the System:**  
   To add new features, simply create a new module with its own service and registration functions, then add it to `registerAllModules`.

### Example: Adding a New Module

1. Create a new folder in `src/modules/` (e.g., `analytics/`).
2. Implement a service class and registration functions for your tools/resources.
3. Import and register your module in `src/modules/index.ts`.

---

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-express.git
cd mcp-express

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
SERVER_NAME="MCP Express Demo"
SERVER_VERSION="1.0.0"
JWT_SECRET="your-secret-key"
```

### API Endpoints

| Endpoint        | Method  | Description                                               |
|-----------------|---------|-----------------------------------------------------------|
| `/mcp`          | POST    | Handle client-to-server MCP requests                      |
| `/mcp`          | GET     | Establish SSE connection for server-to-client notifications|
| `/mcp`          | DELETE  | Terminate a session                                       |
| `/auth/login`   | POST    | Authenticate and obtain a JWT token                       |
| `/auth/me`      | GET     | Get current user information                              |
| `/health`       | GET     | Server health check                                       |

## Demo MCP Features

### Resources

Access data through URI-based resources:

- **Document Resource:** `document://{id}` - Retrieve document content
- **Document List:** `documents://list` - Get all accessible documents
- **Documents By Tag:** `documents://tag/{tag}` - Filter documents by tag

### Tools

Execute operations with parameter validation:

- **Search Documents:** Search for documents by tag
- **User Info:** Get information about the current user
- **Dynamic Document Tools:** Contextually activated document analysis tools

### Prompts

Use interaction templates:

- **Document Summary:** Template for summarizing documents
- **API Usage Example:** Generate code examples for API endpoints

## Extending the System

### Adding New Tools

```typescript
// Register a new tool
serverService.registerTool(
  "myTool",
  {
    param1: z.string(),
    param2: z.number()
  },
  async ({ param1, param2 }, context) => {
    // Tool implementation...
    return {
      content: [
        { type: "text", text: "Tool response" }
      ]
    };
  }
);

// Register a dynamic tool (activated only when needed)
serverService.registerDynamicTool(
  "dynamicTool",
  { /* schema */ },
  async (params, context) => {
    // Tool implementation...
  }
);
```

### Adding New Resources

```typescript
serverService.registerResource(
  "myResource",
  new ResourceTemplate("my-resource://{id}", { list: undefined }),
  async (uri, { id }, context) => {
    // Resource implementation...
    return {
      contents: [{
        uri: uri.href,
        text: "Resource content"
      }]
    };
  }
);
```

## Limitations and Considerations

This demonstration project has several limitations to be aware of:

- **Not Production-Ready:** This implementation is a learning tool and lacks the hardening, testing, and security reviews needed for production
- **Limited Authentication:** The JWT implementation is basic and would need significant enhancement for real-world usage
- **In-Memory Storage:** The demo uses in-memory storage for sessions and mock data
- **MCP Specification Gaps:** The implementation works around MCP's lack of standardized authentication
- **No Rate Limiting:** There's no protection against excessive requests or abuse

## Future Improvements

Areas that would need addressing for a production implementation:

- Comprehensive testing suite
- Persistent storage for sessions and data
- Rate limiting and abuse prevention
- Enhanced security practices and proper secret management
- Logging and monitoring infrastructure

## License

This project is licensed under the MIT License - see the LICENSE file for details.