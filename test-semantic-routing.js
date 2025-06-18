#!/usr/bin/env node
import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
    console.error(`[Server Log] ${data.toString().trim()}`);
});

// Function to send a request
function sendRequest(request) {
    const message = JSON.stringify(request) + '\n';
    server.stdin.write(message);
}

// Function to parse server responses
let buffer = '';
server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('\n=== Response ===');
                const result = response.result?.content?.[0]?.text;
                if (result) {
                    const parsed = JSON.parse(result);
                    console.log(JSON.stringify(parsed, null, 2));
                }
            } catch (e) {
                console.error('Failed to parse:', line);
            }
        }
    }
});

// Wait for server to start
setTimeout(() => {
    console.log('\n=== Testing Semantic Routing with ReAct Strategy ===\n');
    
    // Test 1: Initialize with react strategy
    console.log('\n--- Test 1: Starting react strategy ---');
    sendRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'think-strategies',
            arguments: {
                strategy: 'react',
                thought: 'I need to find information about automatic transitions in MCP servers.',
                thoughtNumber: 1,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        id: 1
    });
    
    // Test 2: System automatically transitioned to initial_reasoning
    // Now we provide thought to trigger plan_action
    setTimeout(() => {
        console.log('\n--- Test 2: Triggering plan_action transition ---');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    thought: 'I need to search for documentation about automatic stage transitions',
                    thoughtNumber: 2,
                    totalThoughts: 5,
                    nextThoughtNeeded: true
                }
            },
            id: 2
        });
    }, 2000);
    
    // Test 3: System should be in action_planning
    // Provide action to trigger execute transition
    setTimeout(() => {
        console.log('\n--- Test 3: Executing action ---');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    thought: 'I will search for MCP transition documentation',
                    action: 'grep -r "transition" documentation/',
                    thoughtNumber: 3,
                    totalThoughts: 5,
                    nextThoughtNeeded: true
                }
            },
            id: 3
        });
    }, 4000);
    
    // Test 4: System should be in observation_phase
    // Provide observation to complete the cycle
    setTimeout(() => {
        console.log('\n--- Test 4: Recording observation ---');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    thought: 'The search found relevant information about stage transitions',
                    observation: 'Found: stage transitions are managed by StageManager class with automatic progression based on semantic actions',
                    thoughtNumber: 4,
                    totalThoughts: 5,
                    nextThoughtNeeded: true
                }
            },
            id: 4
        });
    }, 6000);
    
    // Test 5: Back to initial_reasoning, test final answer
    setTimeout(() => {
        console.log('\n--- Test 5: Providing final answer ---');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    thought: 'Based on my investigation, automatic stage transitions work through semantic routing',
                    finalAnswer: 'Automatic stage transitions in the MCP server are handled by the StageManager class, which uses semantic routing configuration to determine valid transitions based on the provided parameters.',
                    thoughtNumber: 5,
                    totalThoughts: 5,
                    nextThoughtNeeded: false
                }
            },
            id: 5
        });
    }, 8000);
    
    // Cleanup
    setTimeout(() => {
        console.log('\n\n=== Test Complete ===');
        server.kill();
        process.exit(0);
    }, 10000);
}, 1000);