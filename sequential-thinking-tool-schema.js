import { z } from "zod";

// Export the schema for use in index.js
export default z.object({
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
    "linear", 
    "chain_of_thought", 
    "react", 
    "rewoo",
    "scratchpad", 
    "self_ask", 
    "self_consistency", 
    "step_back", 
    "tree_of_thoughts",
    "trilemma",
    "cyclic_reasoning"
  ]).describe("The thinking strategy being employed"),
  
  currentStage: z.string().optional().describe("Current stage in the thinking process flow"),
  
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
  
  // Trilemma properties
  objectives: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    currentScore: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
    priority: z.number().min(0).max(1).optional()
  })).optional().describe("Three competing objectives with scores and thresholds (Trilemma)"),
  tradeOffMatrix: z.array(z.object({
    improving: z.string(),
    affecting: z.string(),
    impact: z.number().min(-1).max(1)
  })).optional().describe("How improving one objective affects others (Trilemma)"),
  iterationNumber: z.number().int().min(1).optional().describe("Current iteration in the satisficing process (Trilemma)"),
  equilibriumReached: z.boolean().optional().describe("Whether all objectives meet their thresholds (Trilemma)"),
  propagatedSolution: z.object({
    configuration: z.record(z.number()),
    overallScore: z.number().min(0).max(1)
  }).optional().describe("Solution propagated from previous iteration (Trilemma)"),
  
  // Cyclic Reasoning properties
  reasoningApproach: z.enum([
    "thought-first",
    "question-first", 
    "solution-first"
  ]).optional().describe("The cyclic reasoning approach being used (Cyclic Reasoning)"),
  currentElement: z.enum([
    "thought",
    "question",
    "solution"
  ]).optional().describe("Current element in the reasoning cycle (Cyclic Reasoning)"),
  cycleNumber: z.number().int().min(1).optional().describe("Current cycle number (Cyclic Reasoning)"),
  elementOrder: z.array(z.string()).optional().describe("Order of elements for current approach (Cyclic Reasoning)"),
  domainContext: z.string().optional().describe("Problem domain for approach selection (Cyclic Reasoning)"),
  approachRationale: z.string().optional().describe("Reason for selecting this approach (Cyclic Reasoning)"),
  cycleComplete: z.boolean().optional().describe("Whether the current cycle is complete (Cyclic Reasoning)"),
  needsApproachAdjustment: z.boolean().optional().describe("Whether to switch reasoning approaches (Cyclic Reasoning)"),
  
  // Verification and solution properties
  hypothesis: z.string().optional().describe("Current solution hypothesis"),
  verificationResult: z.boolean().optional().describe("Whether the hypothesis has been verified"),
  verificationReasoning: z.string().optional().describe("Reasoning behind verification result"),
  finalAnswer: z.string().optional().describe("Final verified answer to the problem"),
  
  // Semantic routing properties
  currentState: z.string().optional().describe("Current state in the thinking flow"),
  stateDescription: z.string().optional().describe("Description of the current state"),
  sessionToken: z.string().optional().describe("Session identifier token"),
  availableActions: z.record(z.object({
    description: z.string(),
    requiredInputs: z.array(z.string()).optional(),
    optionalInputs: z.array(z.string()).optional(),
    hints: z.record(z.string()).optional(),
    nextState: z.string().optional(),
    isGlobal: z.boolean().optional()
  })).optional().describe("Available actions with semantic hints"),
  canSwitchStrategy: z.boolean().optional().describe("Whether strategy switching is allowed from current state")
});
