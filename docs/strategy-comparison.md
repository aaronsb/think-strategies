# Sequential Thinking Strategies Comparison

## Key Characteristics by Strategy

| Strategy | Linearity | External Tools | Multiple Paths | Revision/Backtracking | Unique Features |
|----------|-----------|----------------|----------------|------------------------|----------------|
| **Chain of Thought (CoT)** | Linear | No | No | No | Simple step-by-step reasoning |
| **ReAct** | Cyclic | Yes | No | Yes | Interleaves reasoning with external actions |
| **ReWOO** | Modular | Yes | No | No | Separates planning from execution; parallel tool calls |
| **Scratchpad** | Iterative | No | No | Yes | State tracking; program-like environment |
| **Self-Ask** | Hierarchical | No | No | Yes | Question decomposition; sub-question hierarchy |
| **Self-Consistency** | Parallel | No | Yes | No | Multiple reasoning paths; majority voting |
| **Step-Back** | Hierarchical | No | No | Yes | Abstract principles before specific solution |
| **Tree of Thoughts** | Branching | No | Yes | Yes | Multiple approaches with evaluation and pruning |
| **Base Sequential Thinking** | Adaptive | No | Yes | Yes | Dynamic adjustment of thought count and structure |

## Strategy Selection Guide

### When to use each strategy:

- **Chain of Thought**: Best for straightforward problems with clear sequential reasoning steps. Good for math word problems and logical deductions.

- **ReAct**: Ideal when external information is needed throughout the reasoning process. Great for tasks requiring real-time data or tool interaction.

- **ReWOO**: Optimal for efficiency when multiple external tool calls are needed. Best when token usage is a concern and planning can be separated from execution.

- **Scratchpad**: Perfect for calculations and problems requiring state tracking. Excellent for programming-like tasks and variable manipulation.

- **Self-Ask**: Best for complex questions that benefit from decomposition into simpler sub-questions. Great for multi-hop reasoning.

- **Self-Consistency**: Ideal for problems with noisy reasoning paths where consensus across multiple approaches improves accuracy. Good for mathematical reasoning.

- **Step-Back**: Best when understanding general principles helps solve a specific instance. Excellent for novel or unfamiliar problem types.

- **Tree of Thoughts**: Perfect for problems with multiple possible solution paths where evaluation and backtracking are beneficial. Great for creative tasks and puzzles.

- **Base Sequential Thinking**: Most versatile approach that adapts to problem complexity with dynamic thought adjustment, revision, and branching. Good as a fallback strategy.

## Integration with Base Protocol

Each strategy can be implemented as a specialized workflow within the Base Sequential Thinking Protocol by:

1. Constraining the available stage transitions
2. Configuring the parameter settings
3. Using strategy-specific prompt templates
4. Adding specialized metadata tracking as needed

The Base Protocol provides the infrastructure to implement any of these strategies by enabling or disabling specific capabilities like branching, revision, and dynamic thought count adjustment.
