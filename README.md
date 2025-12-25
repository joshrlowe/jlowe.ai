# jlowe.ai

Personal portfolio website built with Next.js, featuring projects, articles, and an admin panel for content management.

## Tech Stack

- **Framework**: Next.js 15.1.4 (Pages Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: CSS Modules, Bootstrap, Design System
- **Animations**: GSAP (GreenSock Animation Platform)
- **Content**: Markdown support with syntax highlighting
- **Deployment**: Vercel

## Features

### Public Site
- **Home Page**: Hero section, featured projects, quick stats, tech stack showcase, recent articles
- **Projects Page**: Portfolio projects with filtering, sorting, search, and infinite scroll
- **About Page**: Professional summary, technical skills, experience, education, certifications
- **Articles/Blog**: Full blog system with posts, playlists, comments, likes, and newsletter subscriptions
- **Contact Page**: Contact information and form

### Admin Panel
- **Authentication**: Secure login with NextAuth.js
- **Content Management**: Edit site settings, page content, and projects
- **Articles Management**: Full CRUD for blog posts
- **Activity Logging**: Track all admin actions
- **Bulk Operations**: Manage multiple projects at once
- **SEO Management**: Meta tags, Open Graph, and structured data

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- MongoDB (for initial data migration, optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd jlowe.ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jloweai?schema=public"

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here-generate-a-random-string
NEXTAUTH_URL=http://localhost:3000

# Admin User (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password-here

# MongoDB (for migration only, optional)
MONGODB_URL=mongodb://localhost:27017/jloweai

# Environment
NODE_ENV=development
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

4. **Set up the database**

Generate Prisma Client:
```bash
npm run prisma:generate
```

Test database connection:
```bash
npm run prisma:test-connection
```

Create database schema:
```bash
npm run prisma:migrate
```

5. **Seed admin user**
```bash
npm run seed:admin
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the site.

## Database Migration

### Migrating from MongoDB to PostgreSQL

If you have existing MongoDB data to migrate:

1. **Ensure MongoDB connection is configured** in `.env`
2. **Run the migration script**:
```bash
npm run prisma:migrate-data
```

This script will:
- Connect to MongoDB and PostgreSQL
- Export data from MongoDB collections (Welcome, About, Contact, Projects, Resources)
- Transform and import data into PostgreSQL
- Handle data type conversions and relationships

**Note**: 
- MongoDB data remains untouched (backup still available)
- PostgreSQL data is deleted before import (ensures clean migration)
- Use direct `postgres://` URL for migrations (not Prisma Accelerate URL)

### Migrating Resources to Posts

If you have resources that need to be converted to the new Articles/Posts system:

```bash
npm run prisma:migrate-resources-to-posts
```

## Admin Panel Setup

### Access Admin Panel

1. Navigate to `/admin/login`
2. Log in with credentials from your `.env` file (`ADMIN_EMAIL` and `ADMIN_PASSWORD`)
3. You'll be redirected to `/admin/settings`

### Admin Features

- **Global Settings**: Site name, footer text, social media links, navigation
- **Home Page**: Hero section, highlights, featured projects
- **About Page**: Bio, skills, resume URL
- **Projects**: Full CRUD with bulk operations, team members, dates, SEO fields
- **Articles**: Manage blog posts, playlists, comments
- **Contact**: Contact page content and form settings

### Admin API Routes

All admin routes are protected and require authentication:

- `GET/PUT /api/admin/site-settings` - Global settings
- `GET/PUT /api/admin/page-content?pageKey={pageKey}` - Page content
- `GET/POST /api/admin/projects` - Projects CRUD
- `GET/PUT/DELETE /api/admin/projects/[id]` - Individual project operations
- `POST /api/admin/projects/bulk` - Bulk operations
- `GET /api/admin/activity-log` - Activity history

## Articles/Blog System

The site includes a full blog system with:

### Features
- **Posts**: Articles and videos with markdown support
- **Playlists**: Collections of related posts
- **Comments**: Moderated comment system
- **Likes**: IP-based like tracking
- **Newsletter**: Email subscription management
- **SEO**: Meta tags, Open Graph, structured data

### URL Structure
- List: `/articles`
- Post: `/articles/[topic]/[slug]`
- Playlist: `/articles/playlist/[slug]`

### Admin Articles Management
- Access at `/admin/articles`
- Create, edit, publish/unpublish posts
- Filter by status, topic, and search
- Manage playlists and comments

## Project Structure

```
├── components/          # React components
│   ├── About/          # About page components
│   ├── Articles/       # Blog/article components
│   ├── Project/        # Project-related components
│   └── admin/          # Admin panel components
├── lib/                # Utility functions and configs
│   ├── prisma.js       # Prisma client instance
│   └── utils/          # Utility functions
├── pages/              # Next.js pages and API routes
│   ├── api/            # API endpoints
│   ├── admin/          # Admin pages
│   └── articles/       # Article pages
├── prisma/             # Prisma schema and migrations
│   └── schema.prisma   # Database schema
├── public/             # Static assets
├── scripts/            # Utility scripts
│   ├── migrate-data.js # MongoDB to PostgreSQL migration
│   └── seed-admin.js   # Admin user seeder
└── styles/             # CSS modules and global styles
    └── design-system.css # Design tokens
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate           # Generate Prisma Client
npm run prisma:migrate            # Create and run migrations
npm run prisma:studio             # Open Prisma Studio (database GUI)
npm run prisma:test-connection    # Test database connection
npm run prisma:migrate-data       # Migrate data from MongoDB
npm run prisma:migrate-resources-to-posts  # Convert resources to posts

# Admin
npm run seed:admin       # Create admin user

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
```

## Design System

The project uses a centralized design system (`styles/design-system.css`) with CSS custom properties:

- **Colors**: Primary red (#bb1313), backgrounds, text colors
- **Typography**: 12 font sizes (xs to 8xl)
- **Spacing**: 8 spacing values
- **Shadows**: 4 shadow levels
- **Transitions**: Consistent timing functions
- **Z-index**: Layering scale

## Animations

The site uses GSAP for animations:
- Scroll-triggered animations on project cards
- Entrance animations on page load
- Hover effects and micro-interactions
- Respects `prefers-reduced-motion` for accessibility

## Testing

The project includes a test suite using Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in `__tests__/` directory.

## Refactoring

The codebase follows Martin Fowler's refactoring principles:
- Small, safe, behavior-preserving steps
- Tests written before refactoring
- Code smells addressed systematically
- Utilities extracted for reusability
- Constants extracted for maintainability

See `REFACTORING_LOG.md` for detailed refactoring history (if exists).

## Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL` (direct postgres URL for migrations)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`

3. **Deploy**: Vercel will automatically:
   - Run `npm install`
   - Run `prisma generate` (via postinstall script)
   - Build the application
   - Deploy to production

### Database Setup on Vercel

1. Install the [Prisma Postgres integration](https://vercel.com/marketplace/prisma) from Vercel marketplace
2. Create a new database
3. Link it to your project
4. The `DATABASE_URL` will be automatically set

**Important**: For migrations, use the direct `postgres://` URL. For production app queries, you can use Prisma Accelerate URL for better performance.

### Post-Deployment

After deployment:
1. Run database migrations: `npx prisma migrate deploy` (or use Vercel CLI)
2. Seed admin user: `npm run seed:admin` (or create via API)
3. Verify admin panel access at `/admin/login`

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Check database is accessible from your network
- For Vercel, ensure database is linked to project
- Test connection: `npm run prisma:test-connection`

### Migration Issues
- Ensure MongoDB is accessible (if migrating)
- Verify Prisma migrations have been run
- Check database has required tables
- Review error messages in migration script output

### Admin Panel Issues
- Verify admin user exists: `npm run seed:admin`
- Check `NEXTAUTH_SECRET` is set correctly
- Verify credentials match `.env` file
- Clear cookies and log in again

### Build Errors
- Ensure Prisma Client is generated: `npm run prisma:generate`
- Check all environment variables are set
- Verify Node.js version is 18+
- Check for TypeScript errors if using TypeScript

### Hydration Errors
- Ensure no Link components wrap `<article>` elements
- Check for nested anchor tags
- Verify server and client render the same HTML
- Use `suppressHydrationWarning` sparingly and appropriately

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth.js (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Base URL of your application |
| `ADMIN_EMAIL` | Yes | Admin user email |
| `ADMIN_PASSWORD` | Yes | Admin user password |
| `MONGODB_URL` | No | MongoDB connection (for migration only) |
| `NODE_ENV` | No | Environment (development/production) |
| `PRISMA_DATABASE_URL` | No | Prisma Accelerate URL (optional, for production) |

## License

Private project - All rights reserved

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Prisma schema: `prisma/schema.prisma`
- Check API routes: `pages/api/**`
- Review component files: `components/**`

---

Built with ❤️ using Next.js and Prisma
