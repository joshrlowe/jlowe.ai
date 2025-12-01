# MongoDB to PostgreSQL Migration Guide

This guide walks you through migrating your jlowe.ai portfolio from MongoDB to PostgreSQL with Prisma.

## Table of Contents

1. [Why PostgreSQL + Prisma?](#why-postgresql--prisma)
2. [Schema Overview](#schema-overview)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Post-Migration Tasks](#post-migration-tasks)
6. [Rollback Plan](#rollback-plan)

---

## Why PostgreSQL + Prisma?

### Advantages for Your Portfolio

**PostgreSQL Benefits:**
- ✅ **Relational Data** - Perfect for users → blog posts → comments → likes
- ✅ **Data Integrity** - Foreign keys ensure data consistency
- ✅ **ACID Compliance** - Reliable transactions
- ✅ **Better for Analytics** - Complex queries with JOINs
- ✅ **Free Hosting** - Generous free tiers (Supabase, Railway, Neon)

**Prisma Benefits:**
- ✅ **Type Safety** - Auto-generated TypeScript types
- ✅ **Intuitive API** - Clean, easy-to-use query syntax
- ✅ **Migrations** - Version-controlled database schema changes
- ✅ **Prisma Studio** - Visual database browser
- ✅ **Great Developer Experience** - Autocomplete, validation

---

## Schema Overview

### New Database Structure

The Prisma schema includes:

#### **Existing Content (Migrated)**
- `Welcome` - Home page content (singleton)
- `About` - Professional summary with normalized relations:
  - `TechnicalSkill` - Skills with expertise levels
  - `SkillProject` - Projects related to skills
  - `ProfessionalExperience` - Work history
  - `Education` - Educational background
  - `Certification` - Technical certifications
  - `LeadershipExperience` - Leadership roles
- `Project` - Portfolio projects with:
  - `TeamMember` - Project team members
  - `TechStack` - Technology stack details
- `Contact` - Contact information (singleton)

#### **New Features (Blog System)**
- `User` - User authentication with roles (ADMIN/USER)
- `BlogPost` - Blog posts (replaces Resources)
  - Status: DRAFT, PUBLISHED, ARCHIVED
  - Content types: ARTICLE, VIDEO
  - View counts, featured posts
- `Tag` - Blog post tags
- `Comment` - Blog post comments with nested replies
- `Like` - Blog post likes (one per user per post)
- `EmailSubscription` - Email notification preferences

### Key Design Decisions

1. **Normalized Relations** - Skills, experiences, education are separate tables linked to About
2. **Singleton Pattern** - Welcome, About, Contact maintain single records
3. **Soft Deletes** - User accounts can be deactivated without data loss
4. **Flexible JSON Fields** - Complex nested data (tech stack integrations) stored as JSON
5. **Cascading Deletes** - When a blog post is deleted, comments and likes are automatically removed
6. **Unique Constraints** - Users can't like the same post twice, slugs are unique
7. **Indexes** - Optimized for common queries (by slug, by status, by date)

---

## Prerequisites

### 1. Set Up PostgreSQL Database

You have several options:

#### **Option A: Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the database connection string from Settings → Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### **Option B: Railway**
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string

#### **Option C: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### **Option D: Local PostgreSQL**
```bash
# Install PostgreSQL
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start

# Create database
createdb jloweai
```

### 2. Update Environment Variables

Create or update your `.env` file:

```env
# MongoDB (keep this during migration)
MONGODB_URI=mongodb://localhost:27017/jloweai

# PostgreSQL (new)
DATABASE_URL=postgresql://username:password@localhost:5432/jloweai?schema=public

# Application
NODE_ENV=development
```

---

## Step-by-Step Migration

### Step 1: Install Dependencies

Prisma is already installed. Verify:

```bash
npm list prisma @prisma/client
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client with TypeScript types based on your schema.

### Step 3: Create Database Migration

```bash
npx prisma migrate dev --name initial_migration
```

This will:
- Create all tables in PostgreSQL
- Generate migration files in `prisma/migrations/`
- Apply the migration to your database

### Step 4: Run Data Migration Script

```bash
node scripts/migrate-mongodb-to-postgres.js
```

This script will:
- ✅ Connect to MongoDB and PostgreSQL
- ✅ Migrate Welcome data
- ✅ Migrate About data with all relations (skills, experience, education, certifications, leadership)
- ✅ Migrate Projects with team members and tech stacks
- ✅ Migrate Contact data
- ✅ Convert Resources to BlogPosts
- ✅ Create an admin user if none exists

**Important:** If an admin user is created with default credentials, **change the password immediately**!

### Step 5: Verify Migration

Use Prisma Studio to browse your data:

```bash
npx prisma studio
```

This opens a visual database browser at http://localhost:5555

Check:
- ✅ All tables have been created
- ✅ Data has been migrated correctly
- ✅ Relationships are properly connected

### Step 6: Update API Routes

You'll need to update your API routes to use Prisma instead of Mongoose.

#### Example: Update `/api/welcome`

**Before (Mongoose):**
```javascript
import dbConnect from "@/lib/mongodb";
import Welcome from "@/models/Welcome";

export default async function handler(req, res) {
  await dbConnect();
  const data = await Welcome.findOne();
  res.status(200).json(data);
}
```

**After (Prisma):**
```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const data = await prisma.welcome.findFirst();
  res.status(200).json(data);
}
```

See the [API Routes Update Guide](#api-routes-update-guide) below for all routes.

### Step 7: Test Your Application

```bash
npm run dev
```

Visit your pages and verify:
- ✅ Home page loads
- ✅ About page loads with all sections
- ✅ Projects page loads with project details
- ✅ Contact page loads
- ✅ Resources/Blog page loads

### Step 8: Clean Up (Optional)

Once everything is working:

```bash
# Remove MongoDB dependencies (optional - keep during transition)
npm uninstall mongoose

# Remove MongoDB models (after verifying everything works)
rm -rf models/
rm lib/mongodb.js
```

---

## API Routes Update Guide

Here's how to update each API route:

### `/api/welcome`

```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await prisma.welcome.findFirst();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch welcome data" });
    }
  } else if (req.method === "POST") {
    try {
      const { name, briefBio, callToAction } = req.body;

      // Delete existing and create new (singleton pattern)
      await prisma.welcome.deleteMany();
      const data = await prisma.welcome.create({
        data: { name, briefBio, callToAction },
      });

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create welcome data" });
    }
  }
}
```

### `/api/about`

```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await prisma.about.findFirst({
        include: {
          technicalSkills: {
            include: {
              projects: true,
            },
          },
          experiences: true,
          education: true,
          certifications: true,
          leadership: true,
        },
      });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch about data" });
    }
  }
}
```

### `/api/projects`

```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const projects = await prisma.project.findMany({
        include: {
          team: true,
          techStack: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  } else if (req.method === "POST") {
    try {
      const { title, description, team, techStack, ...rest } = req.body;

      const project = await prisma.project.create({
        data: {
          title,
          description,
          ...rest,
          team: {
            create: team || [],
          },
          techStack: techStack ? {
            create: techStack,
          } : undefined,
        },
        include: {
          team: true,
          techStack: true,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  }
}
```

### `/api/contact`

```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await prisma.contact.findFirst();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact data" });
    }
  }
}
```

### `/api/blog` (new - replaces resources)

```javascript
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          tags: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  }
}
```

---

## Post-Migration Tasks

### 1. Update Frontend Components

Update your components to match the new data structure from Prisma.

#### Example: About Page

**Before:**
```javascript
const aboutData = await fetch('/api/about').then(r => r.json());
// aboutData.technicalSkills is an array embedded in the document
```

**After:**
```javascript
const aboutData = await fetch('/api/about').then(r => r.json());
// aboutData.technicalSkills is now a normalized relation
// Same structure, but with proper IDs and relations
```

### 2. Set Up Authentication (Next Phase)

With Prisma in place, you can now add authentication:

```bash
npm install next-auth @next-auth/prisma-adapter bcrypt
```

### 3. Build Blog Features

Now you can implement:
- ✅ Blog post creation (admin only)
- ✅ Comments system
- ✅ Like functionality
- ✅ Email subscriptions

---

## Rollback Plan

If something goes wrong during migration:

### Keep MongoDB Running

Don't remove MongoDB until you're 100% confident the migration worked.

### Rollback Steps

1. **Stop using Prisma routes:**
   ```bash
   git checkout main  # or your previous branch
   ```

2. **Your MongoDB data is still intact** - the migration only reads from MongoDB

3. **Drop PostgreSQL database** (if you want to start over):
   ```bash
   npx prisma migrate reset
   ```

---

## Troubleshooting

### Connection Issues

**Error:** `Can't reach database server`

**Solution:** Verify your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### Migration Fails

**Error:** `Migration failed to apply`

**Solution:**
```bash
# Reset database and try again
npx prisma migrate reset
npx prisma migrate dev
```

### Data Not Migrating

**Error:** Script fails partway through

**Solution:**
- Check MongoDB connection is still active
- Verify all environment variables are set
- Check console logs for specific error messages
- The script is idempotent - you can run it multiple times

---

## Next Steps

After successful migration:

1. ✅ **Test thoroughly** - Ensure all pages load correctly
2. ✅ **Update all API routes** - Migrate from Mongoose to Prisma
3. ✅ **Add authentication** - Set up NextAuth.js
4. ✅ **Build blog system** - Create admin dashboard for blog management
5. ✅ **Enhance frontend** - Add modern UI with animations

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)

---

## Support

If you encounter any issues during migration, check:

1. Environment variables are correctly set
2. PostgreSQL is running and accessible
3. MongoDB connection still works (during migration)
4. Prisma Client is generated (`npx prisma generate`)
5. Database migrations are applied (`npx prisma migrate dev`)

Good luck with your migration! 🚀
