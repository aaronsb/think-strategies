# Sequential Thinking: Flow Engine Architecture

## Overview

The Sequential Thinking Flow Engine is the core component that enables flexible, dynamic thinking processes across different reasoning strategies. This document explains how the engine supports unfixed step numbers, branching approaches, and strategy-specific flows.

## Flow Engine Architecture

The Flow Engine is built around a stage-based transition system that allows for both structured progression and flexible adaptation based on the needs of the problem-solving process.

```mermaid
flowchart TD
    Input["Input\n(thought data)"] --> StageManager["Stage Manager"]
    StageManager --> CurrentStage["Current Stage"]
    StageManager --> Transitions["Valid Transitions"]
    
    CurrentStage --> Validator["Thought Validator"]
    Transitions --> Validator
    
    Validator --> |"Valid"| NextStage["Transition to Next Stage"]
    Validator --> |"Invalid"| Error["Error Response"]
    
    NextStage --> Output["Output\n(response data)"]
    
    style StageManager fill:#f96,stroke:#333,stroke-width:2px
    style Validator fill:#9f6,stroke:#333,stroke-width:2px
```

## Unfixed Step Numbers

The Flow Engine supports unfixed step numbers through several mechanisms:

### 1. Cyclic Stage Transitions

Many strategies include stages that can transition back to previous stages, creating cycles that allow for repeating steps as needed:

```mermaid
flowchart LR
    A["Initial Stage"] --> B["Intermediate Stage"]
    B --> C["Decision Point"]
    C -->|"Need more steps"| B
    C -->|"Complete"| D["Final Stage"]
    
    style C fill:#f96,stroke:#333,stroke-width:2px
```

For example, in the ReAct strategy:
- After observing results (observation_reception)
- The reasoning is updated (reasoning_update)
- At the evaluation checkpoint, the flow can either:
  - Return to action_planning for more actions
  - Proceed to solution_formulation when sufficient information is gathered

### 2. Dynamic Thought Count Adjustment

The engine allows for adjusting the total number of thoughts during the process:

```mermaid
flowchart TD
    T1["Thought 1\n(of 3)"] --> T2["Thought 2\n(of 3)"] --> T3["Thought 3\n(of 3)"]
    T3 --> Decision{"Need more\nthoughts?"}
    Decision -->|"Yes"| Adjust["Adjust total\nthoughts"]
    Decision -->|"No"| Final["Final response"]
    Adjust --> T4["Thought 4\n(of 5)"]
    T4 --> T5["Thought 5\n(of 5)"] --> Final
    
    style Decision fill:#f96,stroke:#333,stroke-width:2px
    style Adjust fill:#9f6,stroke:#333,stroke-width:2px
```

This is implemented through:
- The `continuation_decision` stage in multiple strategies
- Automatic adjustment of `totalThoughts` if `thoughtNumber > totalThoughts`
- The `needsMoreThoughts` parameter to explicitly signal adjustment

### 3. Strategy-Specific Iteration Points

Different strategies have specific stages designed for iteration:

| Strategy | Iteration Point | Mechanism |
|----------|----------------|-----------|
| Base Sequential | continuation_decision | Can lead back to thought_generation via thought_adjustment |
| ReAct | evaluation_checkpoint | Can cycle back to action_planning |
| Scratchpad | continuation_decision | Can return to iterative_calculation |
| Self-Ask | completion_check | Can generate more sub_question_formulation steps |
| Tree of Thoughts | continuation_decision | Can lead to more branch_development or branch_creation |

## Branching Approaches

The Flow Engine supports branching through dedicated mechanisms:

### 1. Explicit Branch Tracking

```mermaid
flowchart TD
    T1["Thought 1"] --> T2["Thought 2"]
    T2 --> T3["Thought 3"]
    T2 --> |"Branch"| B1["Branch 1\nThought 1"]
    B1 --> B2["Branch 1\nThought 2"]
    T3 --> T4["Thought 4"]
    B2 --> |"Can merge back"| T4
    T4 --> Final["Final Response"]
    
    style T2 fill:#f96,stroke:#333,stroke-width:2px
    style B1 fill:#9f6,stroke:#333,stroke-width:2px
```

This is implemented through:
- The `branches` object in the SequentialThinkingServer class
- The `branchFromThought` and `branchId` parameters in the schema
- Special handling in the `processThought` method

### 2. Strategy-Specific Branching

Some strategies are explicitly designed for branching:

#### Tree of Thoughts
```mermaid
flowchart TD
    Problem["Problem"] --> Approaches["Multiple Approaches"]
    Approaches --> B1["Branch 1"]
    Approaches --> B2["Branch 2"]
    Approaches --> B3["Branch 3"]
    B1 --> Eval["Branch Evaluation"]
    B2 --> Eval
    B3 --> Eval
    Eval --> |"Select best"| Best["Best Branch"]
    Best --> Solution["Solution"]
    
    style Approaches fill:#f96,stroke:#333,stroke-width:2px
    style Eval fill:#9f6,stroke:#333,stroke-width:2px
```

#### Self-Consistency
```mermaid
flowchart TD
    Problem["Problem"] --> Paths["Multiple Reasoning Paths"]
    Paths --> P1["Path 1"]
    Paths --> P2["Path 2"]
    Paths --> P3["Path 3"]
    P1 --> A1["Answer 1"]
    P2 --> A2["Answer 2"]
    P3 --> A3["Answer 3"]
    A1 --> Consensus["Consistency Analysis"]
    A2 --> Consensus
    A3 --> Consensus
    Consensus --> Solution["Majority Answer"]
    
    style Paths fill:#f96,stroke:#333,stroke-width:2px
    style Consensus fill:#9f6,stroke:#333,stroke-width:2px
```

### 3. Branch Creation and Selection

The flow engine supports:
- Creating branches from any thought
- Developing multiple branches in parallel
- Evaluating branches based on promise or feasibility
- Selecting the most promising branch(es) to continue

## Strategy-Specific Flow Patterns

Each strategy has its own flow pattern defined in the `stageTransitions` configuration:

### Base Sequential
```mermaid
flowchart TD
    PR["problem_reception"] --> ITP["initial_thought_planning"]
    ITP --> TG["thought_generation"]
    TG --> TE["thought_evaluation"]
    TE --> TR["thought_revision"]
    TE --> CD["continuation_decision"]
    TR --> CD
    CD --> TA["thought_adjustment"]
    CD --> BC["branch_creation"]
    CD --> HG["hypothesis_generation"]
    TA --> TG
    BC --> TG
    HG --> HV["hypothesis_verification"]
    HV --> SF["solution_finalization"]
    HV --> CD
    SF --> FR["final_response"]
    
    style CD fill:#f96,stroke:#333,stroke-width:2px
    style TA fill:#9f6,stroke:#333,stroke-width:1px
    style BC fill:#9f6,stroke:#333,stroke-width:1px
```

### Chain of Thought
```mermaid
flowchart TD
    PR["problem_reception"] --> SD["step_decomposition"]
    SD --> SR["sequential_reasoning"]
    SR --> SF["solution_formulation"]
    SF --> AV["answer_verification"]
    AV --> FR["final_response"]
    
    style SR fill:#f96,stroke:#333,stroke-width:2px
    style SF fill:#9f6,stroke:#333,stroke-width:1px
```

### ReAct
```mermaid
flowchart TD
    PR["problem_reception"] --> IR["initial_reasoning"]
    IR --> AP["action_planning"]
    AP --> AE["action_execution"]
    AE --> OR["observation_reception"]
    OR --> RU["reasoning_update"]
    RU --> EC["evaluation_checkpoint"]
    EC --> AP
    EC --> SF["solution_formulation"]
    SF --> FR["final_response"]
    
    style EC fill:#f96,stroke:#333,stroke-width:2px
    style AP fill:#9f6,stroke:#333,stroke-width:1px
```

### ReWOO
```mermaid
flowchart TD
    PR["problem_reception"] --> PP["planning_phase"]
    PP --> TCS["tool_call_specification"]
    TCS --> WP["working_phase"]
    WP --> EC["evidence_collection"]
    EC --> SP["solving_phase"]
    SP --> FR["final_response"]
    
    style PP fill:#f96,stroke:#333,stroke-width:2px
    style WP fill:#9f6,stroke:#333,stroke-width:1px
```

### Scratchpad
```mermaid
flowchart TD
    PR["problem_reception"] --> SI["scratchpad_initialization"]
    SI --> IC["iterative_calculation"]
    IC --> ST["state_tracking"]
    ST --> CD["continuation_decision"]
    CD --> IC
    CD --> RE["result_extraction"]
    RE --> FR["final_response"]
    
    style CD fill:#f96,stroke:#333,stroke-width:2px
    style IC fill:#9f6,stroke:#333,stroke-width:1px
```

### Self-Ask
```mermaid
flowchart TD
    PR["problem_reception"] --> PD["problem_decomposition"]
    PD --> SQF["sub_question_formulation"]
    SQF --> SQA["sub_question_answering"]
    SQA --> AI["answer_integration"]
    AI --> CC["completion_check"]
    CC --> SQF
    CC --> SF["solution_formulation"]
    SF --> FR["final_response"]
    
    style CC fill:#f96,stroke:#333,stroke-width:2px
    style SQF fill:#9f6,stroke:#333,stroke-width:1px
```

### Self-Consistency
```mermaid
flowchart TD
    PR["problem_reception"] --> MPS["multiple_path_sampling"]
    MPS --> RPE["reasoning_path_execution"]
    RPE --> AC["answer_collection"]
    AC --> CA["consistency_analysis"]
    CA --> MS["majority_selection"]
    MS --> FR["final_response"]
    
    style RPE fill:#f96,stroke:#333,stroke-width:2px
    style CA fill:#9f6,stroke:#333,stroke-width:1px
```

### Step-Back
```mermaid
flowchart TD
    PR["problem_reception"] --> AB["abstraction"]
    AB --> PI["principle_identification"]
    PI --> AS["approach_selection"]
    AS --> SA["specific_application"]
    SA --> SBS["step_by_step_solution"]
    SBS --> SV["solution_verification"]
    SV --> FR["final_response"]
    
    style PI fill:#f96,stroke:#333,stroke-width:2px
    style SBS fill:#9f6,stroke:#333,stroke-width:1px
```

### Tree of Thoughts
```mermaid
flowchart TD
    PR["problem_reception"] --> AE["approach_exploration"]
    AE --> BC["branch_creation"]
    BC --> BD["branch_development"]
    BD --> BE["branch_evaluation"]
    BE --> BS["branch_selection"]
    BS --> CD["continuation_decision"]
    CD --> BD
    CD --> BC
    CD --> SF["solution_formulation"]
    SF --> PJ["path_justification"]
    PJ --> FR["final_response"]
    
    style CD fill:#f96,stroke:#333,stroke-width:2px
    style BD fill:#9f6,stroke:#333,stroke-width:1px
    style BC fill:#9f6,stroke:#333,stroke-width:1px
```

## Implementation Details

### Stage Manager

The `StageManager` class is responsible for:
- Tracking the current stage
- Validating stage transitions
- Providing stage-specific prompts and required parameters

```javascript
class StageManager {
    constructor(strategy) {
        this.strategy = strategy;
        this.stages = strategyConfig.strategyStages[strategy] || [];
        this.transitions = strategyConfig.stageTransitions[strategy] || {};
        this.descriptions = strategyConfig.stageDescriptions || {};
        this.currentStage = this.stages[0] || null;
        this.stageHistory = [];
    }

    // Gets valid next stages from the current stage
    getNextStages() {
        return this.transitions[this.currentStage] || [];
    }

    // Validates if a transition is allowed
    canTransitionTo(nextStage) {
        const validNextStages = this.getNextStages();
        return validNextStages.includes(nextStage);
    }

    // Performs the transition if valid
    transitionTo(nextStage) {
        if (!this.canTransitionTo(nextStage)) {
            throw new Error(`Invalid transition from ${this.currentStage} to ${nextStage}`);
        }
        this.stageHistory.push(this.currentStage);
        this.currentStage = nextStage;
        return this.currentStage;
    }
}
```

### Stage Transitions Configuration

The stage transitions are defined in the `stageTransitions` object in the strategy-stages-mapping.json file:

```json
"stageTransitions": {
  "linear": {
    "problem_reception": ["initial_thought_planning"],
    "initial_thought_planning": ["thought_generation"],
    "thought_generation": ["thought_evaluation"],
    "thought_evaluation": ["thought_revision", "continuation_decision"],
    "thought_revision": ["continuation_decision"],
    "continuation_decision": ["thought_adjustment", "branch_creation", "hypothesis_generation"],
    "thought_adjustment": ["thought_generation"],
    "branch_creation": ["thought_generation"],
    "hypothesis_generation": ["hypothesis_verification"],
    "hypothesis_verification": ["solution_finalization", "continuation_decision"],
    "solution_finalization": ["final_response"],
    "final_response": []
  },
  // Other strategies...
}
```

This configuration defines which stages can follow the current stage, enabling:
- Linear progression (single next stage)
- Decision points (multiple possible next stages)
- Cycles (transitions back to previous stages)
- Branching (transitions to different paths)

## Practical Examples

### Example 1: ReAct Cyclic Flow

```mermaid
sequenceDiagram
    participant LLM
    participant Flow as Flow Engine
    
    LLM->>Flow: Initial reasoning
    Flow-->>LLM: Current stage: initial_reasoning
    LLM->>Flow: Action planning (search for X)
    Flow-->>LLM: Current stage: action_planning
    LLM->>Flow: Action execution
    Flow-->>LLM: Current stage: action_execution
    LLM->>Flow: Observation reception
    Flow-->>LLM: Current stage: observation_reception
    LLM->>Flow: Reasoning update
    Flow-->>LLM: Current stage: reasoning_update
    LLM->>Flow: Evaluation checkpoint (need more info)
    Flow-->>LLM: Current stage: evaluation_checkpoint
    LLM->>Flow: Action planning (search for Y)
    Flow-->>LLM: Current stage: action_planning (cycle back)
    LLM->>Flow: Action execution
    Flow-->>LLM: Current stage: action_execution
    LLM->>Flow: Observation reception
    Flow-->>LLM: Current stage: observation_reception
    LLM->>Flow: Reasoning update
    Flow-->>LLM: Current stage: reasoning_update
    LLM->>Flow: Evaluation checkpoint (sufficient info)
    Flow-->>LLM: Current stage: evaluation_checkpoint
    LLM->>Flow: Solution formulation
    Flow-->>LLM: Current stage: solution_formulation
    LLM->>Flow: Final response
    Flow-->>LLM: Current stage: final_response
```

### Example 2: Tree of Thoughts Branching

```mermaid
sequenceDiagram
    participant LLM
    participant Flow as Flow Engine
    
    LLM->>Flow: Problem reception
    Flow-->>LLM: Current stage: problem_reception
    LLM->>Flow: Approach exploration (3 approaches)
    Flow-->>LLM: Current stage: approach_exploration
    LLM->>Flow: Branch creation (Approach A)
    Flow-->>LLM: Current stage: branch_creation
    LLM->>Flow: Branch development (Step 1 for A)
    Flow-->>LLM: Current stage: branch_development
    LLM->>Flow: Branch evaluation (A looks promising)
    Flow-->>LLM: Current stage: branch_evaluation
    LLM->>Flow: Branch selection (select A)
    Flow-->>LLM: Current stage: branch_selection
    LLM->>Flow: Continuation decision (explore more branches)
    Flow-->>LLM: Current stage: continuation_decision
    LLM->>Flow: Branch creation (Approach B)
    Flow-->>LLM: Current stage: branch_creation
    LLM->>Flow: Branch development (Step 1 for B)
    Flow-->>LLM: Current stage: branch_development
    LLM->>Flow: Branch evaluation (B less promising)
    Flow-->>LLM: Current stage: branch_evaluation
    LLM->>Flow: Branch selection (stay with A)
    Flow-->>LLM: Current stage: branch_selection
    LLM->>Flow: Continuation decision (develop A further)
    Flow-->>LLM: Current stage: continuation_decision
    LLM->>Flow: Branch development (Step 2 for A)
    Flow-->>LLM: Current stage: branch_development
    LLM->>Flow: Branch evaluation (A still promising)
    Flow-->>LLM: Current stage: branch_evaluation
    LLM->>Flow: Branch selection (finalize A)
    Flow-->>LLM: Current stage: branch_selection
    LLM->>Flow: Continuation decision (sufficient exploration)
    Flow-->>LLM: Current stage: continuation_decision
    LLM->>Flow: Solution formulation (based on A)
    Flow-->>LLM: Current stage: solution_formulation
    LLM->>Flow: Path justification (why A was best)
    Flow-->>LLM: Current stage: path_justification
    LLM->>Flow: Final response
    Flow-->>LLM: Current stage: final_response
```

## Conclusion

The Sequential Thinking Flow Engine provides a flexible framework that supports:

1. **Unfixed Step Numbers**:
   - Through cyclic stage transitions
   - Dynamic thought count adjustment
   - Strategy-specific iteration points

2. **Branching Approaches**:
   - Explicit branch tracking
   - Strategy-specific branching mechanisms
   - Branch creation, development, and selection

3. **Strategy-Specific Flows**:
   - Each strategy has its own defined flow pattern
   - Customized stage transitions for different reasoning approaches
   - Specialized stages for different problem-solving techniques

This flexibility allows the Sequential Thinking tool to adapt to a wide range of problem types and complexity levels, making it a powerful framework for structured, dynamic problem-solving.
