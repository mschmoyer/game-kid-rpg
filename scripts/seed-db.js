#!/usr/bin/env node
/**
 * Database seed script - runs SQL seed files against the database
 * Works with both local PostgreSQL and Heroku
 *
 * Usage:
 *   npm run db:seed           # Seed local database
 *   npm run db:seed:heroku    # Seed Heroku database
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isHeroku = process.argv.includes('--heroku');
const seedFile = path.join(__dirname, '..', 'db', 'init-db-data.sql');

if (!fs.existsSync(seedFile)) {
    console.error(`Seed file not found: ${seedFile}`);
    process.exit(1);
}

console.log(`Seeding database from: ${seedFile}`);
console.log(`Target: ${isHeroku ? 'Heroku' : 'Local'}`);

// Read and parse the SQL file
const sqlContent = fs.readFileSync(seedFile, 'utf-8');

// Split into individual statements (handle multi-line statements)
const statements = [];
let currentStatement = '';

for (const line of sqlContent.split('\n')) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--')) {
        continue;
    }

    currentStatement += line + '\n';

    // Statement ends with semicolon
    if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
    }
}

// Add any remaining statement
if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
}

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Execute each statement
let successCount = 0;
let errorCount = 0;

for (const statement of statements) {
    // Get a preview of the statement (first line or first 60 chars)
    const preview = statement.split('\n')[0].substring(0, 60);

    try {
        if (isHeroku) {
            // Escape single quotes for shell
            const escapedStatement = statement.replace(/'/g, "'\\''");
            execSync(`heroku pg:psql -c '${escapedStatement}'`, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });
        } else {
            // Use DATABASE_URL from environment
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) {
                console.error('DATABASE_URL not set. Run: source .env');
                process.exit(1);
            }
            execSync(`psql "${dbUrl}" -c "${statement.replace(/"/g, '\\"')}"`, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });
        }
        console.log(`✓ ${preview}...`);
        successCount++;
    } catch (error) {
        // Check if it's just a "already exists" or "0 rows" type message
        const stderr = error.stderr || '';
        if (stderr.includes('already exists') || stderr.includes('duplicate key')) {
            console.log(`○ ${preview}... (skipped - already exists)`);
            successCount++;
        } else {
            console.error(`✗ ${preview}...`);
            console.error(`  Error: ${stderr || error.message}`);
            errorCount++;
        }
    }
}

console.log(`\nSeed complete: ${successCount} succeeded, ${errorCount} failed`);
process.exit(errorCount > 0 ? 1 : 0);
