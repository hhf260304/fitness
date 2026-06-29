import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg'`
console.log('Done: weight_unit column added')
