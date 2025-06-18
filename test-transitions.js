#!/usr/bin/env node
import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
    console.error(`Server: ${data}`);
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
                console.log('Response:', JSON.stringify(response, null, 2));
            } catch (e) {
                console.error('Failed to parse:', line);
            }
        }
    }
});

// Wait for server to start
setTimeout(() => {
    console.log('\n--- Testing automatic stage transitions ---\n');
    
    // Test 1: Initialize with react strategy
    console.log('Test 1: Starting react strategy');
    sendRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'think-strategies',
            arguments: {
                strategy: 'react',
                thought: 'I need to test automatic transitions. Let me analyze what information is needed.',
                thoughtNumber: 1,
                totalThoughts: 5,
                nextThoughtNeeded: true
            }
        },
        id: 1
    });
    
    // Test 2: Provide action parameter to trigger transition
    setTimeout(() => {
        console.log('\nTest 2: Providing action to trigger transition');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    strategy: 'react',
                    thought: 'I will search for information about the topic',
                    action: 'search for "automatic transitions"',
                    thoughtNumber: 2,
                    totalThoughts: 5,
                    nextThoughtNeeded: true
                }
            },
            id: 2
        });
    }, 2000);
    
    // Test 3: Provide observation to continue flow
    setTimeout(() => {
        console.log('\nTest 3: Providing observation');
        sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'think-strategies',
                arguments: {
                    strategy: 'react',
                    thought: 'Based on the search results, I found relevant information',
                    observation: 'Found documentation about automatic state transitions in MCP',
                    thoughtNumber: 3,
                    totalThoughts: 5,
                    nextThoughtNeeded: true
                }
            },
            id: 3
        });
    }, 4000);
    
    // Cleanup
    setTimeout(() => {
        server.kill();
        process.exit(0);
    }, 6000);
}, 1000);