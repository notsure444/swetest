// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import rag from "@convex-dev/rag/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

// Install AI Agent component for agent orchestration
app.use(agent);

// Install Workflow component for durable multi-step processes
app.use(workflow);

// Install RAG component for semantic code search
app.use(rag);

// Install Rate Limiter component for AI API usage control
app.use(rateLimiter);

// Configure multiple workpool instances for different agent types
// Architecture and planning workpool
app.use(workpool, { name: "architectureWorkpool" });

// Code generation workpool
app.use(workpool, { name: "codingWorkpool" });

// Testing and QA workpool
app.use(workpool, { name: "testingWorkpool" });

// Deployment workpool
app.use(workpool, { name: "deploymentWorkpool" });

// General task management workpool
app.use(workpool, { name: "taskWorkpool" });

export default app;
