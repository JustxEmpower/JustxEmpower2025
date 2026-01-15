require('dotenv').config();

module.exports = {
  apps: [{
    name: 'justxempower',
    script: 'dist/index.js',
    cwd: '/var/www/justxempower',
    node_args: '--dns-result-order=ipv4first',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 8083,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      ADMIN_TOKEN_SECRET: process.env.ADMIN_TOKEN_SECRET,
    }
  }]
};
