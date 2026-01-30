import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findBlocks() {
  try {
    const result = await pool.query(`
      SELECT pb.id, pb.type, pb.position, pb.content::text as content
      FROM page_blocks pb
      JOIN pages p ON pb.page_id = p.id
      WHERE p.slug LIKE '%trilogy%'
      ORDER BY pb.position
    `);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

findBlocks();
