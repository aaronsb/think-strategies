# Think Strategies MCP Server

<p align="center">
  <h2>🧠 Think Strategies</h2>
  <p><em>10 Reasoning Strategies for Structured Problem-Solving</em></p>
</p>

## Overview

An MCP server implementation that provides a tool for dynamic and reflective problem-solving through structured thinking processes. Choose from 10 different reasoning strategies:

- **🔄 Linear** - Flexible thinking with revisions and branches
- **🔗 Chain of Thought** - Sequential step-by-step reasoning
- **🎯 React** - Reasoning combined with actions and observations
- **📋 ReWOO** - Plan-execute pattern with parallel tool usage
- **📝 Scratchpad** - Iterative calculations with state tracking
- **❓ Self-Ask** - Decompose into sub-questions and answers
- **🔍 Self-Consistency** - Multiple reasoning paths to consensus
- **🔭 Step-Back** - Abstract principles before specific application
- **🌳 Tree of Thoughts** - Explore and evaluate multiple branches
- **⚖️ Trilemma** - Balance three competing objectives through satisficing

## Documentation

Comprehensive documentation is available in the following files:

- [Executive Summary](./docs/SequentialThinking-ExecutiveSummary.md) - High-level overview of Sequential Thinking
- [Practical Guide](./docs/SequentialThinking-PracticalGuide.md) - Examples and best practices for using the tool
- [Technical Documentation](./docs/SequentialThinking-Documentation.md) - Detailed technical explanation of the architecture
- [Flow Engine Architecture](./docs/SequentialThinking-FlowEngine.md) - In-depth explanation of the flow engine's flexibility and strategy-specific flows
- [Strategy Comparison](./docs/strategy-comparison.md) - Detailed comparison of different thinking strategies
- [Trilemma Strategy Guide](./docs/trilemma-strategy.md) - Guide to using the trilemma strategy for balancing competing objectives

## Features

- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Support for unfixed step numbers through cyclic flows
- Strategy-specific flow patterns for different reasoning approaches
- Generate and verify solution hypotheses

## Tools and Resources

### Tool: think-strategies

Facilitates a detailed, step-by-step thinking process for problem-solving and analysis.

**Inputs:**
- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (integer): Current thought number
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

### Resource: think-strategies://documentation

Provides detailed documentation for the Sequential Thinking tool, including:
- When to use the tool
- Key features
- Parameter explanations
- Best practices for effective usage

## Usage

The Sequential Thinking tool is designed for:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

## Installation

### Prerequisites

- Node.js (v14 or higher) and npm (v6 or higher)
  OR
- Docker

### Quick Start with npx (Easiest)

You can run the server directly using npx without cloning or installing:

```bash
# Run from npm registry (after publishing)
npx think-strategies

# Or run directly from GitHub
npx github:aaronsb/think-strategies
```

### Setup with Node.js

1. Clone the repository:
```bash
git clone https://github.com/aaronsb/think-strategies.git
cd think-strategies
```

2. Install dependencies:
```bash
npm install
```

3. Make the server executable:
```bash
chmod +x index.js
```

4. Run the server:
```bash
node index.js
```

### Setup with Docker

#### Using Pre-built Image (Recommended)

Pull and run the latest image from GitHub Container Registry:
```bash
docker run --rm -i ghcr.io/aaronsb/think-strategies:latest
```

#### Building Locally

1. Clone the repository:
```bash
git clone https://github.com/aaronsb/think-strategies.git
cd think-strategies
```

2. Build the Docker image:
```bash
./scripts/build-local.sh
```

3. Run the Docker container:
```bash
./scripts/run-local.sh
```

This will run the server with the correct permissions, ensuring that any files created are owned by the current user, not root.

### Development

To contribute to the project:

1. Fork the repository on GitHub
2. Clone your fork locally
3. Add the upstream repository:
```bash
git remote add upstream https://github.com/aaronsb/think-strategies.git
```
4. Create a branch for your changes
5. Submit a pull request with your changes

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### Using npx (Recommended)

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "autoApprove": ["think-strategies"],
      "disabled": false,
      "timeout": 60,
      "command": "npx",
      "args": [
        "github:aaronsb/think-strategies",
        "--storage-path",
        "/path/to/thinking/storage"
      ],
      "transportType": "stdio"
    }
  }
}
```

### Usage with Cline

Add this to your `cline_mcp_settings.json`:

#### Using npx (Recommended)

```json
{
  "mcpServers": {
    "think-strategies": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "npx",
      "args": [
        "github:aaronsb/think-strategies"
      ],
      "env": {},
      "transportType": "stdio"
    }
  }
}
```

#### Using Node.js

```json
{
  "mcpServers": {
    "think-strategies": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": [
        "/path/to/repo/think-strategies/index.js"
      ],
      "env": {},
      "transportType": "stdio"
    }
  }
}
```

#### Using Docker

```json
{
  "mcpServers": {
    "think-strategies": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--user",
        "$(id -u):$(id -g)",
        "-v",
        "/tmp/sequentialthinking-plus-data:/app/data",
        "ghcr.io/aaronsb/think-strategies:latest"
      ],
      "env": {},
      "transportType": "stdio"
    }
  }
}
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License.
