# Sequential Thinking: Technical Documentation

## Overview

Sequential Thinking is a Model Context Protocol (MCP) server that facilitates structured, step-by-step problem-solving through a dynamic thinking process. This documentation explains the architecture, sequence flow, and key mechanisms of the tool.

## Architecture

The Sequential Thinking server is built on the MCP framework, providing a specialized tool for breaking down complex problems into manageable steps while allowing for revisions, branching, and dynamic adjustment of the thinking process. The server also includes persistent storage for completed thinking sessions.

```mermaid
flowchart TB
    subgraph "MCP Framework"
        Server["MCP Server"]
        Transport["StdioServerTransport"]
        Handlers["Request Handlers"]
    end
    
    subgraph "Sequential Thinking Implementation"
        STServer["SequentialThinkingServer"]
        ThoughtHistory["Thought History"]
        Branches["Branches"]
        Formatter["Thought Formatter"]
        Validator["Thought Validator"]
        Storage["Session Storage"]
    end
    
    subgraph "File System"
        SessionFiles["Session Files"]
    end
    
    Client["Client (LLM)"]
    
    Client <--> Transport
    Transport <--> Server
    Server <--> Handlers
    Handlers <--> STServer
    STServer --> ThoughtHistory
    STServer --> Branches
    STServer --> Formatter
    STServer --> Validator
    STServer --> Storage
    Storage <--> SessionFiles
    
    style STServer fill:#f9f,stroke:#333,stroke-width:2px
    style ThoughtHistory fill:#bbf,stroke:#333,stroke-width:1px
    style Branches fill:#bbf,stroke:#333,stroke-width:1px
    style Storage fill:#9bf,stroke:#333,stroke-width:2px
    style SessionFiles fill:#9f9,stroke:#333,stroke-width:1px
```

## Core Components

### SequentialThinkingServer

The main class that manages the thought process, including:
- Tracking thought history
- Managing branches
- Validating input
- Formatting output

### MCP Integration

The server integrates with the MCP framework through:
- Tool definition (`sequentialthinking`)
- Resource provision (`sequentialthinking://documentation`)
- Request handlers for tool calls and resource access

## Thought Processing Sequence

The following diagram illustrates the sequence of processing a thought:

```mermaid
sequenceDiagram
    participant Client as Client (LLM)
    participant MCP as MCP Server
    participant ST as SequentialThinkingServer
    participant Console as Console Output
    
    Client->>MCP: Call sequentialthinking tool
    MCP->>ST: processThought(input)
    ST->>ST: validateThoughtData(input)
    
    alt Invalid Input
        ST-->>MCP: Return error
        MCP-->>Client: Error response
    else Valid Input
        ST->>ST: Add to thoughtHistory
        
        alt Has Branch Information
            ST->>ST: Update branches
        end
        
        ST->>ST: formatThought(validatedInput)
        ST->>Console: Display formatted thought
        ST-->>MCP: Return thought status
        MCP-->>Client: Thought status response
    end
```

## Thought Data Flow

The following diagram shows how thought data flows through the system:

```mermaid
flowchart LR
    Input["Input\n(thought data)"] --> Validator["Validator"]
    
    Validator --> |"Valid"| History["Thought History"]
    Validator --> |"Valid + Branch"| Branches["Branches"]
    Validator --> |"Invalid"| Error["Error Response"]
    
    History --> Formatter["Formatter"]
    Branches --> Formatter
    
    Formatter --> Console["Console Output"]
    Formatter --> Response["Response to Client"]
    
    style Validator fill:#f96,stroke:#333,stroke-width:2px
    style Formatter fill:#9f6,stroke:#333,stroke-width:2px
```

## Thought Types and Transitions

The Sequential Thinking tool supports different types of thoughts and transitions between them:

```mermaid
stateDiagram-v2
    [*] --> Regular: Initial thought
    
    state "Regular Thought" as Regular
    state "Revision Thought" as Revision
    state "Branch Thought" as Branch
    state "Final Thought" as Final
    
    Regular --> Regular: Next thought
    Regular --> Revision: Revise previous thought
    Regular --> Branch: Create alternative path
    Regular --> Final: Complete thinking
    
    Revision --> Regular: Continue main path
    Revision --> Revision: Further revision
    Revision --> Branch: Branch after revision
    Revision --> Final: Complete after revision
    
    Branch --> Branch: Continue branch
    Branch --> Regular: Return to main path
    Branch --> Revision: Revise within branch
    Branch --> Final: Complete from branch
    
    Final --> [*]: nextThoughtNeeded = false
    Final --> Regular: needsMoreThoughts = true
```

## Thought Formatting

Each thought is formatted for display with visual indicators for its type:

```mermaid
flowchart TD
    Input["Thought Data"] --> TypeCheck{"Check\nThought Type"}
    
    TypeCheck -->|"Regular"| RegularFormat["Format as Regular\n💭 Thought"]
    TypeCheck -->|"Revision"| RevisionFormat["Format as Revision\n🔄 Revision"]
    TypeCheck -->|"Branch"| BranchFormat["Format as Branch\n🌿 Branch"]
    
    RegularFormat --> Border["Add Borders"]
    RevisionFormat --> Border
    BranchFormat --> Border
    
    Border --> Display["Display in Console"]
```

## Key Parameters

The tool accepts several parameters that control the thinking process:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| thought | string | Yes | The current thinking step |
| nextThoughtNeeded | boolean | Yes | Whether another thought step is needed |
| thoughtNumber | integer | Yes | Current thought number |
| totalThoughts | integer | Yes | Estimated total thoughts needed |
| isRevision | boolean | No | Whether this revises previous thinking |
| revisesThought | integer | No | Which thought is being reconsidered |
| branchFromThought | integer | No | Branching point thought number |
| branchId | string | No | Branch identifier |
| needsMoreThoughts | boolean | No | If more thoughts are needed |

## Usage Patterns

### Basic Linear Thinking

```mermaid
flowchart LR
    T1["Thought 1"] --> T2["Thought 2"] --> T3["Thought 3"] --> T4["Thought 4\n(Final)"]
    
    style T4 fill:#9f9,stroke:#333,stroke-width:2px
```

### Thinking with Revision

```mermaid
flowchart LR
    T1["Thought 1"] --> T2["Thought 2"] --> T3["Thought 3"]
    T3 --> |"Revise"| R2["Revision of\nThought 2"] --> T4["Thought 4"] --> T5["Thought 5\n(Final)"]
    
    style R2 fill:#ff9,stroke:#333,stroke-width:2px
    style T5 fill:#9f9,stroke:#333,stroke-width:2px
```

### Thinking with Branching

```mermaid
flowchart LR
    T1["Thought 1"] --> T2["Thought 2"]
    T2 --> T3["Thought 3"]
    T2 --> |"Branch"| B1["Branch 1\nThought 1"] --> B2["Branch 1\nThought 2"]
    T3 --> T4["Thought 4\n(Final)"]
    
    style B1 fill:#f9f,stroke:#333,stroke-width:2px
    style B2 fill:#f9f,stroke:#333,stroke-width:2px
    style T4 fill:#9f9,stroke:#333,stroke-width:2px
```

### Dynamic Adjustment of Total Thoughts

```mermaid
flowchart LR
    T1["Thought 1\n(of 3)"] --> T2["Thought 2\n(of 3)"] --> T3["Thought 3\n(of 3)"]
    T3 --> |"Need more\nthoughts"| T4["Thought 4\n(of 5)"] --> T5["Thought 5\n(of 5)\n(Final)"]
    
    style T3 fill:#ff9,stroke:#333,stroke-width:2px
    style T5 fill:#9f9,stroke:#333,stroke-width:2px
```

## Implementation Details

### Thought Validation

The `validateThoughtData` method ensures that all required parameters are present and of the correct type:

```mermaid
flowchart TD
    Input["Input Data"] --> CheckThought{"Check\nthought"}
    CheckThought -->|"Invalid"| ThoughtError["Throw Error:\nInvalid thought"]
    CheckThought -->|"Valid"| CheckNumber{"Check\nthoughtNumber"}
    
    CheckNumber -->|"Invalid"| NumberError["Throw Error:\nInvalid thoughtNumber"]
    CheckNumber -->|"Valid"| CheckTotal{"Check\ntotalThoughts"}
    
    CheckTotal -->|"Invalid"| TotalError["Throw Error:\nInvalid totalThoughts"]
    CheckTotal -->|"Valid"| CheckNext{"Check\nnextThoughtNeeded"}
    
    CheckNext -->|"Invalid"| NextError["Throw Error:\nInvalid nextThoughtNeeded"]
    CheckNext -->|"Valid"| Return["Return Validated Data"]
    
    style Return fill:#9f9,stroke:#333,stroke-width:2px
```

### Thought Formatting

The `formatThought` method creates a visually distinct representation of each thought:

```mermaid
flowchart TD
    Input["Thought Data"] --> TypeCheck{"Check\nThought Type"}
    
    TypeCheck -->|"isRevision=true"| RevisionPrefix["Set Prefix:\n🔄 Revision"]
    TypeCheck -->|"branchFromThought exists"| BranchPrefix["Set Prefix:\n🌿 Branch"]
    TypeCheck -->|"Regular Thought"| RegularPrefix["Set Prefix:\n💭 Thought"]
    
    RevisionPrefix --> CreateHeader["Create Header with\nThought Number and Context"]
    BranchPrefix --> CreateHeader
    RegularPrefix --> CreateHeader
    
    CreateHeader --> CreateBorder["Create Border\nBased on Content Length"]
    CreateBorder --> FormatOutput["Format Output with\nHeader, Border, and Content"]
    FormatOutput --> Return["Return Formatted Thought"]
    
    style Return fill:#9f9,stroke:#333,stroke-width:2px
```

## Integration with MCP

The Sequential Thinking tool integrates with the MCP framework through:

```mermaid
flowchart TD
    Server["MCP Server"] --> ListTools["List Tools Handler"]
    Server --> CallTool["Call Tool Handler"]
    Server --> ListResources["List Resources Handler"]
    Server --> ReadResource["Read Resource Handler"]
    
    ListTools --> ToolDef["Sequential Thinking\nTool Definition"]
    CallTool --> ProcessThought["Process Thought\nMethod"]
    ListResources --> ResourceList["Documentation\nResource"]
    ReadResource --> DocContent["Documentation\nContent"]
    
    ProcessThought --> ThinkingServer["Sequential Thinking\nServer Instance"]
    
    style ThinkingServer fill:#f9f,stroke:#333,stroke-width:2px
```

## Session Storage

The Sequential Thinking tool now includes persistent storage for completed thinking sessions. When a thinking session is completed (when `nextThoughtNeeded` is set to `false`), the entire session, including all thoughts and branches, is automatically saved to disk.

### Storage Configuration

The storage location is configurable via command-line arguments:

```bash
# Default storage location (~/Documents/thinking/)
npx sequentialthinking-plus

# Custom storage location
npx sequentialthinking-plus --storage-path /path/to/custom/storage
# or
npx sequentialthinking-plus -s /path/to/custom/storage
```

### Session Data Structure

Each session is stored in its own directory with a unique session ID based on the timestamp. The session data is saved as a JSON file with the following structure:

```json
{
  "id": "session-20250428-145302",
  "timestamp": "2025-04-28T14:53:02.123Z",
  "thoughtHistory": [
    {
      "thought": "First thought content",
      "thoughtNumber": 1,
      "totalThoughts": 3,
      "nextThoughtNeeded": true,
      "isRevision": false
    },
    {
      "thought": "Second thought content",
      "thoughtNumber": 2,
      "totalThoughts": 3,
      "nextThoughtNeeded": true,
      "isRevision": false
    },
    {
      "thought": "Final thought content",
      "thoughtNumber": 3,
      "totalThoughts": 3,
      "nextThoughtNeeded": false,
      "isRevision": false
    }
  ],
  "branches": {
    "branch-1": [
      {
        "thought": "Alternative approach",
        "thoughtNumber": 1,
        "totalThoughts": 2,
        "nextThoughtNeeded": true,
        "branchFromThought": 2,
        "branchId": "branch-1"
      }
    ]
  }
}
```

### Storage Flow

```mermaid
sequenceDiagram
    participant Client as Client (LLM)
    participant ST as SequentialThinkingServer
    participant Storage as ThinkingSessionStorage
    participant FS as File System
    
    Client->>ST: Final thought (nextThoughtNeeded: false)
    ST->>ST: Process thought
    ST->>Storage: saveSession(sessionId, thoughtHistory, branches)
    Storage->>FS: Create session directory
    Storage->>FS: Write session.json
    Storage-->>ST: Return saved file path
    ST->>Client: Return thought status with sessionSaved: true
```

## Conclusion

The Sequential Thinking tool provides a powerful framework for structured problem-solving that can adapt to the complexity of the problem at hand. By supporting revisions, branching, dynamic adjustment of the thinking process, and persistent storage of completed sessions, it enables more effective, flexible, and reusable reasoning.
