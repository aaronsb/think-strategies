// Simplified schema for testing
export default {
  thought: {
    type: "string",
    description: "Your current thinking step"
  },
  nextThoughtNeeded: {
    type: "boolean", 
    description: "Whether another thought step is needed"
  },
  thoughtNumber: {
    type: "number",
    description: "Current thought number"
  },
  totalThoughts: {
    type: "number",
    description: "Estimated total thoughts needed"
  },
  strategy: {
    type: "string",
    description: "The thinking strategy being employed"
  }
};