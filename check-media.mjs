import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const mediaCount = await db.select().from(schema.media);
console.log('Media count:', mediaCount.length);
console.log('Media items:', mediaCount.slice(0, 5));

await connection.end();
