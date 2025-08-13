<general_rules>
When developing AI agents and autonomous systems in this repository:

- Always search for existing agent functions in the `agents/` directory before creating new ones
- Use functional programming patterns and avoid OOP when possible, as specified in the project requirements
- When creating new agent tools (web search, semantic search, todo lists, project notes), place them in `agents/tools/` directory
- Before implementing new LLM integrations, check existing implementations in `agents/llm/` for GPT-5 and Claude 4.1 patterns
- All agent workflows must be built using Convex Workflows component for durability and reliability
- Implement proper rate limiting using the Convex Rate Limiter component for all LLM interactions
- Use Convex RAG component for retrieval-augmented generation when agents need context from documentation or codebase
- All agent message threads should utilize the Convex AI Agent component for proper conversation management
- Project isolation is critical - ensure all agent operations are containerized and projects cannot interfere with each other
- When adding new agent capabilities, always update the corresponding dashboard interface to reflect the new functionality
- Use environment variables for all external service configurations (LLM API keys, third-party integrations)
- Implement comprehensive logging for agent actions to enable debugging and audit trails
- Always validate agent outputs before execution, especially for code generation and deployment operations
</general_rules>

<repository_structure>
This repository implements an AI agent system for autonomous app development with the following planned architecture:

**Core Components:**
- `dashboard/` - AI-assisted project control interface with real-time updates
- `agents/` - Autonomous AI agents for the full development lifecycle
  - `agents/core/` - Base agent implementations and shared functionality
  - `agents/tools/` - Agent tool implementations (web search, semantic search, etc.)
  - `agents/llm/` - LLM service integrations (GPT-5, Claude 4.1)
  - `agents/workflows/` - Multi-step agent operations using Convex Workflows
- `convex/` - Convex backend functions, database schema, and component configurations
- `projects/` - Isolated project workspaces managed by agents
- `docker/` - Docker Compose configuration and containerization setup
- `shared/` - Shared utilities and types between dashboard and agents

**Technology Stack:**
- Backend: Convex.dev platform with AI Agent, Workflows, RAG, and Rate Limiter components
- Frontend Dashboard: Real-time interface with Convex sync
- Languages: TypeScript and Python, avoiding OOP patterns
- Infrastructure: Docker Compose for full system containerization
- External Services: GPT-5 and Claude 4.1 for LLM capabilities

**Key Architectural Principles:**
- Multi-project support with complete isolation between projects
- Local execution prioritized, cloud services used when necessary
- All agent operations are durable and recoverable through Convex Workflows
- Real-time dashboard updates using Convex real-time features
</repository_structure>

<dependencies_and_installation>
This project uses multiple package managers for different components:

**Primary Dependencies:**
- Install Convex CLI: `npm install -g convex`
- Node.js dependencies (dashboard/shared): `npm install`
- Python dependencies (agents): `pip install -r requirements.txt` or `poetry install`

**Development Setup:**
- Initialize Convex backend: `npx convex dev`
- Install Convex components: `npm install @convex-dev/agent @convex-dev/workflow @convex-dev/rag @convex-dev/rate-limiter`
- Set up Docker Compose environment: `docker-compose up -d`

**Environment Configuration:**
- Copy `.env.example` to `.env` and configure API keys for GPT-5/Claude 4.1
- Configure Convex environment variables for external service integrations
- Set up project isolation directories and permissions

**Package Managers:**
- Use `npm` for TypeScript/JavaScript dependencies
- Use `pip` or `poetry` for Python agent dependencies
- Use Docker Compose for full system orchestration
- Dependencies are installed per service/component to maintain isolation
</dependencies_and_installation>

<testing_instructions>
Testing in this repository focuses on agent behavior, system integration, and project isolation:

**Agent Testing:**
- Use pytest for Python agent unit tests and integration tests
- Test agent tool functionality with mock external services
- Validate LLM integration responses and error handling
- Ensure agent workflows complete successfully and handle failures gracefully

**System Integration Testing:**
- Test project isolation by running multiple concurrent projects
- Validate dashboard real-time updates with agent actions
- Test Docker Compose environment setup and teardown
- Verify Convex component integrations (Workflows, RAG, Rate Limiter)

**Testing Commands:**
- Run agent tests: `pytest tests/agents/`
- Run dashboard tests: `npm test` (in dashboard directory)
- Run integration tests: `docker-compose -f docker-compose.test.yml up`
- Test project isolation: `pytest tests/integration/isolation_tests.py`

**Testing Guidelines:**
- Mock all external LLM API calls in unit tests
- Test agent decision-making with deterministic scenarios
- Validate that projects remain completely isolated during testing
- Test system recovery and cleanup after agent failures
- Ensure all agent outputs are properly validated and sanitized
</testing_instructions>

<pull_request_formatting>

</pull_request_formatting>
