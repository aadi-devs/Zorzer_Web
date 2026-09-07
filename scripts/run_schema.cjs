const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'create_schema.sql'), 'utf8');

const client = new Client({
  host: 'db.fyzbqbubsdkjrmppkdsl.supabase.co',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: 'Harpal@1982.',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase.');
    // Split on semicolons and run each statement
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const firstLine = stmt.split('\n')[0].slice(0, 80);
        console.log('OK:', firstLine);
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log('SKIP (exists):', stmt.split('\n')[0].slice(0, 60));
        } else {
          console.error('ERR:', e.message, '\n  on:', stmt.split('\n')[0].slice(0, 60));
        }
      }
    }
    console.log('\nDone.');
  } finally {
    await client.end();
  }
}

run().catch(console.error);
