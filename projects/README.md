# Project Workspaces Directory

This directory contains isolated workspaces for agent-managed projects. Each project gets its own namespace and isolated environment as defined by the multi-project isolation architecture.

## Directory Structure

```
projects/
├── README.md                           # This file
├── .gitkeep                           # Ensure directory is tracked in git
├── project-template/                  # Template for new projects
│   ├── src/                          # Source code directory
│   ├── tests/                        # Test files
│   ├── docs/                         # Project documentation
│   ├── .env.template                 # Environment template
│   └── project.json                  # Project metadata
└── {project-namespace}/              # Individual project workspaces
    ├── src/                          # Project source code
    ├── tests/                        # Project-specific tests
    ├── docs/                         # Project documentation
    ├── build/                        # Build artifacts
    ├── .env                          # Project environment variables
    └── project.json                  # Project configuration
```

## Project Isolation

Each project workspace is completely isolated:

- **Data Isolation**: Each project uses a unique namespace in the Convex database
- **Container Isolation**: Docker containers are created per project with resource limits
- **Network Isolation**: Project-specific networks prevent cross-project interference
- **Resource Isolation**: CPU, memory, and storage limits enforced per project
- **Security Isolation**: User namespaces and security boundaries maintained

## Integration with Docker

The project workspaces integrate with the Docker configuration in `docker/project-template.yml`:

- Volume mount: `./projects/${PROJECT_NAMESPACE}/src:/app/code:rw`
- Each project gets dedicated containers for development, testing, and deployment
- Resource limits and security boundaries enforced at container level

## Project Lifecycle

1. **Creation**: Project workspace created with unique namespace
2. **Development**: Agents work within isolated src/ directory
3. **Testing**: Automated tests run in isolated test container
4. **Deployment**: Preview deployment in isolated deployment container
5. **Cleanup**: Complete workspace cleanup when project completed

## Agent Integration

Agents interact with project workspaces through:

- **Semantic Search**: RAG component namespaced per project
- **File Operations**: All file operations scoped to project workspace
- **Environment Variables**: Project-specific configuration
- **Resource Management**: Resource allocation and monitoring per project

## Workspace Management

Project workspaces are managed by:

- **Project Manager**: Handles workspace creation and cleanup
- **Container Manager**: Orchestrates Docker containers per project
- **Resource Monitor**: Tracks resource usage per workspace
- **Isolation Monitor**: Ensures proper isolation is maintained
