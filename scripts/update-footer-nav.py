#!/usr/bin/env python3
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'justxempower.db')
print(f"Connecting to: {db_path}")

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Show current footer nav
c.execute("SELECT id, label, url FROM navigation WHERE location='footer'")
print("Current footer nav:", c.fetchall())

# Update Journal to Blog
c.execute("UPDATE navigation SET label='Blog', url='/blog' WHERE location='footer' AND label='Journal'")
print(f"Journal -> Blog: {c.rowcount} rows updated")

# Update Events URL
c.execute("UPDATE navigation SET url='/community-events' WHERE location='footer' AND label='Events'")
print(f"Events -> /community-events: {c.rowcount} rows updated")

conn.commit()

# Show updated footer nav
c.execute("SELECT id, label, url FROM navigation WHERE location='footer'")
print("Updated footer nav:", c.fetchall())

conn.close()
print("Done!")
