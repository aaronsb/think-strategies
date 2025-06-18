#!/usr/bin/env node
// Test to reproduce the 'length' error

import strategyConfig from './strategy-stages-mapping.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the ParameterRouter class
class ParameterRouter {
    constructor() {
        // Load semantic routing configuration
        const semanticConfigPath = path.join(__dirname, 'semantic-routing-config.json');
        this.semanticConfig = JSON.parse(fs.readFileSync(semanticConfigPath, 'utf8'));
    }

    getAvailableActions(strategy, currentStage, thoughtHistory) {
        console.log('getAvailableActions called with:', { strategy, currentStage, thoughtHistoryLength: thoughtHistory?.length });
        
        const strategySemantics = this.semanticConfig.strategySemantics[strategy];
        if (!strategySemantics || !strategySemantics[currentStage]) {
            return null;
        }

        const stageConfig = strategySemantics[currentStage];
        const availableActions = { ...stageConfig.availableActions };

        // Add global actions if applicable
        console.log('About to access globalActions:', this.semanticConfig.globalActions);
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

    buildSemanticResponse(strategy, currentStage, thoughtHistory, sessionId) {
        console.log('buildSemanticResponse called with:', { 
            strategy, 
            currentStage, 
            thoughtHistoryIsArray: Array.isArray(thoughtHistory),
            thoughtHistoryLength: thoughtHistory?.length,
            sessionId 
        });
        
        // Ensure thoughtHistory is always an array
        const history = thoughtHistory || [];
        const availableActions = this.getAvailableActions(strategy, currentStage, history);
        
        return {
            currentState: currentStage,
            availableActions: availableActions,
            thoughtHistoryLength: history.length
        };
    }
}

// Test the issue
console.log('=== Testing ParameterRouter ===\n');

try {
    const router = new ParameterRouter();
    
    // Test 1: Valid call
    console.log('Test 1: Valid call with strategy and stage');
    const result1 = router.buildSemanticResponse('react', 'problem_reception', [], 'test-session');
    console.log('Result 1:', JSON.stringify(result1, null, 2));
    
    // Test 2: Call with undefined thoughtHistory
    console.log('\nTest 2: Call with undefined thoughtHistory');
    const result2 = router.buildSemanticResponse('react', 'problem_reception', undefined, 'test-session');
    console.log('Result 2:', JSON.stringify(result2, null, 2));
    
    // Test 3: Call with null strategy
    console.log('\nTest 3: Call with null strategy');
    const result3 = router.buildSemanticResponse(null, 'problem_reception', [], 'test-session');
    console.log('Result 3:', JSON.stringify(result3, null, 2));
    
} catch (error) {
    console.error('\nError occurred:', error.message);
    console.error('Stack:', error.stack);
}