// Plain object schema for MCP SDK
export default {
  type: "object",
  properties: {
    // Core properties from original schema
    thought: {
      type: "string",
      description: "Your current thinking step"
    },
    nextThoughtNeeded: {
      type: "boolean",
      description: "Whether another thought step is needed"
    },
    thoughtNumber: {
      type: "integer",
      minimum: 1,
      description: "Current thought number"
    },
    totalThoughts: {
      type: "integer",
      minimum: 1,
      description: "Estimated total thoughts needed"
    },
    isRevision: {
      type: "boolean",
      description: "Whether this revises previous thinking"
    },
    revisesThought: {
      type: "integer",
      minimum: 1,
      description: "Which thought is being reconsidered"
    },
    branchFromThought: {
      type: "integer",
      minimum: 1,
      description: "Branching point thought number"
    },
    branchId: {
      type: "string",
      description: "Branch identifier"
    },
    needsMoreThoughts: {
      type: "boolean",
      description: "If more thoughts are needed"
    },
    
    // Strategy selection and metadata
    strategy: {
      type: "string",
      enum: [
        "linear", 
        "chain_of_thought", 
        "react", 
        "rewoo",
        "scratchpad", 
        "self_ask", 
        "self_consistency", 
        "step_back", 
        "tree_of_thoughts"
      ],
      description: "The thinking strategy being employed"
    },
    
    currentStage: {
      type: "string",
      description: "Current stage in the thinking process flow"
    },
    
    // Strategy-specific properties
    
    // ReAct properties
    action: {
      type: "string",
      description: "Specific action to take for gathering information (ReAct)"
    },
    observation: {
      type: "string",
      description: "Result or observation from executing an action (ReAct)"
    },
    
    // ReWOO properties
    planningPhase: {
      type: "boolean",
      description: "Whether currently in planning phase (ReWOO)"
    },
    toolCalls: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tool: { type: "string" },
          input: { type: "string" }
        },
        required: ["tool", "input"]
      },
      description: "Planned tool calls with inputs (ReWOO)"
    },
    
    // Scratchpad properties
    stateVariables: {
      type: "object",
      description: "Current state of variables being tracked (Scratchpad)"
    },
    
    // Self-Ask properties
    subQuestion: {
      type: "string",
      description: "Current sub-question being addressed (Self-Ask)"
    },
    subQuestionAnswer: {
      type: "string",
      description: "Answer to the current sub-question (Self-Ask)"
    },
    subQuestionNumber: {
      type: "integer",
      minimum: 1,
      description: "Current sub-question number (Self-Ask)"
    },
    
    // Self-Consistency properties
    reasoningPathId: {
      type: "string",
      description: "Identifier for current reasoning path (Self-Consistency)"
    },
    pathAnswers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pathId: { type: "string" },
          answer: { type: "string" }
        },
        required: ["pathId", "answer"]
      },
      description: "Answers from different reasoning paths (Self-Consistency)"
    },
    
    // Step-Back properties
    generalPrinciple: {
      type: "string",
      description: "General principle or approach identified (Step-Back)"
    },
    
    // Tree of Thoughts properties
    approachId: {
      type: "string",
      description: "Identifier for current approach (ToT)"
    },
    approaches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          promise: { 
            type: "number",
            minimum: 0,
            maximum: 10
          }
        },
        required: ["id", "description"]
      },
      description: "Different approaches being explored (ToT)"
    },
    evaluationScore: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description: "Evaluation score for current branch (ToT)"
    },
    
    // Verification and solution properties
    hypothesis: {
      type: "string",
      description: "Current solution hypothesis"
    },
    verificationResult: {
      type: "boolean",
      description: "Whether the hypothesis has been verified"
    },
    verificationReasoning: {
      type: "string",
      description: "Reasoning behind verification result"
    },
    finalAnswer: {
      type: "string",
      description: "Final verified answer to the problem"
    },
    
    // Semantic routing properties
    currentState: {
      type: "string",
      description: "Current state in the thinking flow"
    },
    stateDescription: {
      type: "string",
      description: "Description of the current state"
    },
    sessionToken: {
      type: "string",
      description: "Session identifier token"
    },
    availableActions: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          description: { type: "string" },
          requiredInputs: {
            type: "array",
            items: { type: "string" }
          },
          optionalInputs: {
            type: "array",
            items: { type: "string" }
          },
          hints: {
            type: "object",
            additionalProperties: { type: "string" }
          },
          nextState: { type: "string" },
          isGlobal: { type: "boolean" }
        },
        required: ["description"]
      },
      description: "Available actions with semantic hints"
    },
    canSwitchStrategy: {
      type: "boolean",
      description: "Whether strategy switching is allowed from current state"
    }
  },
  required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts", "strategy"]
};