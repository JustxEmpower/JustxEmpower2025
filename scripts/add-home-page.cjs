// Use require with module path resolution
const path = require('path');
const dbPath = path.resolve(__dirname, '../node_modules/better-sqlite3');
const Database = require(dbPath);
const db = new Database(path.resolve(__dirname, '../data/justxempower.db'));

// Add home page if it doesn't exist
const result = db.prepare(`
  INSERT OR IGNORE INTO pages (slug, title, published, showInNav, template, createdAt, updatedAt) 
  VALUES ('home', 'Home', 1, 0, 'default', datetime('now'), datetime('now'))
`).run();

console.log('Home page insert result:', result);

// Verify it exists
const pages = db.prepare("SELECT slug, title FROM pages WHERE slug = 'home'").all();
console.log('Home page in database:', pages);

db.close();
