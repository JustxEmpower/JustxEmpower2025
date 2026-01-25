#!/usr/bin/env python3
"""
Transfer page content from /workshops-programs to /overview
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'justxempower.db')
print(f"Connecting to: {db_path}")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Find the workshops-programs page
c.execute("SELECT id, title, slug FROM pages WHERE slug = 'workshops-programs'")
workshops_page = c.fetchone()
print(f"Workshops page: {dict(workshops_page) if workshops_page else 'NOT FOUND'}")

# Check if overview page exists
c.execute("SELECT id, title, slug FROM pages WHERE slug = 'overview'")
overview_page = c.fetchone()
print(f"Overview page: {dict(overview_page) if overview_page else 'NOT FOUND'}")

if workshops_page:
    workshops_id = workshops_page['id']
    
    # Count blocks on workshops-programs page
    c.execute("SELECT COUNT(*) as count FROM pageBlocks WHERE pageId = ?", (workshops_id,))
    block_count = c.fetchone()['count']
    print(f"Blocks on workshops-programs page: {block_count}")
    
    if overview_page:
        overview_id = overview_page['id']
        
        # Transfer blocks from workshops-programs to overview
        c.execute("UPDATE pageBlocks SET pageId = ? WHERE pageId = ?", (overview_id, workshops_id))
        print(f"Transferred {c.rowcount} blocks to overview page")
        
        # Also transfer page sections if any
        c.execute("UPDATE pageSections SET pageId = ? WHERE pageId = ?", (overview_id, workshops_id))
        print(f"Transferred {c.rowcount} page sections to overview page")
    else:
        # No overview page exists, just rename the slug
        c.execute("UPDATE pages SET slug = 'overview' WHERE id = ?", (workshops_id,))
        print(f"Renamed workshops-programs page slug to 'overview'")

conn.commit()
print("Done!")
conn.close()
