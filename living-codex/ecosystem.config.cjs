module.exports = {
  apps: [{
    name: 'living-codex',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/var/www/justxempower/living-codex',
    node_args: '--dns-result-order=ipv4first',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'mysql://justxempower:JustEmpower2025Secure@justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com:3306/justxempower',
      NEXTAUTH_SECRET: 'justxempower-codex-session-secret-2025-secure',
      NEXTAUTH_URL: 'https://justxempower.com',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
      AWS_REGION: 'us-east-1',
      AWS_S3_BUCKET: 'justxempower-assets',
    }
  }]
};
