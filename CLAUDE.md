# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SequentialThinking Plus is an MCP (Model Context Protocol) server that provides structured problem-solving through various thinking strategies. It allows AI agents to process thoughts sequentially through defined stages with visual formatting.

## Architecture

### Core Components

- **index.js**: Main MCP server implementation with stdio transport
  - `SequentialThinkingServer` class handles core thinking logic
  - `StageManager` manages strategy-specific stage transitions
  - `ThinkingSessionStorage` persists sessions to disk

- **sequential-thinking-tool-schema.js**: Zod schema defining tool parameters
  - Validates thought data structure
  - Enforces required fields and constraints

- **strategy-stages-mapping.json**: Configuration for 9 thinking strategies
  - Each strategy has stages, progressions, and revision patterns
  - Defines branching behavior and thought count limits

### Key Architectural Decisions

1. **Session Persistence**: All thinking sessions are saved to `~/Documents/thinking` (configurable via `--storage-path`)
2. **Dynamic Stage Management**: Strategies can have linear, branching, or cyclical flows
3. **Visual Formatting**: Thoughts are formatted with emojis and structured output for clarity

## Development Commands

```bash
# Install dependencies
npm install

# Run the server
npm start

# Run with custom storage path
node index.js --storage-path /custom/path

# Docker operations
./scripts/build-local.sh  # Build Docker image
./scripts/run-local.sh    # Run Docker container
```

## Working with the Code

### Adding New Strategies

1. Edit `strategy-stages-mapping.json` to define stages and progressions
2. Update schema in `sequential-thinking-tool-schema.js` if new fields needed
3. Implement strategy-specific logic in `StageManager.determineNextStage()`

### Session Management

Sessions are stored as JSON files with:
- Unique ID (UUID v4)
- Creation timestamp
- Strategy metadata
- Complete thought history

### MCP Integration

The server exposes:
- Tool: `think-strategies` 
- Resources: `documentation`, `strategy-config`
- Transport: stdio (standard input/output)

When testing changes, ensure compatibility with MCP clients by validating:
1. Tool schema matches expected format
2. Resource responses are properly formatted
3. Error messages follow MCP conventions