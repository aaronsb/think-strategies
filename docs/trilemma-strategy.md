# Trilemma Strategy Guide

## Overview

The trilemma strategy is designed for situations where you need to balance three competing objectives that cannot all be maximized simultaneously. Unlike optimization problems that seek a single best solution, trilemma problems require finding a satisficing balance - a "good enough" solution that meets minimum thresholds across all three objectives.

## When to Use Trilemma

Use the trilemma strategy when:
- You face three distinct objectives that conflict with each other
- Improving one objective necessarily reduces performance on others
- You need to find an acceptable balance rather than maximize any single metric
- The problem involves real-world trade-offs where perfection is impossible
- You want to explore how different weightings affect the overall solution

## How It Works

### 1. **Trilemma Identification**
First, clearly identify the three competing objectives. Each should be:
- Measurable (can assign a score from 0 to 1)
- Conflicting (improving one affects others negatively)
- Essential (all three must be considered)

### 2. **Objective Initialization**
Set up each objective with:
- **Name**: Clear, concise identifier
- **Description**: What this objective represents
- **Threshold**: Minimum acceptable score (0-1)
- **Priority** (optional): Relative importance weighting

### 3. **Trade-off Evaluation**
Create a trade-off matrix showing how improving each objective affects the others:
- Impact values range from -1 (strong negative) to +1 (positive)
- This helps predict consequences of adjustments

### 4. **Iterative Satisficing**
Through multiple iterations:
- Adjust the solution to improve underperforming objectives
- Monitor impacts on other objectives
- Seek configurations where all objectives meet their thresholds

### 5. **Equilibrium Check**
After each iteration, check if:
- All objectives meet their minimum thresholds
- Further improvements would violate other thresholds
- The solution is stable and sustainable

### 6. **Solution Propagation**
Successful configurations can be:
- Propagated to the next iteration as a starting point
- Refined based on accumulated insights
- Used to explore nearby solution spaces

## Example Use Cases

### 1. **Project Management Trilemma**
Balance between:
- **Speed**: Complete the project quickly
- **Quality**: Deliver high-quality results
- **Cost**: Stay within budget

```javascript
objectives: [
  {
    id: "speed",
    name: "Project Speed",
    description: "Time to completion",
    currentScore: 0.7,
    threshold: 0.6,
    priority: 0.4
  },
  {
    id: "quality",
    name: "Deliverable Quality",
    description: "Quality of final product",
    currentScore: 0.5,
    threshold: 0.7,
    priority: 0.4
  },
  {
    id: "cost",
    name: "Budget Efficiency",
    description: "Cost effectiveness",
    currentScore: 0.8,
    threshold: 0.5,
    priority: 0.2
  }
]
```

### 2. **System Design Trilemma**
Balance between:
- **Performance**: Fast response times
- **Scalability**: Handle growing load
- **Maintainability**: Easy to update and debug

### 3. **Environmental Policy Trilemma**
Balance between:
- **Economic Growth**: Support business and employment
- **Environmental Protection**: Minimize ecological impact
- **Social Equity**: Ensure fair distribution of benefits

## Integration with Think Strategies

The trilemma strategy works well when:
- Called directly when you recognize a three-way trade-off
- Combined with **step_back** to first identify the competing objectives
- Followed by **chain_of_thought** to implement the chosen balance
- Used with **self_consistency** to validate the solution from multiple perspectives

## Best Practices

1. **Clear Metrics**: Define measurable scores for each objective
2. **Realistic Thresholds**: Set achievable minimum requirements
3. **Document Trade-offs**: Explicitly state how objectives interact
4. **Multiple Iterations**: Don't expect to find balance immediately
5. **Flexible Priorities**: Be willing to adjust weightings based on context

## Example Workflow

```
1. Start with trilemma strategy
2. Identify three competing objectives
3. Set thresholds (e.g., 0.6, 0.7, 0.5)
4. Evaluate current state (e.g., 0.8, 0.4, 0.9)
5. Notice quality (0.4) is below threshold (0.7)
6. Explore adjustments that improve quality
7. Check impacts on speed and cost
8. Iterate until all thresholds are met
9. Document the final balance and reasoning
```

The trilemma strategy provides a structured approach to navigating complex trade-offs, acknowledging that real-world problems often require satisficing rather than optimizing.