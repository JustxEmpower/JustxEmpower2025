# Just Empower 2025

**Catalyzing the Rise of Her Through Embodied Transformation and Conscious Leadership**

---

## About Just Empower

Just Empower is a transformative platform dedicated to empowering women through embodied practices, conscious leadership, and sacred community. We create spaces where empowerment becomes embodiment—where women can discover their authentic power, heal ancestral patterns, and step into their fullest expression.

### Our Mission

To catalyze the rise of feminine leadership through transformative experiences that honor the sacred, embrace the body as a vessel of wisdom, and cultivate communities rooted in reciprocity and authenticity.

### Our Vision

A world where women lead from their deepest truth, where feminine wisdom is honored, and where conscious leadership transforms communities and cultures.

### Core Values

- **Embodiment**: Honoring the body as a source of wisdom and transformation
- **Sacred Reciprocity**: Building relationships rooted in mutual respect and exchange
- **Ancestral Healing**: Honoring lineage while creating new pathways forward
- **Authentic Expression**: Creating spaces for voices to be heard and honored
- **Conscious Leadership**: Leading from integrity, wisdom, and compassion

---

## Website Features

This website serves as the digital home for Just Empower, featuring:

### Public-Facing Features

- **Immersive Video Backgrounds**: Each page features cinematic video footage that creates an atmospheric, high-end experience
- **Smooth Scroll Animations**: GSAP-powered animations and Lenis smooth scrolling for fluid navigation
- **Dynamic Content**: All page content is database-driven and editable through the admin portal
- **Newsletter Integration**: Mailchimp-powered email subscriptions with multiple touchpoints (footer, popup, inline CTAs)
- **Journal/Blog**: Rich article system with categories and featured content
- **Responsive Design**: Mobile-first approach with elegant breakpoints

### Admin Portal Features

A comprehensive Content Management System (CMS) with:

- **Custom Authentication**: Secure login system for administrators
- **Content Editor**: Edit all page sections (hero titles, subtitles, descriptions, media URLs) through an intuitive interface
- **Article Manager**: Create, edit, and publish journal articles with rich text editing (React Quill)
- **Settings Management**: Update admin credentials and Mailchimp API configuration
- **Dashboard**: Overview of content statistics and quick actions

**Admin Access**: `/admin/login`

---

## Technical Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Wouter** for client-side routing
- **GSAP** for advanced animations
- **Lenis** for smooth scrolling
- **shadcn/ui** component library
- **React Hook Form** + **Zod** for form validation
- **React Quill** for rich text editing

### Backend
- **Node.js** with Express
- **tRPC** for type-safe API communication
- **Drizzle ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing

### Infrastructure
- **Vite** for build tooling
- **pnpm** for package management
- **Manus** for hosting and deployment
- **Mailchimp** for email marketing

---

## Project Structure

```
justxempower-2025/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (Home, About, Philosophy, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets (videos, images, logos)
├── server/                # Backend API
│   ├── routers.ts         # tRPC router definitions
│   ├── adminRouters.ts    # Admin-specific API routes
│   ├── newsletterRouter.ts # Mailchimp integration
│   ├── adminDb.ts         # Database helper functions
│   └── seed-complete.mjs  # Database seeding script
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database table definitions
└── shared/                # Shared types and constants
```

---

## Design Philosophy

The website embodies a **minimalist 'Jony Ive' aesthetic** inspired by Apple's design philosophy:

- **Generous Whitespace**: Content breathes with intentional spacing
- **Subtle Gradients**: Depth through gentle color transitions
- **Typography Hierarchy**: Clear visual structure through font weights and sizes
- **Rounded Corners**: Soft, approachable UI elements
- **Golden Accents**: Warm, empowering color palette (#d4af37)
- **Cinematic Media**: High-quality video and imagery throughout

---

## Getting Started

### Prerequisites
- Node.js 22.x
- pnpm 9.x
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/JustxEmpower/JustxEmpower2025.git
cd JustxEmpower2025

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and configure:
# - DATABASE_URL
# - JWT_SECRET
# - MAILCHIMP_API_KEY (optional)
# - MAILCHIMP_AUDIENCE_ID (optional)

# Push database schema
pnpm db:push

# Seed the database with initial content
pnpm exec tsx server/seed-complete.mjs

# Start development server
pnpm dev
```

### Admin Portal Setup

1. Navigate to `/admin/login`
2. Default credentials:
   - Username: `JusticeEmpower`
   - Password: `EmpowerX2025`
3. **Important**: Change your password immediately in Settings

### Mailchimp Integration

1. Log into the admin portal
2. Navigate to Settings
3. Enter your Mailchimp API Key and Audience ID
4. Save settings to activate newsletter subscriptions

---

## Database Schema

### Key Tables

- **adminUsers**: Admin authentication and settings
- **articles**: Journal/blog posts with rich content
- **siteContent**: Flexible content storage for all page sections

The `siteContent` table uses a flexible schema:
- `page`: Page identifier (home, about, philosophy, etc.)
- `section`: Section identifier (hero, philosophy, community, etc.)
- `contentKey`: Specific content field (title, subtitle, videoUrl, etc.)
- `contentValue`: The actual content (text, URLs, etc.)

This allows for unlimited content sections without schema changes.

---

## Deployment

The site is hosted on **Manus** with built-in:
- Automatic SSL certificates
- Custom domain support
- Database hosting
- File storage (S3)
- Environment variable management

To deploy:
1. Save a checkpoint in the admin interface
2. Click "Publish" in the Manus dashboard
3. Your site will be live at your custom domain

---

## Content Management

### Adding New Page Sections

1. Log into the admin portal
2. Go to Content Editor
3. Select the page tab
4. Add new sections by creating database entries with:
   - Page name
   - Section name
   - Content keys (title, description, imageUrl, etc.)
5. Update the corresponding page component to fetch and display the new content

### Managing Articles

1. Navigate to Articles in the admin portal
2. Click "New Article" to create content
3. Use the rich text editor for formatting
4. Set category, excerpt, and featured image
5. Publish when ready

---

## Contributing

This is a private project for Just Empower. For inquiries about the platform or technical questions, please contact the administrator.

---

## License

© 2025 Just Empower. All rights reserved.

---

## Contact

**Website**: [justxempower.com](https://justxempower.com)  
**Admin Portal**: `/admin/login`

---

*"Where Empowerment Becomes Embodiment"*
