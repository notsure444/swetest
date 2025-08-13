I want to build a system that use AI agents to build apps (web apps or mobile apps).
This system will be used for personal projects. 
Design this system, choosing the latest patterns and available tools (tech stack, frameworks, online services etc.):
1. The AI agents will be fully autonomous. Human interaction will be used when more information is needed, or when the project is stuck
2. There will be a dashboard where I can see and control everything, and define the project, deliverables, evals and instructions. The dashboard should be AI-assisted (e.g. AI suggestions, summarization of progress, etc.)
3. The AI agents will do everything needed to build the app from start to end: design the architecture, make a task list, work assignment, coding, testing, QA, deployment scripts, etc.
4. The end result must be a working app with all its features and deliverables tested and validated
5. I suggest using convex.dev. See their AI agent features (https://www.convex.dev/components/agent), Vector database, workflow and many other features. Check the available components at https://www.convex.dev/components
6. I want to avoid OOP when possible, and use python or typescript or both
7. The system will run locally as much as possible, but we can use online services when needed. For example the coding agents will use GPT-5 or claude 4.1, and we can't run these locally
8. The system will be able to work on multiple projects at the same time
9. A project has to be completely isolated from the others: running it and testing it have to be done in a isolated environment
10. The system will provide agents with the tools they need to be as efficient as possible: web search, semantic search in the codebase, todo list, project notes, isolated environment to run tests, and any other tool that can help them
11. the system will be entirely contained in a docker compose
