import 'dotenv/config';
import mysql from 'mysql2/promise';
import { hash } from 'bcrypt';

async function resetPassword() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check existing admin users
  const [users] = await conn.execute('SELECT id, username, email FROM adminUsers');
  console.log('Existing admin users:', JSON.stringify(users, null, 2));
  
  // Hash the new password using bcrypt (matches server implementation)
  const newPassword = 'EmpowerX2025';
  const hashedPassword = await hash(newPassword, 10);
  
  // Check if JusticeEmpower exists
  const [existing] = await conn.execute('SELECT id FROM adminUsers WHERE username = ?', ['JusticeEmpower']);
  
  if (existing.length > 0) {
    // Update existing user's password (column is passwordHash, not password)
    await conn.execute('UPDATE adminUsers SET passwordHash = ? WHERE username = ?', [hashedPassword, 'JusticeEmpower']);
    console.log('Password updated for JusticeEmpower');
  } else {
    // Create new admin user
    await conn.execute(
      'INSERT INTO adminUsers (username, passwordHash, email, role) VALUES (?, ?, ?, ?)',
      ['JusticeEmpower', hashedPassword, 'admin@justxempower.com', 'admin']
    );
    console.log('Created new admin user: JusticeEmpower');
  }
  
  await conn.end();
  console.log('Done! You can now login with:');
  console.log('Username: JusticeEmpower');
  console.log('Password: EmpowerX2025');
  process.exit(0);
}

resetPassword();
