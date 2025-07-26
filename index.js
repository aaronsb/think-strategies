#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
import fs from 'fs-extra';
import path from 'path-browserify';
import { homedir } from 'os';
import chalk from 'chalk';

// Import strategy configuration
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use __dirname to create an absolute path to the JSON file
const strategyConfigPath = path.join(__dirname, 'strategy-stages-mapping.json');
const strategyConfig = JSON.parse(fs.readFileSync(strategyConfigPath, 'utf8'));

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

// Stage Manager for handling strategy stages and transitions
class StageManager {
    constructor(strategy) {
        this.strategy = strategy;
        this.stages = strategyConfig.strategyStages[strategy] || [];
        this.transitions = strategyConfig.stageTransitions[strategy] || {};
        this.descriptions = strategyConfig.stageDescriptions || {};
        this.parameters = strategyConfig.strategyParameters[strategy] || {};
        this.currentStage = this.stages[0] || null;
        this.stageHistory = [];
    }

    getCurrentStage() {
        return this.currentStage;
    }

    getStageDescription(stage) {
        return this.descriptions[stage] || "No description available";
    }

    getNextStages() {
        return this.transitions[this.currentStage] || [];
    }

    getTransitionMetadata() {
        const nextStages = this.getNextStages();
        const metadata = {};
        
        nextStages.forEach(stage => {
            metadata[stage] = {
                description: this.getStageDescription(stage),
                isTerminal: stage === "final_response",
                isCyclic: this.transitions[stage] && this.transitions[stage].includes(this.currentStage),
                requiredParameters: this.getStageRequiredParameters(stage)
            };
        });
        
        return metadata;
    }

    getStageRequiredParameters(stage) {
        // Get parameters specific to a stage transition
        const stageParams = strategyConfig.wizardConfig.stageParameters?.[this.strategy]?.[stage] || [];
        const globalParams = ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"];
        return [...new Set([...globalParams, ...stageParams])];
    }

    canTransitionTo(nextStage) {
        const validNextStages = this.getNextStages();
        return validNextStages.includes(nextStage);
    }

    transitionTo(nextStage) {
        if (!this.canTransitionTo(nextStage)) {
            throw new Error(`Invalid transition from ${this.currentStage} to ${nextStage}`);
        }
        this.stageHistory.push(this.currentStage);
        this.currentStage = nextStage;
        return this.currentStage;
    }

    // Deprecated - use ParameterRouter instead
    getStagePrompt() {
        return "Please continue with the next step.";
    }

    // Deprecated - use ParameterRouter instead
    getRequiredParameters() {
        return ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"];
    }

    isFirstStage() {
        return this.stageHistory.length === 0;
    }

    isLastStage() {
        return this.currentStage === "final_response";
    }
}

// Parameter Router for semantic routing
class ParameterRouter {
    constructor() {
        // Load semantic routing configuration
        const semanticConfigPath = path.join(__dirname, 'semantic-routing-config.json');
        this.semanticConfig = JSON.parse(fs.readFileSync(semanticConfigPath, 'utf8'));
    }

    getAvailableActions(strategy, currentStage, thoughtHistory) {
        const strategySemantics = this.semanticConfig.strategySemantics[strategy];
        if (!strategySemantics || !strategySemantics[currentStage]) {
            return null;
        }

        const stageConfig = strategySemantics[currentStage];
        const availableActions = { ...(stageConfig.availableActions || {}) };

        // Add global actions if applicable
        Object.entries(this.semanticConfig.globalActions).forEach(([actionName, actionConfig]) => {
            if (actionConfig.availableFrom === "any" || 
                (Array.isArray(actionConfig.availableFrom) && actionConfig.availableFrom.includes(currentStage))) {
                availableActions[actionName] = {
                    description: actionConfig.description,
                    requiredInputs: actionConfig.requiredInputs,
                    optionalInputs: actionConfig.optionalInputs,
                    hints: actionConfig.hints,
                    isGlobal: true
                };
            }
        });

        return availableActions;
    }

    getRequiredParameters(strategy, currentStage, actionName) {
        const actions = this.getAvailableActions(strategy, currentStage, []);
        if (!actions || !actions[actionName]) {
            return [];
        }
        return actions[actionName].requiredInputs || [];
    }

    getOptionalParameters(strategy, currentStage, actionName) {
        const actions = this.getAvailableActions(strategy, currentStage, []);
        if (!actions || !actions[actionName]) {
            return [];
        }
        return actions[actionName].optionalInputs || [];
    }

    getParameterHints(strategy, currentStage, actionName) {
        const actions = this.getAvailableActions(strategy, currentStage, []);
        if (!actions || !actions[actionName]) {
            return {};
        }
        return actions[actionName].hints || {};
    }

    getStageDescription(strategy, currentStage) {
        const strategySemantics = this.semanticConfig.strategySemantics[strategy];
        if (!strategySemantics || !strategySemantics[currentStage]) {
            return "No description available";
        }
        return strategySemantics[currentStage].description;
    }

    canSwitchStrategy(strategy, currentStage) {
        const strategySemantics = this.semanticConfig.strategySemantics[strategy];
        if (!strategySemantics || !strategySemantics[currentStage]) {
            return false;
        }
        return strategySemantics[currentStage].canSwitchStrategy || false;
    }

    determineActionTaken(strategy, currentStage, providedParams) {
        const availableActions = this.getAvailableActions(strategy, currentStage, []);
        
        // Base parameters that are always present
        const baseParams = ['thought', 'thoughtNumber', 'totalThoughts', 'nextThoughtNeeded', 'strategy'];
        
        // Get all non-base parameters provided
        const providedNonBaseParams = Object.keys(providedParams).filter(
            param => !baseParams.includes(param) && providedParams[param] !== undefined
        );
        
        // Check each available action to see if its required parameters are satisfied
        for (const [actionName, actionConfig] of Object.entries(availableActions)) {
            const requiredInputs = actionConfig.requiredInputs || [];
            const nonBaseRequired = requiredInputs.filter(param => !baseParams.includes(param));
            
            // If action has non-base required params, check if they're all provided
            if (nonBaseRequired.length > 0) {
                const hasAllRequired = nonBaseRequired.every(param => 
                    providedParams[param] !== undefined && providedParams[param] !== null
                );
                
                if (hasAllRequired) {
                    return {
                        actionName,
                        nextState: actionConfig.nextState,
                        isGlobal: actionConfig.isGlobal || false
                    };
                }
            }
        }
        
        // If no specific action matches, find the default action (one with only base params required)
        for (const [actionName, actionConfig] of Object.entries(availableActions)) {
            const requiredInputs = actionConfig.requiredInputs || [];
            const hasOnlyBaseParams = requiredInputs.every(param => baseParams.includes(param));
            
            if (hasOnlyBaseParams && !actionConfig.isGlobal) {
                return {
                    actionName,
                    nextState: actionConfig.nextState,
                    isGlobal: false
                };
            }
        }
        
        return null;
    }

    buildSemanticResponse(strategy, currentStage, thoughtHistory, sessionId) {
        console.error("DEBUG: buildSemanticResponse called with:", {
            strategy,
            currentStage,
            thoughtHistoryType: typeof thoughtHistory,
            thoughtHistoryIsArray: Array.isArray(thoughtHistory),
            sessionId
        });
        // Ensure thoughtHistory is always an array
        const history = thoughtHistory || [];
        const availableActions = this.getAvailableActions(strategy, currentStage, history);
        const stageDescription = this.getStageDescription(strategy, currentStage);
        
        return {
            currentState: currentStage,
            stateDescription: stageDescription,
            sessionToken: sessionId,
            availableActions: availableActions,
            canSwitchStrategy: this.canSwitchStrategy(strategy, currentStage),
            thoughtHistoryLength: history.length
        };
    }
}

// MCP Client Manager for connecting to other MCP servers
class MCPClientManager {
    constructor() {
        this.clients = new Map();
        this.availableServers = new Map();
    }

    async connectToServer(serverName, command, args = []) {
        if (this.clients.has(serverName)) {
            return this.clients.get(serverName);
        }

        try {
            const client = new Client({
                name: `thinking-server-client-${serverName}`,
                version: "1.0.0"
            }, {
                capabilities: {}
            });

            const transport = new StdioClientTransport({
                command: command,
                args: args
            });

            await client.connect(transport);
            
            this.clients.set(serverName, client);
            this.availableServers.set(serverName, { command, args });
            
            console.error(chalk.green(`🔗 Connected to MCP server: ${serverName}`));
            return client;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to connect to ${serverName}: ${error.message}`));
            throw error;
        }
    }

    async disconnectFromServer(serverName) {
        const client = this.clients.get(serverName);
        if (client) {
            await client.close();
            this.clients.delete(serverName);
            this.availableServers.delete(serverName);
            console.error(chalk.yellow(`🔌 Disconnected from MCP server: ${serverName}`));
        }
    }

    async executeToolCall(serverName, toolName, parameters, context = {}) {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Not connected to server: ${serverName}`);
        }

        try {
            console.error(chalk.cyan(`🔧 Executing ${serverName}.${toolName}`));
            const result = await client.callTool({
                name: toolName,
                arguments: parameters || {}
            });

            return {
                success: true,
                result: result,
                server: serverName,
                tool: toolName,
                parameters: parameters,
                context: context,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(chalk.red(`❌ Tool call failed: ${serverName}.${toolName} - ${error.message}`));
            return {
                success: false,
                error: error.message,
                server: serverName,
                tool: toolName,
                parameters: parameters,
                context: context,
                timestamp: new Date().toISOString()
            };
        }
    }

    async listAvailableTools(serverName) {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Not connected to server: ${serverName}`);
        }

        try {
            const tools = await client.listTools();
            return tools.tools || [];
        } catch (error) {
            console.error(chalk.red(`❌ Failed to list tools for ${serverName}: ${error.message}`));
            return [];
        }
    }

    getConnectedServers() {
        return Array.from(this.clients.keys());
    }

    isConnected(serverName) {
        return this.clients.has(serverName);
    }
}

// Sequential Thinking implementation
class SequentialThinkingServer {
    thoughtHistory = [];
    branches = {};
    sessionId = null;
    storage = null;
    stageManager = null;
    parameterRouter = null;
    strategy = null;
    isInitialized = false;
    
    // MCP client integration
    mcpClientManager = null;
    pendingActions = [];
    actionResults = [];
    
    // Dual numbering system
    absoluteThoughtNumber = 0;
    sequenceThoughtNumber = 0;
    
    constructor(storage) {
        this.storage = storage;
        this.parameterRouter = new ParameterRouter();
        this.mcpClientManager = new MCPClientManager();
        console.error(chalk.blue("Sequential Thinking Server initialized - waiting for strategy selection"));
    }
    
    resetSession(strategy) {
        if (!strategy) {
            throw new Error("Strategy must be specified when resetting session");
        }
        
        this.thoughtHistory = [];
        this.branches = {};
        this.sessionId = this.generateSessionId(strategy);
        this.strategy = strategy;
        this.stageManager = new StageManager(strategy);
        this.isInitialized = true;
        
        // Reset dual numbering system
        this.absoluteThoughtNumber = 0;
        this.sequenceThoughtNumber = 0;
        
        // Reset action tracking
        this.pendingActions = [];
        this.actionResults = [];
        
        console.error(`New thinking session started with ID: ${this.sessionId} using strategy: ${strategy}`);
    }
    
    generateSessionId(strategy) {
        const timestamp = new Date().toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '-')
            .replace(/\..+/, '');
        return `${strategy}-session-${timestamp}`;
    }

    // Action planning and execution methods
    async connectToMCPServer(serverName, command, args = []) {
        try {
            await this.mcpClientManager.connectToServer(serverName, command, args);
            return {
                success: true,
                message: `Connected to ${serverName}`,
                connectedServers: this.mcpClientManager.getConnectedServers()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                connectedServers: this.mcpClientManager.getConnectedServers()
            };
        }
    }

    async executeAction(action) {
        const { server, tool, parameters, context } = action;
        
        if (!this.mcpClientManager.isConnected(server)) {
            throw new Error(`Not connected to MCP server: ${server}`);
        }

        console.error(chalk.blue(`🎯 Executing planned action: ${server}.${tool}`));
        const result = await this.mcpClientManager.executeToolCall(server, tool, parameters, {
            ...context,
            sessionId: this.sessionId,
            strategy: this.strategy,
            thoughtNumber: this.absoluteThoughtNumber
        });

        this.actionResults.push(result);
        console.error(chalk.green(`✅ Action completed: ${server}.${tool}`));
        
        return result;
    }

    async executePendingActions() {
        if (this.pendingActions.length === 0) {
            return [];
        }

        console.error(chalk.cyan(`⚡ Executing ${this.pendingActions.length} pending actions`));
        const results = [];

        for (const action of this.pendingActions) {
            try {
                const result = await this.executeAction(action);
                results.push(result);
            } catch (error) {
                console.error(chalk.red(`❌ Action failed: ${error.message}`));
                results.push({
                    success: false,
                    error: error.message,
                    action: action
                });
            }
        }

        this.pendingActions = []; // Clear pending actions after execution
        return results;
    }

    planAction(server, tool, parameters, expectedInfo) {
        const action = {
            server,
            tool,
            parameters,
            expectedInfo,
            plannedAt: new Date().toISOString(),
            context: {
                sessionId: this.sessionId,
                strategy: this.strategy,
                currentStage: this.stageManager.getCurrentStage()
            }
        };

        this.pendingActions.push(action);
        console.error(chalk.yellow(`📋 Planned action: ${server}.${tool} - ${expectedInfo}`));
        
        return action;
    }

    validateThoughtData(input) {
        const data = input;
        
        // Check if this is a strategy selection or reset request
        if (data.strategy && (!data.thoughtNumber || data.thoughtNumber === 1)) {
            this.resetSession(data.strategy);
            
            // Build semantic response for initial state
            const semanticResponse = this.parameterRouter.buildSemanticResponse(
                this.strategy,
                this.stageManager.getCurrentStage(),
                this.thoughtHistory,
                this.sessionId
            );
            
            return {
                ...semanticResponse,
                thought: data.thought || '',
                thoughtNumber: 1,
                totalThoughts: data.totalThoughts || 1,
                nextThoughtNeeded: true
            };
        }
        
        // Check if a strategy has been selected
        if (!this.isInitialized) {
            return {
                error: "No strategy selected. Please select a strategy first.",
                availableStrategies: Object.keys(strategyConfig.strategyStages),
                status: 'waiting_for_strategy',
                nextThoughtNeeded: true
            };
        }
        
        // Validate required parameters for all strategies
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
        
        // Determine action taken based on provided parameters
        const action = this.parameterRouter.determineActionTaken(
            this.strategy,
            this.stageManager.getCurrentStage(),
            data
        );
        
        // Handle automatic stage transitions
        if (action && action.nextState && !action.isGlobal) {
            // Transition to next state if action determines it
            if (this.stageManager.canTransitionTo(action.nextState)) {
                this.stageManager.transitionTo(action.nextState);
                console.error(chalk.cyan(`🔄 Transitioned to: ${action.nextState} (via ${action.actionName})`));
            }
        } else if (data.currentStage && data.currentStage !== this.stageManager.getCurrentStage()) {
            // Manual stage transition (backward compatibility)
            if (!this.stageManager.canTransitionTo(data.currentStage)) {
                throw new Error(`Invalid stage transition from ${this.stageManager.getCurrentStage()} to ${data.currentStage}`);
            }
            this.stageManager.transitionTo(data.currentStage);
        }
        
        // Handle strategy switching
        if (action && action.actionName === 'switch_strategy' && data.strategy !== this.strategy) {
            const preserveHistory = data.preserveHistory || false;
            const oldHistory = preserveHistory ? [...this.thoughtHistory] : [];
            this.resetSession(data.strategy);
            if (preserveHistory) {
                this.thoughtHistory = oldHistory;
            }
            console.error(chalk.magenta(`🔀 Switched strategy to: ${data.strategy}`));
        }
        
        // Handle action planning - if plannedActions are provided, add them to pending actions
        if (data.plannedActions && Array.isArray(data.plannedActions)) {
            for (const actionPlan of data.plannedActions) {
                const { server, tool, parameters, expectedInfo } = actionPlan;
                if (server && tool) {
                    this.planAction(server, tool, parameters, expectedInfo || `Execute ${server}.${tool}`);
                }
            }
        }
        
        // Handle action results - if actionResults are provided, integrate them
        if (data.actionResults && Array.isArray(data.actionResults)) {
            this.actionResults.push(...data.actionResults);
            console.error(chalk.green(`📥 Integrated ${data.actionResults.length} action results`));
        }
        
        // Return validated data
        return {
            ...data,
            strategy: this.strategy,
            currentStage: this.stageManager.getCurrentStage(),
            pendingActions: this.pendingActions.length,
            actionResults: this.actionResults
        };
    }

    formatThought(thoughtData) {
        const { 
            thoughtNumber, 
            totalThoughts, 
            thought, 
            isRevision, 
            revisesThought, 
            branchFromThought, 
            branchId,
            strategy,
            currentStage,
            nextThoughtNeeded,
            absoluteNumber,
            sequenceNumber
        } = thoughtData;
        
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
        
        const strategyInfo = chalk.magenta(`[${strategy}]`);
        const stageInfo = chalk.cyan(`[Stage: ${currentStage}]`);
        const dualNumbering = absoluteNumber ? chalk.gray(`[A${absoluteNumber}|S${sequenceNumber}]`) : '';
        const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context} ${dualNumbering} ${strategyInfo} ${stageInfo}`;
        const border = '─'.repeat(Math.max(header.length, (thought || '').length) + 4);
        
        // Add continuation hint if more thoughts are needed
        let output = `
┌${border}┐
│ ${header} │
├${border}┤
│ ${(thought || '').padEnd(border.length - 2)} │`;

        if (nextThoughtNeeded) {
            const continuationHint = "Continue with your next thought step without stopping";
            const hintBorder = '─'.repeat(Math.max(continuationHint.length + 4, border.length));
            output += `
├${hintBorder}┤
│ ${chalk.green(continuationHint).padEnd(hintBorder.length - 2)} │`;
        }
        
        output += `
└${border}┘`;
        
        return output;
    }

    async processThought(input) {
        try {
            console.error("DEBUG: processThought called with:", JSON.stringify(input, null, 2));
            const validatedInput = this.validateThoughtData(input);
            
            // If we're waiting for strategy selection, return early
            if (validatedInput.status === 'waiting_for_strategy') {
                return validatedInput;
            }
            
            // Log strategy start
            if (this.stageManager.isFirstStage() && validatedInput.thoughtNumber === 1) {
                console.error(chalk.green(`🎯 Starting ${this.strategy} strategy`));
                console.error(chalk.cyan(`📍 Stage: ${this.stageManager.getCurrentStage()}`));
            }
            
            // Normal thought processing
            if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
                validatedInput.totalThoughts = validatedInput.thoughtNumber;
            }
            
            // Update dual numbering system
            this.absoluteThoughtNumber++;
            
            // Handle branching - reset sequence number for new branches
            if (validatedInput.branchFromThought && validatedInput.branchId) {
                // Reset sequence numbering for new branch
                this.sequenceThoughtNumber = 1;
                console.error(chalk.green(`🌿 New branch ${validatedInput.branchId} started from thought A${validatedInput.branchFromThought}`));
            } else {
                this.sequenceThoughtNumber++;
            }
            
            // Add dual numbering to validated input
            validatedInput.absoluteNumber = this.absoluteThoughtNumber;
            validatedInput.sequenceNumber = this.sequenceThoughtNumber;
            
            this.thoughtHistory.push(validatedInput);
            
            if (validatedInput.branchFromThought && validatedInput.branchId) {
                if (!this.branches[validatedInput.branchId]) {
                    this.branches[validatedInput.branchId] = [];
                }
                this.branches[validatedInput.branchId].push(validatedInput);
            }
            
            const formattedThought = this.formatThought({
                ...validatedInput,
                strategy: this.strategy,
                currentStage: this.stageManager.getCurrentStage()
            });
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
            
            // Build semantic routing response
            const semanticResponse = this.parameterRouter.buildSemanticResponse(
                this.strategy,
                this.stageManager.getCurrentStage(),
                this.thoughtHistory,
                this.sessionId
            );
            
            return {
                ...semanticResponse,
                thoughtNumber: validatedInput.thoughtNumber,
                totalThoughts: validatedInput.totalThoughts,
                nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                sessionSaved: !validatedInput.nextThoughtNeeded
            };
        }
        catch (error) {
            console.error("DEBUG: Error in processThought:", error);
            console.error("DEBUG: Error stack:", error.stack);
            return {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed'
            };
        }
    }
}

// Detailed documentation for the Sequential Thinking tool
const SEQUENTIAL_THINKING_DOCUMENTATION = `# SequentialThinking Plus Tool

A modular tool for dynamic and reflective problem-solving through structured thoughts using various reasoning strategies.

## Overview

This tool helps analyze problems through flexible thinking processes that can adapt and evolve based on the selected strategy. Each strategy offers a different approach to problem-solving, with its own strengths and specialized use cases. The underlying flow engine supports unfixed step numbers and branching approaches, allowing for truly adaptive reasoning.

**IMPORTANT**: Always specify a 'strategy' parameter when starting. Don't default to linear - choose the strategy that best matches your problem type!

**KEY FEATURE**: Between any thinking steps, you can call other tools for research, file access, calculations, or actions. The thinking strategy will pause while you gather information, then resume where you left off.

**STRATEGIC PLANNING**: Your thoughts can include plans for future tool calls (e.g., "Step 3: search files for config", "Next: run calculation tool"). You can outline your tool usage strategy within your thinking, then execute those planned calls before advancing to the next step.

## Available Strategies

1. **Linear** - Exploratory approach with manual progression control. You choose when to advance through each thinking stage, and can call other tools between any steps for research, file access, or actions. Perfect for deliberative problem-solving where you need to gather information as you think.
2. **Chain of Thought** - A linear approach that breaks down problems into sequential reasoning steps.
3. **ReAct** - Combines reasoning with actions to gather information from external tools. Supports cyclic flows for multiple action-observation cycles.
4. **ReWOO** - Separates planning, working, and solving phases with parallel tool execution.
5. **Scratchpad** - Uses iterative calculations with explicit state tracking. Supports repeating calculation steps as needed.
6. **Self-Ask** - Breaks down problems into sub-questions that are answered sequentially. Supports asking multiple sub-questions as needed.
7. **Self-Consistency** - Explores multiple reasoning paths to find the most consistent answer.
8. **Step-Back** - Abstracts the problem to identify general principles before solving.
9. **Tree of Thoughts** - Explores multiple solution paths and evaluates their promise. Supports branching and path selection.

## Flow Engine Architecture

The Sequential Thinking tool is powered by a flexible flow engine that supports:

1. **Unfixed Step Numbers**:
   - Cyclic stage transitions allow repeating steps as needed
   - Dynamic thought count adjustment during the thinking process
   - Strategy-specific iteration points for different reasoning approaches

2. **Branching Approaches**:
   - Explicit branch tracking for exploring alternative paths
   - Strategy-specific branching mechanisms (especially in Tree of Thoughts)
   - Branch creation, development, and selection capabilities

3. **Strategy-Specific Flows**:
   - Each strategy has its own defined flow pattern
   - Customized stage transitions for different reasoning approaches
   - Specialized stages for different problem-solving techniques

## How to Use

### Getting Started

1. **Choose your strategy first!** Don't default to linear. Pick from:
   - linear, chain_of_thought, react, rewoo, scratchpad, 
   - self_ask, self_consistency, step_back, tree_of_thoughts, or trilemma

2. Start your first thought with your chosen strategy:
   - Set the 'strategy' parameter to your selected strategy
   - Set 'thoughtNumber' to 1 for the first thought

2. The tool will respond with:
   - An introduction to the selected strategy
   - The current stage in the thinking process
   - Required parameters for the next stage
   - A prompt for the next step

3. Follow the guided process through each stage of the selected strategy:
   - Provide the required parameters for each stage
   - The tool will guide you through the appropriate sequence of stages
   - Each response includes the next stage prompt and required parameters
   - You can cycle back to previous stages when needed based on the strategy's flow pattern

### Core Parameters (All Strategies)

- **strategy**: The thinking strategy being employed
- **thought**: Your current thinking step
- **thoughtNumber**: Current thought number
- **totalThoughts**: Estimated total thoughts needed (can be adjusted dynamically)
- **nextThoughtNeeded**: Whether another thought step is needed
- **currentStage**: Current stage in the thinking process flow
- **needsMoreThoughts**: Indicates if more thoughts are needed than initially estimated

### Strategy-Specific Parameters

Each strategy may require additional parameters specific to its approach. The tool will guide you on which parameters are needed at each stage.

#### Branching Parameters
- **branchFromThought**: The thought number from which to branch
- **branchId**: Unique identifier for the branch
- **isRevision**: Whether this thought revises a previous one
- **revisesThought**: Which thought is being revised

#### Strategy-Specific Flow Parameters
- **ReAct**: action, observation
- **ReWOO**: planningPhase, toolCalls
- **Scratchpad**: stateVariables
- **Self-Ask**: subQuestion, subQuestionAnswer, subQuestionNumber
- **Self-Consistency**: reasoningPathId, pathAnswers
- **Step-Back**: generalPrinciple
- **Tree of Thoughts**: approachId, approaches, evaluationScore

### Wizard Functionality

The tool uses semantic routing to guide you through the thinking process:

1. It confirms your strategy selection
2. It informs you which parameters you need to provide
3. It guides you through the remaining steps
4. It prompts you with specific questions for each stage
5. You can cancel the flow and start over at any time

## When to Use This Tool

- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out
- Problems that benefit from exploring multiple approaches
- Reasoning that requires iterative refinement

## Strategy Selection Guide (Quick Reference)

### Choose Your Strategy Based on Problem Type:

| Problem Type | Best Strategy | Why Use It |
|-------------|---------------|------------|
| Exploratory/deliberative thinking | **linear** | Manual control, call other tools between steps, research as you think |
| Step-by-step breakdown | **chain_of_thought** | Linear, clear sequential steps |
| Need external tools/info | **react** | Combines thinking with tool actions |
| Multiple tools upfront | **rewoo** | Plan all tools, execute in parallel |
| Math/algorithms | **scratchpad** | Track variables, show calculations |
| Complex questions | **self_ask** | Break into sub-questions |
| Verify correctness | **self_consistency** | Multiple paths → consensus |
| Abstract → specific | **step_back** | Find principles first, then apply |
| Multiple approaches | **tree_of_thoughts** | Explore & evaluate different paths |
| Three-way trade-offs | **trilemma** | Balance competing objectives through satisficing |

## Session Management

Each thinking session is stored with a unique ID that includes the strategy name. Sessions are never deleted, allowing you to reference past thinking processes.

## Integration with Other Tools

Sequential Thinking serves as an excellent force multiplier when combined with other tools:

- **Research Tools**: Pair with web crawlers and search tools to gather information that informs your structured thinking process. For example, use ReAct strategy with search tools to dynamically explore information as needed.

- **Memory Tools**: Create persistent records of your thinking sessions that can be referenced in future problem-solving. The session storage feature automatically preserves your thought process.

- **Data Analysis Tools**: Combine with data processing tools to analyze complex datasets through structured thinking steps.

- **Visualization Tools**: Use the output of your thinking process to generate diagrams, charts, or other visual representations.

- **Decision Support Systems**: Feed the results of your sequential thinking into decision matrices or other frameworks.

Remember to read the documentation resource first to select the most appropriate strategy, then leverage these tool combinations to maximize effectiveness.`;

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
            strategy: sessionId.split('-')[0], // Extract strategy from sessionId
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
                        strategy: sessionData.strategy || "unknown",
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
  name: "SequentialThinking Plus MCP Server",
  version: "0.9.0",
  vendor: "Aaron Bockelie"
});

// Define the core thinking schema (cleaned up - branching moved to think-tools)
const thinkingSchema = {
  thought: z.string(),
  nextThoughtNeeded: z.boolean(),
  thoughtNumber: z.number(),
  totalThoughts: z.number(),
  strategy: z.string(),
  
  // Strategy-specific parameters
  action: z.string().optional(),
  observation: z.string().optional(),
  finalAnswer: z.string().optional(),
  
  // Action integration for think→act→reflect workflow
  plannedActions: z.array(z.object({
    server: z.string(),
    tool: z.string(),
    parameters: z.record(z.any()).optional(),
    expectedInfo: z.string().optional()
  })).optional(),
  
  actionResults: z.array(z.object({
    success: z.boolean(),
    result: z.any().optional(),
    error: z.string().optional(),
    server: z.string(),
    tool: z.string(),
    timestamp: z.string()
  })).optional()
};

// Add the think-strategies tool with Zod schema
server.tool(
  "think-strategies", 
  "Core thinking tool for structured problem-solving using 10 reasoning strategies. Choose your strategy (linear, chain_of_thought, react, rewoo, scratchpad, self_ask, self_consistency, step_back, tree_of_thoughts, trilemma) and engage in guided thinking with think→act→reflect workflows. Plan actions with 'plannedActions', integrate results with 'actionResults'. Use think-tools for utilities and think-session-manager for session persistence.",
  thinkingSchema,
  async (args) => {
    try {
      console.error("DEBUG: Tool handler called with args:", JSON.stringify(args, null, 2));
      const result = await thinkingServer.processThought(args);
      console.error("DEBUG: Tool handler result:", JSON.stringify(result, null, 2));
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error("DEBUG: Error in tool handler:", error);
      console.error("DEBUG: Error stack:", error.stack);
      throw error;
    }
  }
);

// Add consolidated thinking tools
server.tool(
  "think-tools",
  "Utilities for thinking workflows: connect to MCP servers, execute actions, check status, create branches",
  {
    action: z.enum(["connect-server", "execute-actions", "server-status", "create-branch"]),
    serverName: z.string().optional(),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    branchId: z.string().optional(),
    branchFromThought: z.number().optional(),
    thought: z.string().optional()
  },
  async (args) => {
    try {
      switch (args.action) {
        case "connect-server":
          if (!args.serverName || !args.command) {
            throw new Error("serverName and command required for 'connect-server' action");
          }
          
          const connectResult = await thinkingServer.connectToMCPServer(
            args.serverName, 
            args.command, 
            args.args || []
          );
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "connect-server",
                ...connectResult
              }, null, 2)
            }]
          };

        case "execute-actions":
          const execResults = await thinkingServer.executePendingActions();
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "execute-actions",
                executed: execResults.length,
                results: execResults
              }, null, 2)
            }]
          };

        case "server-status":
          const status = {
            action: "server-status",
            connectedServers: thinkingServer.mcpClientManager.getConnectedServers(),
            pendingActions: thinkingServer.pendingActions.length,
            actionResults: thinkingServer.actionResults.length,
            currentSession: thinkingServer.sessionId,
            strategy: thinkingServer.strategy,
            absoluteThoughtNumber: thinkingServer.absoluteThoughtNumber,
            sequenceThoughtNumber: thinkingServer.sequenceThoughtNumber,
            branches: Object.keys(thinkingServer.branches),
            thoughtHistory: thinkingServer.thoughtHistory.length
          };
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(status, null, 2)
            }]
          };

        case "create-branch":
          if (!args.branchId || !args.branchFromThought || !args.thought) {
            throw new Error("branchId, branchFromThought, and thought required for 'create-branch' action");
          }
          
          // Find the source thought
          const sourceThought = thinkingServer.thoughtHistory.find(
            t => t.absoluteNumber === args.branchFromThought
          );
          
          if (!sourceThought) {
            throw new Error(`No thought found with absolute number ${args.branchFromThought}`);
          }
          
          // Create branching thought data
          const branchData = {
            thought: args.thought,
            branchFromThought: args.branchFromThought,
            branchId: args.branchId,
            thoughtNumber: 1,
            totalThoughts: 5, // Default estimate
            nextThoughtNeeded: true,
            strategy: thinkingServer.strategy
          };
          
          // Process the branch creation
          const branchResult = await thinkingServer.processThought(branchData);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "create-branch",
                message: `Branch '${args.branchId}' created from thought A${args.branchFromThought}`,
                branchResult: branchResult
              }, null, 2)
            }]
          };

        default:
          throw new Error(`Unknown action: ${args.action}`);
      }
    } catch (error) {
      console.error(`ERROR: Think-tools action '${args.action}' failed:`, error);
      throw error;
    }
  }
);

// Add unified thinking session manager tool
server.tool(
  "think-session-manager",
  "Manage thinking sessions: list recent sessions, get details, or resume previous sessions",
  {
    action: z.enum(["list", "get", "resume"]),
    sessionId: z.string().optional(),
    limit: z.number().optional().default(10)
  },
  async (args) => {
    try {
      switch (args.action) {
        case "list":
          const sessions = await sessionStorage.listSessions();
          
          // Sort by timestamp (most recent first) and limit
          const recentSessions = sessions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, args.limit);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "list",
                totalSessions: sessions.length,
                recentSessions: recentSessions.map(s => ({
                  id: s.id,
                  strategy: s.strategy,
                  timestamp: s.timestamp,
                  thoughtCount: s.thoughtCount,
                  branchCount: s.branchCount,
                  age: `${Math.round((Date.now() - new Date(s.timestamp)) / (1000 * 60))} minutes ago`
                }))
              }, null, 2)
            }]
          };

        case "get":
          if (!args.sessionId) {
            throw new Error("sessionId required for 'get' action");
          }
          
          const session = await sessionStorage.getSession(args.sessionId);
          
          if (!session) {
            throw new Error(`Session not found: ${args.sessionId}`);
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "get",
                id: session.id,
                strategy: session.strategy,
                timestamp: session.timestamp,
                thoughtHistory: session.thoughtHistory.map(t => ({
                  thoughtNumber: t.thoughtNumber,
                  absoluteNumber: t.absoluteNumber,
                  sequenceNumber: t.sequenceNumber,
                  thought: t.thought.substring(0, 100) + (t.thought.length > 100 ? '...' : ''),
                  stage: t.currentStage,
                  hasActions: t.plannedActions ? t.plannedActions.length > 0 : false,
                  hasResults: t.actionResults ? t.actionResults.length > 0 : false
                })),
                branches: Object.keys(session.branches),
                summary: {
                  totalThoughts: session.thoughtHistory.length,
                  totalBranches: Object.keys(session.branches).length,
                  finalStage: session.thoughtHistory[session.thoughtHistory.length - 1]?.currentStage,
                  completed: !session.thoughtHistory[session.thoughtHistory.length - 1]?.nextThoughtNeeded
                }
              }, null, 2)
            }]
          };

        case "resume":
          if (!args.sessionId) {
            throw new Error("sessionId required for 'resume' action");
          }
          
          const resumeSession = await sessionStorage.getSession(args.sessionId);
          
          if (!resumeSession) {
            throw new Error(`Session not found: ${args.sessionId}`);
          }
          
          // Restore session state
          thinkingServer.thoughtHistory = resumeSession.thoughtHistory;
          thinkingServer.branches = resumeSession.branches;
          thinkingServer.sessionId = resumeSession.id;
          thinkingServer.strategy = resumeSession.strategy;
          thinkingServer.stageManager = new StageManager(resumeSession.strategy);
          thinkingServer.isInitialized = true;
          
          // Reconstruct dual numbering from history
          const lastThought = resumeSession.thoughtHistory[resumeSession.thoughtHistory.length - 1];
          thinkingServer.absoluteThoughtNumber = lastThought?.absoluteNumber || 0;
          thinkingServer.sequenceThoughtNumber = lastThought?.sequenceNumber || 0;
          
          // Set stage to last known stage
          if (lastThought?.currentStage) {
            thinkingServer.stageManager.currentStage = lastThought.currentStage;
          }
          
          console.error(`📚 Resumed session: ${resumeSession.id} (${resumeSession.strategy})`);
          
          // Build semantic response for current state
          const semanticResponse = thinkingServer.parameterRouter.buildSemanticResponse(
            thinkingServer.strategy,
            thinkingServer.stageManager.getCurrentStage(),
            thinkingServer.thoughtHistory,
            thinkingServer.sessionId
          );
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                action: "resume",
                message: `Resumed session: ${resumeSession.id}`,
                strategy: resumeSession.strategy,
                thoughtCount: resumeSession.thoughtHistory.length,
                currentState: semanticResponse.currentState,
                absoluteThoughtNumber: thinkingServer.absoluteThoughtNumber,
                sequenceThoughtNumber: thinkingServer.sequenceThoughtNumber,
                availableActions: semanticResponse.availableActions,
                lastThought: lastThought?.thought?.substring(0, 200) + (lastThought?.thought?.length > 200 ? '...' : '')
              }, null, 2)
            }]
          };

        default:
          throw new Error(`Unknown action: ${args.action}`);
      }
    } catch (error) {
      console.error(`ERROR: Session manager action '${args.action}' failed:`, error);
      throw error;
    }
  }
);

// Add the documentation resource
server.resource(
  "documentation",
  "think-strategies://documentation",
  { mimeType: "text/plain" },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: SEQUENTIAL_THINKING_DOCUMENTATION
    }]
  })
);

// Add strategy configuration resource
server.resource(
  "strategy-config",
  "think-strategies://strategy-config",
  { mimeType: "application/json" },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(strategyConfig, null, 2)
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
