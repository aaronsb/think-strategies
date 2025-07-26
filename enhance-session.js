#!/usr/bin/env node

/**
 * Session Enhancement Tool
 * 
 * Analyzes existing thinking sessions and intelligently populates metadata:
 * - sessionPurpose: Extracted from session content and context
 * - qualityRating: Based on analysis of thinking effectiveness
 * - automaticMetrics: Calculated from session data
 * 
 * Usage: 
 *   node enhance-session.js <session-id> --purpose "Custom purpose" --quality '{"usefulness": 4, ...}'
 *   node enhance-session.js <session-id> --auto-analyze
 *   node enhance-session.js <session-id> --interactive
 * 
 * Examples:
 *   node enhance-session.js linear-session-20250726-142148 --auto-analyze
 *   node enhance-session.js react-session-20250726-001238 --purpose "MCP server workflow demonstration"
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SessionEnhancer {
    constructor(storagePath) {
        this.storagePath = storagePath || path.join(os.homedir(), 'Documents', 'thinking');
    }

    async enhanceSession(sessionId, options = {}) {
        const sessionPath = path.join(this.storagePath, sessionId, 'session.json');
        
        if (!await fs.pathExists(sessionPath)) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const sessionData = await fs.readJson(sessionPath);
        
        console.log(`\n🔍 Analyzing session: ${sessionId}`);
        console.log(`Strategy: ${sessionData.strategy}`);
        console.log(`Thoughts: ${sessionData.thoughtHistory.length}`);
        console.log(`Branches: ${Object.keys(sessionData.branches).length}`);

        // Create backup
        const backupPath = sessionPath.replace('.json', '.enhanced.backup');
        await fs.copy(sessionPath, backupPath);

        let enhancements = {};

        // Handle different enhancement modes
        if (options.autoAnalyze) {
            enhancements = await this.autoAnalyzeSession(sessionData);
        } else if (options.interactive) {
            enhancements = await this.interactiveEnhancement(sessionData);
        } else {
            // Manual enhancement from provided options
            if (options.purpose) enhancements.sessionPurpose = options.purpose;
            if (options.quality) enhancements.qualityRating = options.quality;
        }

        // Always recalculate automatic metrics
        enhancements.automaticMetrics = this.calculateAutomaticMetrics(sessionData);

        // Apply enhancements
        const enhancedData = {
            ...sessionData,
            ...enhancements
        };

        await fs.writeJson(sessionPath, enhancedData, { spaces: 2 });

        console.log(`\n✅ Enhanced session: ${sessionId}`);
        console.log(`📄 Backup created: ${path.basename(backupPath)}`);
        
        this.printEnhancements(enhancements);

        return enhancements;
    }

    async autoAnalyzeSession(sessionData) {
        console.log(`\n🤖 Auto-analyzing session content...`);
        
        const analysis = {
            sessionPurpose: this.extractPurpose(sessionData),
            qualityRating: this.calculateQualityRating(sessionData)
        };

        return analysis;
    }

    extractPurpose(sessionData) {
        const thoughtHistory = sessionData.thoughtHistory;
        const strategy = sessionData.strategy;
        
        if (thoughtHistory.length === 0) {
            return `${strategy} strategy session (no content)`;
        }

        const firstThought = thoughtHistory[0].thought;
        const lastThought = thoughtHistory[thoughtHistory.length - 1].thought;
        
        // Extract key topics and intent
        const allText = thoughtHistory.map(t => t.thought).join(' ').toLowerCase();
        
        // Look for explicit purpose statements
        const purposeIndicators = [
            /(?:i want to|i need to|goal is to|purpose is to|analyzing|exploring|testing|implementing|designing|reviewing|debugging|planning|solving)[\s\w]+/gi,
            /(?:this session|this thinking|this analysis)[\s\w]+/gi
        ];
        
        for (const indicator of purposeIndicators) {
            const matches = allText.match(indicator);
            if (matches && matches[0]) {
                let purpose = matches[0].charAt(0).toUpperCase() + matches[0].slice(1);
                if (purpose.length > 80) purpose = purpose.substring(0, 77) + '...';
                return purpose;
            }
        }

        // Fallback: analyze content topics
        const topics = this.extractTopics(thoughtHistory);
        const primaryTopic = topics[0]?.term || 'unknown';
        
        // Strategy-specific purpose generation
        const strategyPurposes = {
            'linear': `Linear analysis of ${primaryTopic}`,
            'chain_of_thought': `Step-by-step reasoning about ${primaryTopic}`,
            'react': `Interactive exploration of ${primaryTopic}`,
            'rewoo': `Planned execution workflow for ${primaryTopic}`,
            'tree_of_thoughts': `Multi-path exploration of ${primaryTopic}`,
            'step_back': `High-level analysis of ${primaryTopic}`,
            'self_ask': `Question-driven investigation of ${primaryTopic}`,
            'scratchpad': `Iterative calculation for ${primaryTopic}`,
            'trilemma': `Balanced optimization of ${primaryTopic}`,
            'self_consistency': `Consensus building on ${primaryTopic}`
        };

        return strategyPurposes[strategy] || `${strategy} strategy session on ${primaryTopic}`;
    }

    calculateQualityRating(sessionData) {
        const thoughtHistory = sessionData.thoughtHistory;
        const strategy = sessionData.strategy;
        
        if (thoughtHistory.length === 0) {
            return null; // Can't rate empty sessions
        }

        // Base metrics calculation
        const thoughtCount = thoughtHistory.length;
        const hasConclusion = thoughtHistory.some(t => t.finalAnswer || !t.nextThoughtNeeded);
        const hasActions = thoughtHistory.some(t => t.plannedActions || t.actionResults);
        const hasRevisions = thoughtHistory.some(t => t.isRevision);
        const avgThoughtLength = thoughtHistory.reduce((sum, t) => sum + t.thought.length, 0) / thoughtCount;
        
        // Quality scoring (1-5 scale)
        let usefulness = 3; // Base score
        if (hasConclusion) usefulness += 1;
        if (thoughtCount >= 5) usefulness += 0.5;
        if (avgThoughtLength > 200) usefulness += 0.5;
        usefulness = Math.min(5, Math.max(1, Math.round(usefulness)));

        let effectiveness = 3; // Base score
        if (hasConclusion) effectiveness += 1;
        if (thoughtCount >= 3 && thoughtCount <= 10) effectiveness += 1; // Sweet spot
        if (thoughtCount > 15) effectiveness -= 1; // Potentially verbose
        effectiveness = Math.min(5, Math.max(1, Math.round(effectiveness)));

        let clarity = 3; // Base score
        if (avgThoughtLength > 100 && avgThoughtLength < 500) clarity += 1; // Good detail level
        if (hasConclusion) clarity += 1;
        clarity = Math.min(5, Math.max(1, Math.round(clarity)));

        let insights = 3; // Base score
        if (hasConclusion) insights += 1;
        if (thoughtCount >= 5) insights += 0.5;
        if (hasRevisions) insights += 0.5; // Shows reflection
        insights = Math.min(5, Math.max(1, Math.round(insights)));

        // Strategy fit based on usage patterns
        let strategyFit = this.calculateStrategyFit(strategy, thoughtHistory);

        let efficiency = 3; // Base score
        if (thoughtCount <= 5 && hasConclusion) efficiency += 2; // Concise and complete
        else if (thoughtCount <= 10 && hasConclusion) efficiency += 1;
        else if (thoughtCount > 20) efficiency -= 1; // Potentially inefficient
        efficiency = Math.min(5, Math.max(1, Math.round(efficiency)));

        let actionability = 3; // Base score
        if (hasActions) actionability += 1;
        if (hasConclusion) actionability += 1;
        actionability = Math.min(5, Math.max(1, Math.round(actionability)));

        const reflection = this.generateReflection(thoughtHistory, {
            usefulness, effectiveness, clarity, insights, strategyFit, efficiency, actionability
        });

        return {
            usefulness,
            effectiveness,
            clarity,
            insights,
            strategyFit,
            efficiency,
            actionability,
            reflection
        };
    }

    calculateStrategyFit(strategy, thoughtHistory) {
        const hasActions = thoughtHistory.some(t => t.plannedActions || t.actionResults);
        const hasObservations = thoughtHistory.some(t => t.observation);
        const hasBranching = thoughtHistory.some(t => t.branchId);
        const hasRevisions = thoughtHistory.some(t => t.isRevision);

        switch (strategy) {
            case 'react':
                return hasActions && hasObservations ? 5 : 3;
            case 'rewoo':
                return hasActions ? 5 : 3;
            case 'tree_of_thoughts':
                return hasBranching ? 5 : 3;
            case 'linear':
                return hasRevisions ? 5 : 4; // Linear allows flexibility
            case 'chain_of_thought':
                return thoughtHistory.length >= 3 ? 4 : 3;
            default:
                return 4; // Default good fit
        }
    }

    generateReflection(thoughtHistory, ratings) {
        const avgRating = Object.values(ratings).reduce((sum, val) => sum + val, 0) / Object.keys(ratings).length;
        const thoughtCount = thoughtHistory.length;
        const hasConclusion = thoughtHistory.some(t => t.finalAnswer || !t.nextThoughtNeeded);

        if (avgRating >= 4.5) {
            return "Excellent thinking session with clear reasoning and actionable outcomes.";
        } else if (avgRating >= 4) {
            return "Strong thinking session with good progression and useful insights.";
        } else if (avgRating >= 3.5) {
            return "Solid thinking session with room for more depth or clearer conclusions.";
        } else if (avgRating >= 3) {
            return "Basic thinking session that covered the topic but could be more thorough.";
        } else {
            return "Limited thinking session that would benefit from more development.";
        }
    }

    calculateAutomaticMetrics(sessionData) {
        const thoughtHistory = sessionData.thoughtHistory;
        
        if (!sessionData.timestamp) {
            return null;
        }

        // Calculate approximate duration (if not already set)
        const duration = sessionData.automaticMetrics?.duration || 
            Math.max(1, Math.round(thoughtHistory.length * 2)); // Estimate 2 min per thought

        // Calculate iteration ratio
        const revisionCount = thoughtHistory.filter(t => t.isRevision).length;
        const iterationRatio = thoughtHistory.length > 0 ? 
            Math.round((revisionCount / thoughtHistory.length) * 100) / 100 : 0;

        // Check tool integration
        const toolIntegration = thoughtHistory.some(t => t.plannedActions || t.actionResults);

        return {
            duration,
            iterationRatio,
            toolIntegration
        };
    }

    extractTopics(thoughtHistory) {
        const allText = thoughtHistory.map(t => t.thought).join(' ');
        
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall']);
        
        const words = allText.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
        
        const wordCounts = {};
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        return Object.entries(wordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word, count]) => ({ term: word, frequency: count }));
    }

    printEnhancements(enhancements) {
        console.log(`\n📊 Applied Enhancements:`);
        
        if (enhancements.sessionPurpose) {
            console.log(`🎯 Purpose: ${enhancements.sessionPurpose}`);
        }
        
        if (enhancements.qualityRating) {
            const rating = enhancements.qualityRating;
            const avgScore = Object.values(rating).filter(v => typeof v === 'number')
                .reduce((sum, val, _, arr) => sum + val / arr.length, 0).toFixed(1);
            console.log(`⭐ Quality: ${avgScore}/5.0 average`);
            console.log(`   - Usefulness: ${rating.usefulness}/5`);
            console.log(`   - Effectiveness: ${rating.effectiveness}/5`);
            console.log(`   - Clarity: ${rating.clarity}/5`);
            console.log(`   - Insights: ${rating.insights}/5`);
            console.log(`   - Strategy Fit: ${rating.strategyFit}/5`);
            console.log(`   - Efficiency: ${rating.efficiency}/5`);
            console.log(`   - Actionability: ${rating.actionability}/5`);
            console.log(`💭 Reflection: ${rating.reflection}`);
        }
        
        if (enhancements.automaticMetrics) {
            const metrics = enhancements.automaticMetrics;
            console.log(`🔢 Metrics:`);
            console.log(`   - Duration: ${metrics.duration} minutes`);
            console.log(`   - Iteration Ratio: ${(metrics.iterationRatio * 100).toFixed(0)}%`);
            console.log(`   - Tool Integration: ${metrics.toolIntegration ? 'Yes' : 'No'}`);
        }
    }
}

// CLI handling
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage: node enhance-session.js <session-id> [options]

Options:
  --auto-analyze          Automatically analyze and populate all metadata
  --interactive          Interactive enhancement mode
  --purpose "text"       Set specific purpose
  --quality '{"usefulness": 4, ...}'  Set specific quality rating (JSON)
  --storage-path PATH    Custom storage path (default: ~/Documents/thinking)

Examples:
  node enhance-session.js linear-session-20250726-142148 --auto-analyze
  node enhance-session.js react-session-20250726-001238 --purpose "MCP workflow demo"
        `);
        process.exit(1);
    }

    const sessionId = args[0];
    let options = {};
    
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--auto-analyze':
                options.autoAnalyze = true;
                break;
            case '--interactive':
                options.interactive = true;
                break;
            case '--purpose':
                options.purpose = args[++i];
                break;
            case '--quality':
                try {
                    options.quality = JSON.parse(args[++i]);
                } catch (e) {
                    console.error('❌ Invalid JSON for quality rating');
                    process.exit(1);
                }
                break;
            case '--storage-path':
                options.storagePath = args[++i];
                break;
        }
    }

    try {
        const enhancer = new SessionEnhancer(options.storagePath);
        await enhancer.enhanceSession(sessionId, options);
        console.log('\n🎉 Enhancement completed successfully!');
    } catch (error) {
        console.error(`❌ Enhancement failed: ${error.message}`);
        process.exit(1);
    }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default SessionEnhancer;