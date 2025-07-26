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
- [Practical Guide](./docs/SequentialThinking-PracticalGuide.md) - Examples and best practices for using the tool (includes trilemma scenarios)
- [Technical Documentation](./docs/SequentialThinking-Documentation.md) - Detailed technical explanation of the architecture
- [Flow Engine Architecture](./docs/SequentialThinking-FlowEngine.md) - In-depth explanation of the flow engine's flexibility and strategy-specific flows
- [Strategy Comparison](./docs/strategy-comparison.md) - Detailed comparison of all 10 thinking strategies including trilemma

## Features

- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Support for unfixed step numbers through cyclic flows
- Strategy-specific flow patterns for different reasoning approaches
- Generate and verify solution hypotheses

## Architecture

The think-strategies server uses a **consolidated 3-tool architecture** designed for optimal balance between simplicity and power:

### Core Tools

#### 1. `think-strategies` (Core Thinking)
Facilitates structured problem-solving with prominent strategy selection.

**Parameters (7):**
- `strategy` (string): **Primary choice** - one of 10 reasoning strategies
- `thought` (string): The current thinking step
- `thoughtNumber` (integer): Current thought number (uses dual A1|S1 numbering)
- `totalThoughts` (integer): Estimated total thoughts needed
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `plannedActions` (array, optional): Plan tool calls for think→act→reflect workflow
- `actionResults` (array, optional): Integrate results from executed tools
- `action` (string, optional): Strategy-specific action (for ReAct, ReWOO)
- `observation` (string, optional): Strategy-specific observation
- `finalAnswer` (string, optional): Final result when thinking is complete

#### 2. `think-tools` (Action-Based Utilities)
Consolidated utilities with action-based routing.

**Parameters (6):**
- `action` (string): "connect-server" | "execute-actions" | "server-status" | "create-branch"
- `serverName` (string, optional): MCP server name for connections
- `command` (string, optional): Command to execute
- `args` (array, optional): Command arguments
- `branchId` (string, optional): Branch identifier for branching
- `branchFromThought` (number, optional): Thought number to branch from
- `thought` (string, optional): Context for branching

#### 3. `think-session-manager` (Session Operations)
Manage thinking session persistence and continuity.

**Parameters (3):**
- `action` (string): "list" | "get" | "resume"
- `sessionId` (string, optional): Specific session ID
- `limit` (number, optional): Number of sessions to return (default: 10)

### Key Features

- **Strategy Selection Prominence**: Clear choice among 10 reasoning strategies
- **Think→Act→Reflect Workflow**: Seamless integration with any available tools
- **Dual Numbering System**: Absolute (A1, A2...) and sequence-relative (S1, S2...) tracking
- **True Branching**: Create alternative reasoning paths
- **Session Continuity**: Persistent sessions with resume capability
- **MCP Integration**: Connect to other MCP servers during thinking
- **No Tool Duplication**: Clean separation of concerns across 3 focused tools

### Resources

- **documentation**: Complete tool documentation and usage examples
- **strategy-config**: Configuration for all 10 thinking strategies and their stage flows

## Usage

### When to Use Think-Strategies

The think-strategies server is designed for:
- **Complex Problem-Solving**: Break down multi-step challenges into manageable pieces
- **Strategic Analysis**: Choose the optimal reasoning approach for your specific problem type
- **Iterative Refinement**: Revise and improve your thinking as understanding deepens
- **Alternative Exploration**: Branch into different solution paths and compare approaches
- **Tool Integration**: Combine reasoning with real tool execution (think\u2192act\u2192reflect)
- **Session Continuity**: Resume and build upon previous thinking sessions

### Strategy Selection Guide

- **Linear/Chain of Thought**: Step-by-step reasoning for straightforward problems
- **ReAct**: When you need to gather information or execute actions during reasoning
- **ReWOO**: For parallel tool usage and plan-execute workflows
- **Tree of Thoughts**: When exploring multiple solution branches is valuable
- **Trilemma**: For balancing three competing objectives through satisficing
- **Self-Ask**: Break complex questions into simpler sub-questions
- **Step-Back**: When you need to establish principles before diving into specifics

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
    "think-strategies": {
      "autoApprove": ["think-strategies", "think-tools", "think-session-manager"],
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
      "autoApprove": ["think-strategies", "think-tools", "think-session-manager"],
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
      "autoApprove": ["think-strategies", "think-tools", "think-session-manager"],
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
      "autoApprove": ["think-strategies", "think-tools", "think-session-manager"],
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
