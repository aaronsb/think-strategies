server.tool(
  "sequentialthinking",
  "A tool for dynamic and reflective problem-solving through structured thoughts using various reasoning strategies.",
  {
    // Core properties from original schema
    thought: z.string().describe("Your current thinking step"),
    nextThoughtNeeded: z.boolean().describe("Whether another thought step is needed"),
    thoughtNumber: z.number().int().min(1).describe("Current thought number"),
    totalThoughts: z.number().int().min(1).describe("Estimated total thoughts needed"),
    isRevision: z.boolean().optional().describe("Whether this revises previous thinking"),
    revisesThought: z.number().int().min(1).optional().describe("Which thought is being reconsidered"),
    branchFromThought: z.number().int().min(1).optional().describe("Branching point thought number"),
    branchId: z.string().optional().describe("Branch identifier"),
    needsMoreThoughts: z.boolean().optional().describe("If more thoughts are needed"),
    
    // Strategy selection and metadata
    strategy: z.enum([
      "base_sequential", 
      "chain_of_thought", 
      "react", 
      "rewoo",
      "scratchpad", 
      "self_ask", 
      "self_consistency", 
      "step_back", 
      "tree_of_thoughts"
    ]).describe("The thinking strategy being employed"),
    
    currentStage: z.string().describe("Current stage in the thinking process flow"),
    
    // Strategy-specific properties
    
    // ReAct properties
    action: z.string().optional().describe("Specific action to take for gathering information (ReAct)"),
    observation: z.string().optional().describe("Result or observation from executing an action (ReAct)"),
    
    // ReWOO properties
    planningPhase: z.boolean().optional().describe("Whether currently in planning phase (ReWOO)"),
    toolCalls: z.array(z.object({
      tool: z.string(),
      input: z.string()
    })).optional().describe("Planned tool calls with inputs (ReWOO)"),
    
    // Scratchpad properties
    stateVariables: z.record(z.any()).optional().describe("Current state of variables being tracked (Scratchpad)"),
    
    // Self-Ask properties
    subQuestion: z.string().optional().describe("Current sub-question being addressed (Self-Ask)"),
    subQuestionAnswer: z.string().optional().describe("Answer to the current sub-question (Self-Ask)"),
    subQuestionNumber: z.number().int().min(1).optional().describe("Current sub-question number (Self-Ask)"),
    
    // Self-Consistency properties
    reasoningPathId: z.string().optional().describe("Identifier for current reasoning path (Self-Consistency)"),
    pathAnswers: z.array(z.object({
      pathId: z.string(),
      answer: z.string()
    })).optional().describe("Answers from different reasoning paths (Self-Consistency)"),
    
    // Step-Back properties
    generalPrinciple: z.string().optional().describe("General principle or approach identified (Step-Back)"),
    
    // Tree of Thoughts properties
    approachId: z.string().optional().describe("Identifier for current approach (ToT)"),
    approaches: z.array(z.object({
      id: z.string(),
      description: z.string(),
      promise: z.number().min(0).max(10).optional()
    })).optional().describe("Different approaches being explored (ToT)"),
    evaluationScore: z.number().min(0).max(10).optional().describe("Evaluation score for current branch (ToT)"),
    
    // Verification and solution properties
    hypothesis: z.string().optional().describe("Current solution hypothesis"),
    verificationResult: z.boolean().optional().describe("Whether the hypothesis has been verified"),
    verificationReasoning: z.string().optional().describe("Reasoning behind verification result"),
    finalAnswer: z.string().optional().describe("Final verified answer to the problem")
  },
  async (args) => {
    const result = await thinkingServer.processThought(args);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);
