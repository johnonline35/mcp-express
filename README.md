# MCP Express

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

MCP Express is a demonstration server implementation of the [Model Context Protocol](https://modelcontextprotocol.io/), showing how to provide LLMs with standardized access to data and functionality through a session-based architecture. This project is ideal for developers exploring secure, modular, and context-aware server designs for LLM integrations.

## Key Features

- **MCP Specification Implementation**: Support for resources, tools, and prompts as defined in the MCP specification
- **Session-Based Architecture**: Per-session server instances for state isolation
- **JWT Authentication**: Basic authentication integration with user context propagation
- **Dynamic Tool Registration**: Context-aware capability activation based on message content
- **Progress Updates**: Server-Sent Events (SSE) for client feedback
- **Modular Design**: Separation between core services and domain modules

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

---

## Demo Features

### Resources
- **Document Resource:** `document://{id}` - Retrieve document content
- **Document List:** `documents://list` - Get all accessible documents
- **Documents By Tag:** `documents://tag/{tag}` - Filter documents by tag

### Tools
- **Search Documents:** Search for documents by tag
- **User Info:** Get information about the current user
- **Dynamic Document Tools:** Contextually activated document analysis tools

### Prompts
- **Document Summary:** Template for summarizing documents
- **API Usage Example:** Generate code examples for API endpoints

---

## Architecture & Modular System

### High-Level Architecture
MCP Express is built around a modular architecture, where each domain (user, documents, prompts, etc.) is encapsulated in its own module. This makes the system extensible, maintainable, and easy to understand.

### App Bootstrap (`src/app.ts`)
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

export async function bootstrap() {
  const app = express();
  
  app.use(express.json({ limit: "50mb" }));
  app.use(cors());

  const serverService = new McpServerService("Test MCP Server", "1.0.0");
  const sessionManager = new SessionManager(serverService);

  registerAllModules(serverService, sessionManager);

  setupAuthRoutes(app);

  setupMcpRoutes(app, sessionManager);

  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
  });
  return { app, serverService, sessionManager };
}
```

### Module Registration (`src/modules/index.ts`)
All modules are registered in `src/modules/index.ts` via the `registerAllModules` function. This function wires up each module's tools, resources, and prompts with the core MCP server:
```typescript
// src/modules/index.ts
import { McpServerService } from "../core/mcp-server-service";
import { SessionManager } from "../core/session-manager";
import { UserService } from "./user/user.service";
import { registerUserTools } from "./user/user.tools";
import { DocumentsService } from "./documents/documents.service";
import { registerDocumentResources } from "./documents/documents.resources";
import { registerDocumentTools } from "./documents/documents.tools";
import { PromptsService } from "./prompts/prompts.service";
import { registerPromptTemplates } from "./prompts/prompt-templates";
import { registerPromptTools } from "./prompts/prompts.tools";

export function registerAllModules(
  serverService: McpServerService,
  sessionManager: SessionManager
) {
  const userService = new UserService(sessionManager);
  const documentsService = new DocumentsService(sessionManager);
  const promptsService = new PromptsService(sessionManager);

  registerUserTools(serverService, userService);
  registerDocumentResources(serverService, documentsService);
  registerDocumentTools(serverService, documentsService);
  registerPromptTemplates(serverService, promptsService);
  registerPromptTools(serverService, promptsService);
  
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
1. **Bootstrap:** The app starts in `src/index.ts` by calling `bootstrap()` from `src/app.ts`.
2. **Express Setup:** In `src/app.ts`, an Express app is created, middleware is configured, and core services are instantiated.
3. **Module Registration:** All modules are registered with the MCP server via `registerAllModules`.
4. **Route Setup:**
   - Auth routes (`/auth/login`, `/auth/me`) are set up.
   - MCP protocol routes (`/mcp`, etc.) are set up for client-server communication.
5. **Session Management:** Each client session is managed independently, allowing for per-session state and tool activation.
6. **Extending the System:** To add new features, simply create a new module with its own service and registration functions, then add it to `registerAllModules`.

### Example: Adding a New Module
1. Create a new folder in `src/modules/` (e.g., `analytics/`).
2. Implement a service class and registration functions for your tools/resources.
3. Import and register your module in `src/modules/index.ts`.

---

## Extending the System

You can add new tools or resources by following the modular pattern. For example, to add a new tool:

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
```

To add a new resource:
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

---

## Limitations and Considerations
- **Not Production-Ready:** This implementation is a learning tool and lacks the hardening, testing, and security reviews needed for production
- **Limited Authentication:** The JWT implementation is basic and would need significant enhancement for real-world usage
- **In-Memory Storage:** The demo uses in-memory storage for sessions and mock data
- **MCP Specification Gaps:** The implementation works around MCP's lack of standardized authentication
- **No Rate Limiting:** There's no protection against excessive requests or abuse

---

## Future Improvements
- Comprehensive testing suite
- Persistent storage for sessions and data
- Rate limiting and abuse prevention
- Enhanced security practices and proper secret management
- Logging and monitoring infrastructure

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.