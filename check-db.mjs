import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
  port: 3306,
  user: 'justxempower',
  password: 'JxE2025SecurePass!',
  database: 'justxempower'
});

console.log('Connected to database');

// Check media table
const [mediaRows] = await connection.execute('SELECT COUNT(*) as count FROM media');
console.log('Media count:', mediaRows[0].count);

const [mediaItems] = await connection.execute('SELECT id, filename, url, type FROM media LIMIT 5');
console.log('Sample media:', JSON.stringify(mediaItems, null, 2));

// Check pages table
const [pagesRows] = await connection.execute('SELECT COUNT(*) as count FROM pages');
console.log('Pages count:', pagesRows[0].count);

const [pageBuilderPages] = await connection.execute("SELECT id, title, slug, template FROM pages WHERE template = 'page-builder' LIMIT 5");
console.log('Page Builder pages:', JSON.stringify(pageBuilderPages, null, 2));

await connection.end();
