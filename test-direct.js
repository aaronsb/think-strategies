#!/usr/bin/env node
// Direct test of the thinking server without MCP protocol

import { SequentialThinkingServer } from './index.js';
import { ThinkingSessionStorage } from './index.js';

// Create storage
const storage = new ThinkingSessionStorage('/tmp/test-thinking');

// Create server
const server = new SequentialThinkingServer(storage);

console.log('=== Direct Test of Thinking Server ===\n');

// Test 1: Initialize react strategy
console.log('Test 1: Initialize react strategy');
try {
    const result1 = await server.processThought({
        strategy: 'react',
        thought: 'I need to find information about automatic transitions.',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
    });
    console.log('Result:', JSON.stringify(result1, null, 2));
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}

// Test 2: Continue with thought
console.log('\nTest 2: Continue with thought');
try {
    const result2 = await server.processThought({
        thought: 'I need to search for documentation',
        thoughtNumber: 2,
        totalThoughts: 5,
        nextThoughtNeeded: true
    });
    console.log('Result:', JSON.stringify(result2, null, 2));
} catch (error) {
    console.error('Error:', error.message);
}

// Test 3: Provide action
console.log('\nTest 3: Provide action');
try {
    const result3 = await server.processThought({
        thought: 'I will search the docs',
        action: 'search documentation',
        thoughtNumber: 3,
        totalThoughts: 5,
        nextThoughtNeeded: true
    });
    console.log('Result:', JSON.stringify(result3, null, 2));
} catch (error) {
    console.error('Error:', error.message);
}

process.exit(0);