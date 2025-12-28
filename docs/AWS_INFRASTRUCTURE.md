# Just Empower AWS Infrastructure Documentation

## Architecture Overview

The Just Empower platform is a full-stack web application with the following architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Main Site  │  │ Admin Portal│  │    Shop     │  │   Events    │ │
│  │  (Public)   │  │ (Protected) │  │  (Public)   │  │  (Public)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express + tRPC)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Content   │  │    Admin    │  │    Shop     │  │   Events    │ │
│  │   Router    │  │   Router    │  │   Router    │  │   Router    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │     AI      │  │  Analytics  │  │  Newsletter │  │    Media    │ │
│  │   Service   │  │   Router    │  │   Router    │  │   Router    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS SERVICES                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │   Amazon RDS        │  │        Amazon S3                     │   │
│  │   (MySQL/TiDB)      │  │   (Media Storage, Backups)          │   │
│  │                     │  │                                      │   │
│  │   - pages           │  │   - Images                          │   │
│  │   - siteContent     │  │   - Videos                          │   │
│  │   - products        │  │   - Documents                       │   │
│  │   - events          │  │   - Backups                         │   │
│  │   - articles        │  │                                      │   │
│  │   - media           │  │                                      │   │
│  │   - users           │  │                                      │   │
│  │   - analytics       │  │                                      │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Current AWS Services Used

### 1. Amazon RDS (MySQL/TiDB)
- **Purpose**: Primary database for all application data
- **Tables**: 20+ tables including pages, products, events, users, analytics
- **Connection**: Via `DATABASE_URL` environment variable

### 2. Amazon S3
- **Purpose**: File storage for media assets
- **Buckets**: 
  - Media uploads (images, videos)
  - Backup storage
- **Access**: Via AWS SDK with credentials

### 3. External Integrations
- **Stripe**: Payment processing (configured)
- **Mailchimp**: Newsletter management
- **Google Gemini**: AI chat assistant
- **Manus OAuth**: User authentication

## Database Schema Summary

### Core Content Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `pages` | Dynamic page management | id, title, slug, parentId, published |
| `siteContent` | CMS content blocks | page, section, field, value |
| `pageBlocks` | Visual block editor content | pageId, blockType, content, order |
| `articles` | Blog/journal posts | title, content, slug, published |

### Commerce Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Shop inventory | name, price, description, imageUrl |
| `events` | Event listings | title, date, location, capacity |
| `orders` | Purchase records | userId, total, status |
| `payments` | Payment transactions | orderId, stripeId, amount |

### User & Admin Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user` | OAuth users | openId, name, email, role |
| `adminUsers` | Admin portal access | username, passwordHash |
| `adminSessions` | Admin session tokens | token, username, expiresAt |

### Design & Settings Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `themeSettings` | Design system | colors, fonts, spacing |
| `brandAssets` | Logo & brand images | assetType, assetUrl |
| `seoSettings` | SEO configuration | metaTitle, metaDescription |
| `navigation` | Menu structure | location, label, url, order |

### Analytics Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `analyticsPageViews` | Page view tracking | pageUrl, visitorId, timestamp |
| `analyticsSessions` | User sessions | visitorId, startTime, endTime |
| `aiChatConversations` | AI chat history | visitorId, messages |

## Environment Variables Required

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Authentication
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login

# AI Integration
GEMINI_API_KEY=your_gemini_key

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# App Configuration
VITE_APP_ID=your_app_id
VITE_APP_TITLE=Just Empower 2025
VITE_APP_LOGO=/logo.svg
```

## Deployment Architecture

### Option 1: AWS Elastic Beanstalk (Recommended)
```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Elastic Beanstalk                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Application Load Balancer                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   EC2 #1    │  │   EC2 #2    │  │   EC2 #3    │              │
│  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │   RDS   │    │   S3    │    │  Route  │
        │ (MySQL) │    │ (Media) │    │   53    │
        └─────────┘    └─────────┘    └─────────┘
```

### Option 2: AWS ECS with Fargate
```
┌─────────────────────────────────────────────────────────────────┐
│                      AWS ECS Cluster                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Application Load Balancer                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Fargate Service (Auto-scaling)              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │    │
│  │  │ Task 1  │  │ Task 2  │  │ Task 3  │  │ Task N  │     │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Backup Strategy

### Automated Backups
1. **Database**: RDS automated backups (daily snapshots, 7-day retention)
2. **Code**: GitHub repository (JustxEmpower/JustxEmpower2025)
3. **Media**: S3 versioning enabled

### Manual Backup Scripts
```bash
# Export database to JSON
node scripts/export-database.mjs

# Create code backup
zip -r backup_$(date +%Y%m%d).zip ./client/src ./server ./drizzle

# Push to GitHub
git push github main
```

## Admin Dashboard Features

The admin dashboard provides complete control over:

1. **Content Management**
   - Pages Manager (create, edit, delete pages)
   - Content Editor (edit page content)
   - Block Editor (visual page builder)
   - Articles Manager (blog posts)
   - Media Library (images, videos)

2. **Commerce**
   - Products Manager
   - Orders & Payments
   - Revenue Analytics

3. **Events**
   - Event Creation
   - Attendee Management
   - Ticket Sales

4. **Design System**
   - Theme Settings (colors, fonts)
   - Brand Assets (logos, favicon)
   - Navigation Editor

5. **SEO & Analytics**
   - SEO Manager
   - Analytics Dashboard
   - AI Chat Analytics

6. **Settings**
   - User Management
   - Custom Code Injection
   - Backup & Restore

## Security Considerations

1. **Authentication**: Manus OAuth for users, session-based for admin
2. **Authorization**: Role-based access (admin, user)
3. **Data Protection**: HTTPS, encrypted database connections
4. **API Security**: tRPC with authentication middleware

## Scaling Recommendations

1. **Horizontal Scaling**: Add more EC2/Fargate instances behind ALB
2. **Database Scaling**: RDS read replicas for heavy read workloads
3. **CDN**: CloudFront for static assets and media
4. **Caching**: ElastiCache for session storage and API caching

## Monitoring & Logging

1. **CloudWatch**: Application logs, metrics, alarms
2. **X-Ray**: Distributed tracing
3. **Health Checks**: ALB health checks on `/api/health`

---

*Last Updated: December 28, 2024*
