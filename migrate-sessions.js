#!/usr/bin/env node

/**
 * One-time migration tool to update old thinking sessions with consistent JSON structure
 * 
 * This script adds missing fields to old sessions:
 * - sessionPurpose: null (will show as fallback descriptions)
 * - qualityRating: null 
 * - automaticMetrics: null
 * 
 * Usage: node migrate-sessions.js [storage-path]
 * Default storage path: ~/Documents/thinking
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SessionMigrator {
    constructor(storagePath) {
        this.storagePath = storagePath || path.join(os.homedir(), 'Documents', 'thinking');
        this.migrationStats = {
            total: 0,
            migrated: 0,
            skipped: 0,
            errors: 0,
            errorDetails: []
        };
    }

    async migrate() {
        console.log(`🔄 Starting migration of sessions in: ${this.storagePath}`);
        
        if (!await fs.pathExists(this.storagePath)) {
            console.log(`❌ Storage path does not exist: ${this.storagePath}`);
            return this.migrationStats;
        }

        const sessionDirs = await fs.readdir(this.storagePath);
        
        for (const dir of sessionDirs) {
            const sessionPath = path.join(this.storagePath, dir);
            const sessionFilePath = path.join(sessionPath, 'session.json');
            
            // Skip if not a directory or no session.json
            if (!await fs.stat(sessionPath).then(s => s.isDirectory()).catch(() => false)) {
                continue;
            }
            
            if (!await fs.pathExists(sessionFilePath)) {
                continue;
            }
            
            this.migrationStats.total++;
            
            try {
                await this.migrateSession(sessionFilePath, dir);
            } catch (error) {
                this.migrationStats.errors++;
                this.migrationStats.errorDetails.push({
                    session: dir,
                    error: error.message
                });
                console.log(`❌ Error migrating ${dir}: ${error.message}`);
            }
        }
        
        this.printResults();
        return this.migrationStats;
    }

    async migrateSession(sessionFilePath, sessionId) {
        const sessionData = await fs.readJson(sessionFilePath);
        
        // Check if already migrated (has new fields)
        if (this.hasNewFields(sessionData)) {
            console.log(`⏭️  Skipping ${sessionId} (already migrated)`);
            this.migrationStats.skipped++;
            return;
        }
        
        // Create backup
        const backupPath = sessionFilePath.replace('.json', '.json.backup');
        await fs.copy(sessionFilePath, backupPath);
        
        // Add missing fields
        const migratedData = {
            ...sessionData,
            // Add sessionPurpose (null - will use fallback logic)
            sessionPurpose: sessionData.sessionPurpose ?? null,
            
            // Add qualityRating structure
            qualityRating: sessionData.qualityRating ?? null,
            
            // Add automaticMetrics structure  
            automaticMetrics: sessionData.automaticMetrics ?? null
        };
        
        // Write migrated session
        await fs.writeJson(sessionFilePath, migratedData, { spaces: 2 });
        
        console.log(`✅ Migrated ${sessionId}`);
        this.migrationStats.migrated++;
    }

    hasNewFields(sessionData) {
        return (
            sessionData.hasOwnProperty('sessionPurpose') &&
            sessionData.hasOwnProperty('qualityRating') &&
            sessionData.hasOwnProperty('automaticMetrics')
        );
    }

    printResults() {
        console.log('\n📊 Migration Results:');
        console.log(`Total sessions found: ${this.migrationStats.total}`);
        console.log(`✅ Successfully migrated: ${this.migrationStats.migrated}`);
        console.log(`⏭️  Already migrated (skipped): ${this.migrationStats.skipped}`);
        console.log(`❌ Errors: ${this.migrationStats.errors}`);
        
        if (this.migrationStats.errorDetails.length > 0) {
            console.log('\nError details:');
            this.migrationStats.errorDetails.forEach(({ session, error }) => {
                console.log(`  ${session}: ${error}`);
            });
        }
        
        console.log('\n🎉 Migration completed!');
        console.log('💡 Old session files backed up with .backup extension');
    }
}

// CLI execution
async function main() {
    const storagePath = process.argv[2];
    const migrator = new SessionMigrator(storagePath);
    
    try {
        await migrator.migrate();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default SessionMigrator;