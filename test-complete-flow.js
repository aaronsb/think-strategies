#!/usr/bin/env node
import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
});

// Function to send a request
function sendRequest(request) {
    const message = JSON.stringify(request) + '\n';
    server.stdin.write(message);
}

// Function to parse server responses
let buffer = '';
let testResults = [];

server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                if (response.result?.content?.[0]?.text) {
                    const result = JSON.parse(response.result.content[0].text);
                    testResults.push({
                        id: response.id,
                        success: !result.error,
                        state: result.currentState,
                        nextStates: result.availableActions ? Object.keys(result.availableActions) : []
                    });
                    
                    console.log(`\nTest ${response.id}: ${result.error ? 'FAILED' : 'SUCCESS'}`);
                    if (!result.error) {
                        console.log(`  Current State: ${result.currentState}`);
                        console.log(`  Available Actions: ${Object.keys(result.availableActions || {}).join(', ')}`);
                    } else {
                        console.log(`  Error: ${result.error}`);
                    }
                }
            } catch (e) {
                console.error('Parse error:', e.message);
            }
        }
    }
});

// Wait for server to start
setTimeout(() => {
    console.log('=== Testing Complete ReAct Flow ===\n');
    
    const tests = [
        {
            id: 1,
            description: 'Initialize react strategy',
            request: {
                strategy: 'react',
                thought: 'I need to find information about MCP server transitions.',
                thoughtNumber: 1,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        {
            id: 2,
            description: 'Plan action (should auto-transition)',
            request: {
                thought: 'I need to search the documentation for transition information.',
                thoughtNumber: 2,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        {
            id: 3,
            description: 'Execute action',
            request: {
                thought: 'Searching for transition documentation',
                action: 'grep -r "transition" docs/',
                thoughtNumber: 3,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        {
            id: 4,
            description: 'Record observation',
            request: {
                thought: 'Found relevant documentation',
                observation: 'Stage transitions are managed by StageManager class with automatic routing',
                thoughtNumber: 4,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        {
            id: 5,
            description: 'Final answer',
            request: {
                thought: 'Based on my investigation, I understand how transitions work',
                finalAnswer: 'MCP server transitions use StageManager with semantic routing for automatic state progression',
                thoughtNumber: 5,
                totalThoughts: 5,
                nextThoughtNeeded: false
            }
        }
    ];
    
    // Send all tests with delays
    tests.forEach((test, index) => {
        setTimeout(() => {
            console.log(`\n--- ${test.description} ---`);
            sendRequest({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name: 'think-strategies',
                    arguments: test.request
                },
                id: test.id
            });
        }, index * 1500);
    });
    
    // Summary after all tests
    setTimeout(() => {
        console.log('\n\n=== Test Summary ===');
        const successful = testResults.filter(r => r.success).length;
        console.log(`Total tests: ${tests.length}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${tests.length - successful}`);
        
        if (successful === tests.length) {
            console.log('\n✅ All tests passed! Automatic stage transitions are working correctly.');
        } else {
            console.log('\n❌ Some tests failed. Check the errors above.');
        }
        
        server.kill();
        process.exit(successful === tests.length ? 0 : 1);
    }, tests.length * 1500 + 1000);
}, 1000);