#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs-extra';
import path from 'path-browserify';
import { homedir } from 'os';
import chalk from 'chalk';

// Parse command line arguments
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
    .option('storage-path', {
        alias: 's',
        type: 'string',
        description: 'Path to store thinking sessions',
        default: path.join(homedir(), 'Documents', 'thinking')
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .parse();

// Ensure storage directory exists
const storagePath = argv['storage-path'];
fs.ensureDirSync(storagePath);
console.error(`Thinking sessions will be stored in: ${storagePath}`);

// Sequential Thinking implementation
class SequentialThinkingServer {
    thoughtHistory = [];
    branches = {};
    sessionId = null;
    storage = null;
    
    constructor(storage) {
        this.storage = storage;
        this.resetSession();
    }
    
    resetSession() {
        this.thoughtHistory = [];
        this.branches = {};
        this.sessionId = this.generateSessionId();
        console.error(`New thinking session started with ID: ${this.sessionId}`);
    }
    
    generateSessionId() {
        const timestamp = new Date().toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '-')
            .replace(/\..+/, '');
        return `session-${timestamp}`;
    }

    validateThoughtData(input) {
        const data = input;
        if (!data.thought || typeof data.thought !== 'string') {
            throw new Error('Invalid thought: must be a string');
        }
        if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
            throw new Error('Invalid thoughtNumber: must be a number');
        }
        if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
            throw new Error('Invalid totalThoughts: must be a number');
        }
        if (typeof data.nextThoughtNeeded !== 'boolean') {
            throw new Error('Invalid nextThoughtNeeded: must be a boolean');
        }
        return {
            thought: data.thought,
            thoughtNumber: data.thoughtNumber,
            totalThoughts: data.totalThoughts,
            nextThoughtNeeded: data.nextThoughtNeeded,
            isRevision: data.isRevision,
            revisesThought: data.revisesThought,
            branchFromThought: data.branchFromThought,
            branchId: data.branchId,
            needsMoreThoughts: data.needsMoreThoughts,
        };
    }

    formatThought(thoughtData) {
        const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;
        let prefix = '';
        let context = '';
        if (isRevision) {
            prefix = chalk.yellow('🔄 Revision');
            context = ` (revising thought ${revisesThought})`;
        }
        else if (branchFromThought) {
            prefix = chalk.green('🌿 Branch');
            context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
        }
        else {
            prefix = chalk.blue('💭 Thought');
            context = '';
        }
        const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
        const border = '─'.repeat(Math.max(header.length, thought.length) + 4);
        return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
    }

    async processThought(input) {
        try {
            const validatedInput = this.validateThoughtData(input);
            
            // Reset session if this is the first thought of a new session
            if (validatedInput.thoughtNumber === 1 && this.thoughtHistory.length > 0) {
                this.resetSession();
            }
            
            if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
                validatedInput.totalThoughts = validatedInput.thoughtNumber;
            }
            this.thoughtHistory.push(validatedInput);
            if (validatedInput.branchFromThought && validatedInput.branchId) {
                if (!this.branches[validatedInput.branchId]) {
                    this.branches[validatedInput.branchId] = [];
                }
                this.branches[validatedInput.branchId].push(validatedInput);
            }
            const formattedThought = this.formatThought(validatedInput);
            console.error(formattedThought);
            
            // If this is the final thought (nextThoughtNeeded is false), save the session
            if (!validatedInput.nextThoughtNeeded && this.storage) {
                try {
                    const savedPath = await this.storage.saveSession(
                        this.sessionId,
                        this.thoughtHistory,
                        this.branches
                    );
                    console.error(chalk.green(`✅ Thinking session saved to: ${savedPath}`));
                } catch (saveError) {
                    console.error(chalk.red(`❌ Error saving thinking session: ${saveError.message}`));
                }
            }
            
            return {
                thoughtNumber: validatedInput.thoughtNumber,
                totalThoughts: validatedInput.totalThoughts,
                nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                branches: Object.keys(this.branches),
                thoughtHistoryLength: this.thoughtHistory.length,
                sessionId: this.sessionId,
                sessionSaved: !validatedInput.nextThoughtNeeded
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed'
            };
        }
    }
}

// Detailed documentation for the Sequential Thinking tool
const SEQUENTIAL_THINKING_DOCUMENTATION = `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

Parameters explained:
- thought: Your current thinking step, which can include:
* Regular analytical steps
* Revisions of previous thoughts
* Questions about previous decisions
* Realizations about needing more analysis
* Changes in approach
* Hypothesis generation
* Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`;

class ThinkingSessionStorage {
    constructor(storagePath) {
        this.storagePath = storagePath;
    }

    async saveSession(sessionId, thoughtHistory, branches) {
        const sessionDir = path.join(this.storagePath, sessionId);
        await fs.ensureDir(sessionDir);
        
        const sessionData = {
            id: sessionId,
            timestamp: new Date().toISOString(),
            thoughtHistory,
            branches
        };
        
        const filePath = path.join(sessionDir, 'session.json');
        await fs.writeJson(filePath, sessionData, { spaces: 2 });
        
        return filePath;
    }

    async listSessions() {
        await fs.ensureDir(this.storagePath);
        const dirs = await fs.readdir(this.storagePath);
        
        const sessions = [];
        for (const dir of dirs) {
            const sessionPath = path.join(this.storagePath, dir, 'session.json');
            if (await fs.pathExists(sessionPath)) {
                try {
                    const sessionData = await fs.readJson(sessionPath);
                    sessions.push({
                        id: sessionData.id,
                        timestamp: sessionData.timestamp,
                        thoughtCount: sessionData.thoughtHistory.length,
                        branchCount: Object.keys(sessionData.branches).length
                    });
                } catch (error) {
                    console.error(`Error reading session ${dir}:`, error);
                }
            }
        }
        
        return sessions;
    }

    async getSession(sessionId) {
        const sessionPath = path.join(this.storagePath, sessionId, 'session.json');
        if (await fs.pathExists(sessionPath)) {
            return await fs.readJson(sessionPath);
        }
        return null;
    }
}

// Create storage instance
const sessionStorage = new ThinkingSessionStorage(storagePath);

// Create the thinking server with storage
const thinkingServer = new SequentialThinkingServer(sessionStorage);

// Create an MCP server
const server = new McpServer({
  name: "Sequential Thinking MCP Server",
  version: "0.6.2",
  vendor: "Aaron Bockelie"
});

// Add the sequentialthinking tool
server.tool(
  "sequentialthinking",
  "A tool for dynamic and reflective problem-solving through structured thoughts.",
  {
    thought: z.string().describe("Your current thinking step"),
    nextThoughtNeeded: z.boolean().describe("Whether another thought step is needed"),
    thoughtNumber: z.number().int().min(1).describe("Current thought number"),
    totalThoughts: z.number().int().min(1).describe("Estimated total thoughts needed"),
    isRevision: z.boolean().optional().describe("Whether this revises previous thinking"),
    revisesThought: z.number().int().min(1).optional().describe("Which thought is being reconsidered"),
    branchFromThought: z.number().int().min(1).optional().describe("Branching point thought number"),
    branchId: z.string().optional().describe("Branch identifier"),
    needsMoreThoughts: z.boolean().optional().describe("If more thoughts are needed")
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

// Add the documentation resource
server.resource(
  "documentation",
  "sequentialthinking://documentation",
  { mimeType: "text/plain" },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: SEQUENTIAL_THINKING_DOCUMENTATION
    }]
  })
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
console.error("Sequential Thinking Server running on stdio");

// Connect the server to the transport
server.connect(transport).catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
