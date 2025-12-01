# Database Schema Documentation

## Overview

This document provides a comprehensive overview of the PostgreSQL database schema for jlowe.ai, designed with **Prisma ORM v7**.

> **Note:** This project uses Prisma 7, which requires:
> - Database connection configured in `lib/prisma.js` (not in schema.prisma)
> - PostgreSQL adapter packages: `@prisma/adapter-pg` and `pg`
> - `DATABASE_URL` environment variable for connection string

## Architecture Principles

1. **Normalized Design** - Related data is split into separate tables with foreign keys
2. **Type Safety** - Prisma enums ensure valid values
3. **Performance** - Strategic indexes on frequently queried fields
4. **Data Integrity** - Cascading deletes and unique constraints
5. **Scalability** - Designed to support future features (analytics, search, etc.)

---

## Entity Relationship Overview

```
User
 ├─→ BlogPost (author)
 ├─→ Comment (author)
 ├─→ Like
 └─→ EmailSubscription

BlogPost
 ├─→ Tag (many-to-many)
 ├─→ Comment
 └─→ Like

Comment
 ├─→ Comment (nested replies)
 └─→ BlogPost

About (singleton)
 ├─→ TechnicalSkill
 ├─→ ProfessionalExperience
 ├─→ Education
 ├─→ Certification
 └─→ LeadershipExperience

TechnicalSkill
 └─→ SkillProject

Project
 ├─→ TeamMember
 └─→ TechStack (one-to-one)

Welcome (singleton)
Contact (singleton)
EmailSubscription
```

---

## Tables

### User Management

#### `User`

Stores user accounts for authentication and authorization.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `email` | String | Unique email address |
| `name` | String? | Display name |
| `password` | String | Hashed password (bcrypt) |
| `role` | UserRole | ADMIN or USER |
| `emailVerified` | DateTime? | Email verification timestamp |
| `image` | String? | Profile picture URL |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `email` (unique)
- `role`

**Relations:**
- Has many `BlogPost`
- Has many `Comment`
- Has many `Like`
- Has one `EmailSubscription`

**Use Cases:**
- Admin users can create/edit blog posts and portfolio content
- Regular users can comment and like blog posts
- Email verified users can receive blog notifications

---

### Blog System

#### `BlogPost`

Blog posts and articles (replaces the old Resources model).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `title` | String | Post title |
| `slug` | String | URL-friendly unique identifier |
| `description` | String | Short summary/excerpt |
| `content` | Text? | Markdown content for articles |
| `contentType` | ContentType | ARTICLE or VIDEO |
| `url` | String? | External URL for videos |
| `status` | BlogPostStatus | DRAFT, PUBLISHED, or ARCHIVED |
| `publishedAt` | DateTime? | Publication timestamp |
| `authorId` | String (FK) | Foreign key to User |
| `topic` | String | Main topic/category |
| `featured` | Boolean | Featured post flag |
| `viewCount` | Int | Page view counter |
| `metaTitle` | String? | SEO meta title |
| `metaDescription` | String? | SEO meta description |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `slug` (unique)
- `authorId`
- `topic`
- `status + publishedAt` (composite)
- `createdAt`

**Relations:**
- Belongs to `User` (author)
- Has many `Comment`
- Has many `Like`
- Has many `Tag` (many-to-many)

**Query Examples:**
```javascript
// Get published posts
const posts = await prisma.blogPost.findMany({
  where: { status: 'PUBLISHED' },
  include: {
    author: { select: { name: true } },
    tags: true,
    _count: { select: { comments: true, likes: true } }
  },
  orderBy: { publishedAt: 'desc' }
});

// Get post by slug with comments
const post = await prisma.blogPost.findUnique({
  where: { slug: 'my-post' },
  include: {
    author: true,
    comments: {
      include: { author: true, replies: true }
    },
    tags: true
  }
});
```

---

#### `Tag`

Tags for categorizing blog posts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String | Tag display name |
| `slug` | String | URL-friendly unique identifier |

**Indexes:**
- `slug` (unique)

**Relations:**
- Has many `BlogPost` (many-to-many)

---

#### `Comment`

Comments on blog posts with support for nested replies.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `content` | Text | Comment content |
| `blogPostId` | String (FK) | Foreign key to BlogPost |
| `authorId` | String (FK) | Foreign key to User |
| `parentId` | String? (FK) | Foreign key to parent Comment (for replies) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `blogPostId`
- `authorId`
- `parentId`
- `createdAt`

**Relations:**
- Belongs to `BlogPost`
- Belongs to `User` (author)
- Belongs to `Comment` (parent, optional)
- Has many `Comment` (replies)

**Query Examples:**
```javascript
// Get top-level comments with replies
const comments = await prisma.comment.findMany({
  where: {
    blogPostId: postId,
    parentId: null  // Top-level only
  },
  include: {
    author: { select: { name: true, image: true } },
    replies: {
      include: {
        author: { select: { name: true, image: true } }
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

#### `Like`

Likes on blog posts (one per user per post).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `blogPostId` | String (FK) | Foreign key to BlogPost |
| `userId` | String (FK) | Foreign key to User |
| `createdAt` | DateTime | Like timestamp |

**Indexes:**
- `blogPostId + userId` (unique composite)
- `blogPostId`
- `userId`

**Relations:**
- Belongs to `BlogPost`
- Belongs to `User`

**Query Examples:**
```javascript
// Toggle like
const existingLike = await prisma.like.findUnique({
  where: {
    blogPostId_userId: { blogPostId, userId }
  }
});

if (existingLike) {
  await prisma.like.delete({ where: { id: existingLike.id } });
} else {
  await prisma.like.create({ data: { blogPostId, userId } });
}

// Get like count
const likeCount = await prisma.like.count({
  where: { blogPostId }
});
```

---

#### `EmailSubscription`

Email subscription preferences for blog notifications.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `email` | String | Subscriber email (unique) |
| `isActive` | Boolean | Active subscription flag |
| `frequency` | String | immediate, daily, or weekly |
| `userId` | String? (FK) | Optional foreign key to User |
| `subscribedAt` | DateTime | Subscription timestamp |
| `unsubscribedAt` | DateTime? | Unsubscribe timestamp |
| `lastEmailSentAt` | DateTime? | Last notification sent |

**Indexes:**
- `email` (unique)
- `isActive`

**Relations:**
- Belongs to `User` (optional)

---

### Portfolio Content

#### `Welcome`

Home page content (singleton - only one record).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String | Your name |
| `briefBio` | Text | Short biography |
| `callToAction` | String? | CTA text/link |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Singleton Pattern:** Only one record should exist. API routes should delete existing records before creating new ones.

---

#### `About`

About page content (singleton - only one record).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `professionalSummary` | Text | Professional summary paragraph |
| `hobbies` | String[] | Array of hobby strings |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:**
- Has many `TechnicalSkill`
- Has many `ProfessionalExperience`
- Has many `Education`
- Has many `Certification`
- Has many `LeadershipExperience`

---

#### `TechnicalSkill`

Technical skills with expertise levels.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `category` | String? | Skill category (e.g., "Programming Languages") |
| `skillName` | String | Name of the skill |
| `expertiseLevel` | Int | Expertise level (1-10 scale) |
| `aboutId` | String (FK) | Foreign key to About |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `aboutId`
- `category`

**Relations:**
- Belongs to `About`
- Has many `SkillProject`

---

#### `SkillProject`

Projects demonstrating a specific skill.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String | Project name |
| `repositoryLink` | String | Link to project repository |
| `skillId` | String (FK) | Foreign key to TechnicalSkill |

**Indexes:**
- `skillId`

**Relations:**
- Belongs to `TechnicalSkill`

---

#### `ProfessionalExperience`

Work experience history.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `company` | String | Company name |
| `role` | String | Job title/role |
| `description` | Text? | Role description |
| `achievements` | String[] | Array of achievements |
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | End date (null for current) |
| `aboutId` | String (FK) | Foreign key to About |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `aboutId`
- `startDate`

---

#### `Education`

Educational background.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `institution` | String | School/university name |
| `degree` | String | Degree type |
| `fieldOfStudy` | String | Major/field of study |
| `relevantCoursework` | String[] | Array of courses |
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | Graduation date |
| `aboutId` | String (FK) | Foreign key to About |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `aboutId`
- `endDate`

---

#### `Certification`

Professional certifications.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `organization` | String | Issuing organization |
| `name` | String | Certification name |
| `issueDate` | DateTime | Issue date |
| `expirationDate` | DateTime? | Expiration date (if applicable) |
| `credentialUrl` | String? | Link to credential |
| `aboutId` | String (FK) | Foreign key to About |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `aboutId`
- `issueDate`

---

#### `LeadershipExperience`

Leadership roles and volunteer work.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `organization` | String | Organization name |
| `role` | String | Leadership role |
| `achievements` | String[] | Array of achievements |
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | End date (null for current) |
| `aboutId` | String (FK) | Foreign key to About |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:**
- `aboutId`
- `startDate`

---

### Projects

#### `Project`

Portfolio projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `title` | String | Project title |
| `description` | Text? | Project description |
| `repositoryLink` | String? | Link to repository |
| `status` | ProjectStatus | Project status enum |
| `startDate` | DateTime | Start date |
| `releaseDate` | DateTime? | Release/completion date |
| `featured` | Boolean | Featured project flag |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Enums:**
- `ProjectStatus`: PLANNED, IN_PROGRESS, IN_DEVELOPMENT, IN_TESTING, COMPLETED, IN_PRODUCTION, MAINTENANCE, ON_HOLD, DEPRECATED, SUNSETTED

**Indexes:**
- `status`
- `startDate`
- `featured`

**Relations:**
- Has many `TeamMember`
- Has one `TechStack`

---

#### `TeamMember`

Project team members.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String | Team member name |
| `email` | String? | Team member email |
| `projectId` | String (FK) | Foreign key to Project |

**Indexes:**
- `projectId`

---

#### `TechStack`

Technology stack for projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `fullStackFramework` | String? | Full-stack framework (e.g., Next.js) |
| `backendFramework` | String? | Backend framework |
| `frontendFramework` | String? | Frontend framework |
| `database` | String? | Database system |
| `languages` | String[] | Programming languages |
| `versionControl` | String? | Version control system |
| `operatingSystem` | String? | Operating system |
| `webServers` | String[] | Web servers |
| `apiIntegrations` | JSON? | API integrations (flexible) |
| `deploymentTools` | JSON? | Deployment tools (flexible) |
| `additionalTools` | JSON? | Additional tools (flexible) |
| `projectId` | String (FK) | Foreign key to Project (unique) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Note:** JSON fields allow flexible nested data for complex tool configurations.

---

### Contact

#### `Contact`

Contact information (singleton - only one record).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String? | Your name |
| `email` | String | Email address |
| `phoneNumber` | String? | Phone number |
| `socialMedia` | JSON? | Social media links object |
| `city` | String? | City |
| `state` | String? | State/province |
| `country` | String? | Country |
| `workingHours` | String? | Working hours |
| `preferredContactTimes` | String? | Preferred contact times |
| `availabilityNotes` | String? | Additional availability notes |
| `additionalMethods` | JSON? | Other contact methods |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

---

## Common Query Patterns

### Blog Posts

```javascript
// Get published posts with author and stats
const posts = await prisma.blogPost.findMany({
  where: { status: 'PUBLISHED' },
  include: {
    author: { select: { name: true, image: true } },
    tags: true,
    _count: {
      select: { comments: true, likes: true }
    }
  },
  orderBy: { publishedAt: 'desc' },
  take: 10
});

// Get featured posts
const featured = await prisma.blogPost.findMany({
  where: { status: 'PUBLISHED', featured: true },
  include: { author: true, tags: true }
});

// Search posts
const results = await prisma.blogPost.findMany({
  where: {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ],
    status: 'PUBLISHED'
  }
});
```

### Projects

```javascript
// Get all projects with tech stack
const projects = await prisma.project.findMany({
  include: {
    team: true,
    techStack: true
  },
  orderBy: { startDate: 'desc' }
});

// Get featured projects
const featured = await prisma.project.findMany({
  where: { featured: true },
  include: { techStack: true }
});
```

### About Page

```javascript
// Get complete about data
const about = await prisma.about.findFirst({
  include: {
    technicalSkills: {
      include: { projects: true },
      orderBy: { expertiseLevel: 'desc' }
    },
    experiences: {
      orderBy: { startDate: 'desc' }
    },
    education: {
      orderBy: { endDate: 'desc' }
    },
    certifications: {
      orderBy: { issueDate: 'desc' }
    },
    leadership: {
      orderBy: { startDate: 'desc' }
    }
  }
});
```

---

## Performance Optimization

### Indexes

Strategic indexes are placed on:
- Foreign keys (for JOINs)
- Frequently queried fields (slug, status, dates)
- Unique constraints (email, slug)

### Pagination

For large datasets, use cursor-based pagination:

```javascript
const posts = await prisma.blogPost.findMany({
  take: 10,
  skip: 1,  // Skip cursor
  cursor: { id: lastPostId },
  where: { status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' }
});
```

### Counting

Use `_count` for efficient counting:

```javascript
const post = await prisma.blogPost.findUnique({
  where: { slug },
  include: {
    _count: {
      select: {
        comments: true,
        likes: true
      }
    }
  }
});
// post._count.comments
// post._count.likes
```

---

## Security Considerations

### Password Hashing

Always hash passwords before storing:

```javascript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    ...
  }
});
```

### Cascading Deletes

When a user is deleted, all their content is automatically removed:
- Blog posts
- Comments
- Likes
- Email subscriptions

### Data Validation

Use Prisma's built-in validation:
- Required fields
- Unique constraints
- Enum values
- Foreign key constraints

---

## Maintenance

### Backup

```bash
# Export database
pg_dump -U username -d jloweai > backup.sql

# Import database
psql -U username -d jloweai < backup.sql
```

### Migrations

```bash
# Create new migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Prisma Studio

Visual database browser:

```bash
npx prisma studio
```

Opens at http://localhost:5555

---

## Future Enhancements

Potential schema additions:

1. **Analytics**
   - `PageView` - Track page views
   - `UserActivity` - Track user activity

2. **Media**
   - `Media` - File uploads (images, PDFs)
   - Link to blog posts and projects

3. **Newsletter**
   - `NewsletterIssue` - Newsletter editions
   - `NewsletterSubscriber` - Separate from blog

4. **SEO**
   - `Redirect` - URL redirects
   - `Sitemap` - Dynamic sitemap generation

5. **Search**
   - Full-text search with PostgreSQL
   - Search analytics

---

This schema provides a solid foundation for your portfolio website with room for growth! 🚀
