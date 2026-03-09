#!/usr/bin/env node
/**
 * Test ALL_SQL_COPY_PASTE.sql against Supabase.
 * Requires: SUPABASE_DB_URL or DATABASE_URL in .env
 * Get it from: Supabase Dashboard > Settings > Database > Connection string (URI)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load .env files (simple parser, no extra deps)
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

// Build URL from password if not set (project ref from .env URL)
let dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl && process.env.SUPABASE_DB_PASSWORD && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (ref) {
    const pw = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
    dbUrl = `postgresql://postgres.${ref}:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }
}

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL');
  console.error('Option 1: Add SUPABASE_DB_URL to .env (from Supabase Dashboard > Settings > Database)');
  console.error('Option 2: Add SUPABASE_DB_PASSWORD to .env (CLI uses this when linked)');
  process.exit(1);
}

async function run() {
  const sqlPath = path.join(process.cwd(), 'ALL_SQL_COPY_PASTE.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('Connected. Running SQL (in transaction, will ROLLBACK)...\n');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('ROLLBACK');
    console.log('✓ SQL ran successfully (rolled back, no changes made)');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n✗ Error:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
