const Database = require('better-sqlite3');
const db = new Database('./data/justxempower.db');

// Check current footer navigation
const rows = db.prepare("SELECT id, label, url FROM navigation WHERE location = 'footer'").all();
console.log('Current footer nav:', rows);

// Update Journal to Blog with /blog URL
const journalUpdate = db.prepare("UPDATE navigation SET label = 'Blog', url = '/blog' WHERE location = 'footer' AND (label = 'Journal' OR url LIKE '%journal%')").run();
console.log('Journal -> Blog update:', journalUpdate.changes, 'rows');

// Update Events to /community-events
const eventsUpdate = db.prepare("UPDATE navigation SET url = '/community-events' WHERE location = 'footer' AND label = 'Events'").run();
console.log('Events URL update:', eventsUpdate.changes, 'rows');

// Show updated navigation
const updated = db.prepare("SELECT id, label, url FROM navigation WHERE location = 'footer'").all();
console.log('Updated footer nav:', updated);

db.close();
