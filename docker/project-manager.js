// docker/project-manager.js
// Project isolation and container management utility
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProjectContainerManager {
  constructor() {
    this.baseDir = __dirname;
    this.templatesDir = path.join(this.baseDir, 'templates');
    this.projectsDir = path.join(this.baseDir, '../projects');
  }

  /**
   * Create isolated Docker environment for a new project
   */
  async createProjectEnvironment(projectConfig) {
    const {
      projectId,
      namespace,
      type,
      techStack,
      isolationLevel = 'standard',
      resourceLimits = {}
    } = projectConfig;

    console.log(`Creating isolated environment for project: ${namespace}`);

    try {
      // Create project directory
      const projectDir = path.join(this.projectsDir, namespace);
      await fs.mkdir(projectDir, { recursive: true });

      // Generate Docker Compose file for this project
      const dockerComposeContent = await this.generateProjectDockerCompose(projectConfig);
      const dockerComposePath = path.join(projectDir, 'docker-compose.yml');
      await fs.writeFile(dockerComposePath, dockerComposeContent);

      // Generate environment file
      const envContent = this.generateProjectEnvFile(projectConfig);
      const envPath = path.join(projectDir, '.env');
      await fs.writeFile(envPath, envContent);

      // Create project source directory
      const srcDir = path.join(projectDir, 'src');
      await fs.mkdir(srcDir, { recursive: true });

      // Initialize project based on tech stack
      await this.initializeProjectStructure(srcDir, type, techStack);

      // Create Docker network for project isolation
      await this.createProjectNetwork(namespace);

      console.log(`✅ Successfully created isolated environment: ${namespace}`);
      return {
        success: true,
        projectDir,
        namespace,
        containers: this.getContainerNames(namespace),
      };
    } catch (error) {
      console.error(`❌ Failed to create project environment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate project-specific Docker Compose configuration
   */
  async generateProjectDockerCompose(projectConfig) {
    const template = await fs.readFile(
      path.join(this.baseDir, 'project-template.yml'),
      'utf8'
    );

    const {
      namespace,
      type,
      techStack,
      isolationLevel,
      resourceLimits = {}
    } = projectConfig;

    // Calculate dynamic values
    const subnet = this.generateSubnet(namespace);
    const portRange = this.allocatePortRange(namespace);
    const images = this.getImagesForTechStack(techStack);
    const commands = this.getCommandsForProjectType(type, techStack);

    // Replace template variables
    let dockerComposeContent = template
      .replace(/\${PROJECT_NAMESPACE}/g, namespace)
      .replace(/\${PROJECT_ID}/g, projectConfig.projectId)
      .replace(/\${PROJECT_TYPE}/g, type)
      .replace(/\${PROJECT_SUBNET}/g, subnet)
      .replace(/\${ISOLATION_LEVEL}/g, isolationLevel)
      .replace(/\${DEV_IMAGE}/g, images.dev)
      .replace(/\${TEST_IMAGE}/g, images.test)
      .replace(/\${DEPLOY_IMAGE}/g, images.deploy)
      .replace(/\${DEV_PORT_RANGE}/g, `"${portRange.dev.join(':', 1)}:${portRange.dev.join(':', 1)}"`)
      .replace(/\${DEPLOY_PORT}/g, portRange.deploy)
      .replace(/\${DEV_COMMAND}/g, commands.dev)
      .replace(/\${TEST_COMMAND}/g, commands.test)
      .replace(/\${DEPLOY_COMMAND}/g, commands.deploy)
      .replace(/\${DEV_HEALTH_PORT}/g, portRange.dev[0])
      .replace(/\${MAX_CPUS}/g, resourceLimits.maxCpu || '2')
      .replace(/\${MAX_MEMORY}/g, resourceLimits.maxMemory || '2G')
      .replace(/\${TEST_CPUS}/g, resourceLimits.testCpu || '1')
      .replace(/\${TEST_MEMORY}/g, resourceLimits.testMemory || '1G')
      .replace(/\${DEPLOY_CPUS}/g, resourceLimits.deployCpu || '1')
      .replace(/\${DEPLOY_MEMORY}/g, resourceLimits.deployMemory || '1G');

    return dockerComposeContent;
  }

  /**
   * Generate project environment file
   */
  generateProjectEnvFile(projectConfig) {
    const { namespace, projectId, type, techStack, isolationLevel } = projectConfig;
    
    return `# Project Environment Configuration
PROJECT_ID=${projectId}
PROJECT_NAMESPACE=${namespace}
PROJECT_TYPE=${type}
TECH_STACK=${techStack.join(',')}
ISOLATION_LEVEL=${isolationLevel}

# Container Configuration
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1

# Network Configuration
COMPOSE_PROJECT_NAME=${namespace}

# Resource Limits
MAX_CPUS=2
MAX_MEMORY=2G
TEST_CPUS=1
TEST_MEMORY=1G
DEPLOY_CPUS=1  
DEPLOY_MEMORY=1G

# Development Configuration
NODE_ENV=development
CONVEX_URL=http://convex-backend:3210

# Database Configuration (if needed)
DB_USER=project
DB_PASSWORD=${this.generateSecurePassword()}
`;
  }

  /**
   * Initialize project structure based on tech stack
   */
  async initializeProjectStructure(srcDir, type, techStack) {
    const packageJsonContent = this.generatePackageJson(type, techStack);
    await fs.writeFile(path.join(srcDir, 'package.json'), packageJsonContent);

    // Create basic project structure
    if (techStack.includes('react') || type === 'web') {
      await fs.mkdir(path.join(srcDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(srcDir, 'public'), { recursive: true });
      
      // Create basic React app structure
      const indexHtml = this.generateIndexHtml(type);
      await fs.writeFile(path.join(srcDir, 'public', 'index.html'), indexHtml);
      
      const appJs = this.generateAppJs(type, techStack);
      await fs.writeFile(path.join(srcDir, 'src', 'App.js'), appJs);
    }

    if (techStack.includes('python')) {
      await fs.mkdir(path.join(srcDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(srcDir, 'tests'), { recursive: true });
      
      const requirementsTxt = this.generateRequirements(techStack);
      await fs.writeFile(path.join(srcDir, 'requirements.txt'), requirementsTxt);
      
      const mainPy = this.generateMainPy(type);
      await fs.writeFile(path.join(srcDir, 'src', 'main.py'), mainPy);
    }

    // Create Dockerfile
    const dockerfile = this.generateDockerfile(type, techStack);
    await fs.writeFile(path.join(srcDir, 'Dockerfile'), dockerfile);

    // Add health check endpoint
    const healthJs = this.generateHealthCheck(type, techStack);
    await fs.writeFile(path.join(srcDir, 'health.js'), healthJs);
  }

  /**
   * Helper functions for project configuration
   */
  generateSubnet(namespace) {
    // Generate unique subnet based on namespace hash
    const hash = this.simpleHash(namespace);
    const thirdOctet = (hash % 254) + 1;
    return `172.${20 + Math.floor(hash / 254) % 10}.${thirdOctet}.0/24`;
  }

  allocatePortRange(namespace) {
    const hash = this.simpleHash(namespace);
    const basePort = 4000 + (hash % 1000);
    
    return {
      dev: [basePort, basePort + 1, basePort + 2],
      test: basePort + 10,
      deploy: basePort + 20,
    };
  }

  getImagesForTechStack(techStack) {
    if (techStack.includes('node') || techStack.includes('react')) {
      return {
        dev: 'node:20-alpine',
        test: 'node:20-alpine',
        deploy: 'nginx:alpine'
      };
    } else if (techStack.includes('python')) {
      return {
        dev: 'python:3.11-slim',
        test: 'python:3.11-slim',
        deploy: 'python:3.11-slim'
      };
    }
    
    return {
      dev: 'ubuntu:22.04',
      test: 'ubuntu:22.04', 
      deploy: 'ubuntu:22.04'
    };
  }

  getCommandsForProjectType(type, techStack) {
    if (techStack.includes('react')) {
      return {
        dev: 'npm run dev',
        test: 'npm test',
        deploy: 'npm run build && nginx -g "daemon off;"'
      };
    } else if (techStack.includes('node')) {
      return {
        dev: 'npm run dev',
        test: 'npm test',
        deploy: 'npm run build && npm start'
      };
    } else if (techStack.includes('python')) {
      return {
        dev: 'python src/main.py',
        test: 'python -m pytest tests/',
        deploy: 'gunicorn --bind 0.0.0.0:80 src.main:app'
      };
    }

    return {
      dev: 'echo "Development server starting..." && sleep infinity',
      test: 'echo "Running tests..."',
      deploy: 'echo "Deployment ready..."'
    };
  }

  generatePackageJson(type, techStack) {
    const basePackage = {
      name: `project-${Date.now()}`,
      version: '1.0.0',
      private: true,
      scripts: {},
      dependencies: {},
      devDependencies: {}
    };

    if (techStack.includes('react')) {
      basePackage.dependencies = {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        'react-scripts': '^5.0.0'
      };
      basePackage.scripts = {
        start: 'react-scripts start',
        dev: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      };
    } else if (techStack.includes('node')) {
      basePackage.dependencies = {
        express: '^4.18.0'
      };
      basePackage.scripts = {
        start: 'node src/server.js',
        dev: 'nodemon src/server.js',
        test: 'jest'
      };
      basePackage.devDependencies = {
        nodemon: '^2.0.0',
        jest: '^29.0.0'
      };
    }

    return JSON.stringify(basePackage, null, 2);
  }

  generateIndexHtml(type) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autonomous AI Project</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
  }

  generateAppJs(type, techStack) {
    return `import React from 'react';

function App() {
  return (
    <div style={{padding: '20px'}}>
      <h1>Autonomous AI Agent Project</h1>
      <p>Project Type: ${type}</p>
      <p>Tech Stack: ${techStack.join(', ')}</p>
      <p>Status: Ready for development</p>
    </div>
  );
}

export default App;`;
  }

  generateMainPy(type) {
    return `# Autonomous AI Agent Project - ${type}
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'message': 'Autonomous AI Agent Project',
        'type': '${type}',
        'status': 'Ready for development'
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 80))
    app.run(host='0.0.0.0', port=port, debug=True)
`;
  }

  generateRequirements(techStack) {
    return `flask==2.3.3
gunicorn==21.2.0
pytest==7.4.2
`;
  }

  generateDockerfile(type, techStack) {
    if (techStack.includes('node') || techStack.includes('react')) {
      return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 80
CMD ["npm", "start"]`;
    } else if (techStack.includes('python')) {
      return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 80
CMD ["python", "src/main.py"]`;
    }

    return `FROM ubuntu:22.04
WORKDIR /app
COPY . .
EXPOSE 80
CMD ["echo", "Container ready"]`;
  }

  generateHealthCheck(type, techStack) {
    return `// Health check endpoint for container monitoring
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      project_type: '${type}'
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = process.env.HEALTH_PORT || 8080;
server.listen(port, () => {
  console.log(\`Health check server running on port \${port}\`);
});
`;
  }

  async createProjectNetwork(namespace) {
    try {
      execSync(`docker network create ${namespace}_network`, { stdio: 'ignore' });
    } catch (error) {
      // Network might already exist
      console.log(`Network ${namespace}_network already exists or creation failed`);
    }
  }

  getContainerNames(namespace) {
    return [
      `${namespace}_development`,
      `${namespace}_testing`,
      `${namespace}_deployment`
    ];
  }

  generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Start project containers
   */
  async startProject(namespace) {
    const projectDir = path.join(this.projectsDir, namespace);
    console.log(`Starting containers for project: ${namespace}`);
    
    try {
      execSync(`cd ${projectDir} && docker-compose up -d`, { stdio: 'inherit' });
      return { success: true, message: `Project ${namespace} started successfully` };
    } catch (error) {
      throw new Error(`Failed to start project: ${error.message}`);
    }
  }

  /**
   * Stop project containers
   */
  async stopProject(namespace) {
    const projectDir = path.join(this.projectsDir, namespace);
    console.log(`Stopping containers for project: ${namespace}`);
    
    try {
      execSync(`cd ${projectDir} && docker-compose down`, { stdio: 'inherit' });
      return { success: true, message: `Project ${namespace} stopped successfully` };
    } catch (error) {
      throw new Error(`Failed to stop project: ${error.message}`);
    }
  }

  /**
   * Clean up project environment
   */
  async cleanupProject(namespace) {
    const projectDir = path.join(this.projectsDir, namespace);
    console.log(`Cleaning up project: ${namespace}`);
    
    try {
      // Stop and remove containers
      execSync(`cd ${projectDir} && docker-compose down -v --rmi all`, { stdio: 'inherit' });
      
      // Remove project directory
      await fs.rmdir(projectDir, { recursive: true });
      
      // Remove docker network
      try {
        execSync(`docker network rm ${namespace}_network`, { stdio: 'ignore' });
      } catch (e) {
        // Network might be in use or already removed
      }
      
      return { success: true, message: `Project ${namespace} cleaned up successfully` };
    } catch (error) {
      throw new Error(`Failed to cleanup project: ${error.message}`);
    }
  }
}

module.exports = ProjectContainerManager;
