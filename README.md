# jlowe.ai

[![Test Suite](https://github.com/OWNER/jlowe.ai/actions/workflows/test.yml/badge.svg)](https://github.com/OWNER/jlowe.ai/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![codecov](https://codecov.io/gh/OWNER/jlowe.ai/branch/main/graph/badge.svg)](https://codecov.io/gh/OWNER/jlowe.ai)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

Personal AI consultancy portfolio built with Next.js, featuring a bold "Supernova" space theme, 3D animations, and a comprehensive admin panel.

## Tech Stack

| Category        | Technologies                               |
| --------------- | ------------------------------------------ |
| **Framework**   | Next.js 15 (Pages Router)                  |
| **Database**    | PostgreSQL + Prisma ORM                    |
| **Auth**        | NextAuth.js (credentials)                  |
| **Styling**     | Tailwind CSS + CSS Variables Design System |
| **3D Graphics** | Three.js + @react-three/fiber              |
| **Animations**  | GSAP (scroll-triggered, entrance)          |
| **Content**     | Markdown with syntax highlighting          |
| **Deployment**  | Vercel                                     |

## Features

### Public Site

- **Home**: Hero with 3D space animation, services, featured projects, tech stack
- **Projects**: Portfolio with filtering, sorting, search
- **About**: Professional summary, skills, experience, certifications
- **Articles**: Blog with posts, playlists, comments, likes
- **Contact**: Contact form and information

### Admin Panel (`/admin`)

- Content management for all pages
- Project CRUD with bulk operations
- Articles/blog management
- Activity logging
- SEO settings

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
# Clone and install
git clone <repository-url>
cd jlowe.ai
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run seed:admin

# Start development
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

| Variable          | Required | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`    | Yes      | PostgreSQL connection string             |
| `NEXTAUTH_SECRET` | Yes      | Auth secret (`openssl rand -base64 32`)  |
| `NEXTAUTH_URL`    | Yes      | Base URL (e.g., `http://localhost:3000`) |
| `ADMIN_EMAIL`     | Yes      | Admin login email                        |
| `ADMIN_PASSWORD`  | Yes      | Admin login password                     |
| `MONGODB_URL`     | No       | For legacy data migration only           |

## Project Structure

```
├── components/
│   ├── admin/           # Admin panel components
│   │   ├── shared/      # Reusable form components
│   │   ├── home/        # Home settings tabs
│   │   └── projects/    # Project management
│   ├── About/           # About page sections
│   ├── Articles/        # Blog components
│   ├── Project/         # Project components
│   ├── ui/              # Shared UI components (Button, Card, Badge)
│   └── SpaceBackground.jsx  # Three.js hero animation
├── lib/
│   ├── utils/           # API handlers, validators, helpers
│   └── prisma.js        # Database client
├── pages/
│   ├── api/             # API routes
│   │   ├── admin/       # Protected admin endpoints
│   │   └── ...          # Public endpoints
│   └── admin/           # Admin pages
├── prisma/
│   └── schema.prisma    # Database schema
├── styles/
│   └── globals.css      # Design system tokens
└── scripts/             # Migration and seed scripts
```

## Design System

### Theme: Supernova

A bold, fiery space theme with true black backgrounds and warm accent colors.

#### Color Palette

| Token                  | Value     | Usage                  |
| ---------------------- | --------- | ---------------------- |
| `--color-primary`      | `#E85D04` | Main accent, CTAs      |
| `--color-secondary`    | `#9D0208` | Secondary accents      |
| `--color-accent`       | `#FAA307` | Gold highlights        |
| `--color-cool`         | `#4CC9F0` | Cool blue accent       |
| `--color-bg-space`     | `#000000` | True black background  |
| `--color-text-primary` | `#FFFAF0` | Main text (warm white) |

#### Typography

- **Headings**: Space Grotesk
- **Body**: Plus Jakarta Sans
- **Code**: JetBrains Mono

### Animations

- **Hero**: Three.js supernova explosion with starfield
- **Scroll**: GSAP-triggered fade/slide animations
- **Interactions**: Magnetic buttons, card tilt effects
- **Accessibility**: Respects `prefers-reduced-motion`

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Database GUI
npm run seed:admin       # Create admin user

# Testing
npm test                 # Run unit/integration tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# E2E Testing
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run with interactive UI
npm run test:e2e:headed  # Run in headed mode (see browser)
npm run test:e2e:debug   # Debug mode
npm run test:e2e:report  # View test report
```

## Testing

### Unit & Integration Tests

The project uses Jest and React Testing Library for component and utility testing:

- **Location**: `__tests__/`
- **Coverage**: Components, utilities, API helpers
- **Commands**: `npm test`, `npm run test:coverage`

### E2E Tests (Playwright)

Comprehensive end-to-end testing suite covering all user journeys:

- **Location**: `e2e/`
- **Coverage**: 
  - Visual regression (desktop, tablet, mobile)
  - SEO validation (meta tags, Open Graph, structured data)
  - Accessibility (WCAG 2.1 AA, keyboard nav, screen readers)
  - Error handling (404, API failures, form validation)
  - Performance (load times, FCP, CLS, Web Vitals)
  - Deep links (hash navigation, query params)
- **Browsers**: Chromium, Firefox, WebKit, iPhone 12
- **Total Tests**: ~256 tests across 9 test files
- **Documentation**: See `e2e/README.md` for full details

#### Quick Start

```bash
# Install Playwright browsers
npx playwright install

# Generate baseline screenshots
npx playwright test visual.spec.ts --update-snapshots

# Run all E2E tests
npm run test:e2e

# Run with interactive UI (recommended)
npm run test:e2e:ui
```

For detailed instructions, see:
- `e2e/README.md` - Complete guide
- `e2e/IMPLEMENTATION_SUMMARY.md` - Test suite overview
- `e2e/quick-start.sh` - Quick setup script
- `__tests__/README.md` - Unit test documentation

## CI/CD

### GitHub Actions Workflow

Automated testing runs on every push and pull request:

```yaml
# Workflow: .github/workflows/test.yml
jobs:
  - lint              # Code quality (ESLint)
  - unit-tests        # Jest with coverage
  - e2e-tests         # Playwright (3 browsers × 2 shards)
  - visual-regression # Screenshot comparison
  - accessibility     # WCAG 2.1 AA compliance
  - performance       # Load times & Web Vitals
  - test-summary      # Overall results
```

**Status**: All tests must pass before merging to `main`

### Local CI Simulation

```bash
# Run tests exactly as CI does
npm ci
npm run lint
npm run test:coverage
npm run test:e2e
```

### Branch Protection

Required status checks:
- ✅ Lint & Code Quality
- ✅ Unit & Integration Tests
- ✅ E2E Tests (Playwright)
- ✅ Visual Regression Tests
- ✅ Accessibility Tests
- ✅ Performance Tests

See `.github/BRANCH_PROTECTION.md` for setup instructions.

### Coverage Reporting

- **Current**: ~70% coverage (unit tests)
- **Target**: 80% coverage
- **CI Threshold**: 70% minimum
- **Reports**: Uploaded to Codecov on every run

### Artifacts

Test artifacts available in Actions tab:
- Coverage reports (30 day retention)
- Playwright reports (30 day retention)
- Screenshots on failure (7 day retention)
- Videos on failure (7 day retention)

### Documentation

- `.github/workflows/test.yml` - Workflow configuration
- `.github/WORKFLOW_SETUP.md` - Setup guide
- `.github/BRANCH_PROTECTION.md` - Branch protection guide

## API Routes

### Public

- `GET /api/welcome` - Home hero content
- `GET /api/about` - About page content
- `GET /api/contact` - Contact info
- `GET /api/projects` - Projects list
- `GET /api/posts` - Articles list

### Admin (Protected)

- `GET|PUT /api/admin/site-settings` - Global settings
- `GET|PUT /api/admin/page-content` - Page content
- `GET|POST /api/admin/projects` - Projects CRUD
- `GET|PUT|DELETE /api/admin/projects/[id]` - Single project
- `POST /api/admin/projects/bulk` - Bulk operations

## Architecture Decisions

### Component Organization

- **Atomic Design**: UI primitives in `components/ui/`
- **Feature Modules**: Domain components grouped (Admin, About, Articles)
- **Shared Patterns**: Extracted to `admin/shared/` for consistency

### State Management

- Server state via API + `useState`/`useEffect`
- No external state library (YAGNI principle)

### Styling Strategy

- CSS Variables for theming (design tokens)
- Tailwind for utility classes
- Inline styles only for dynamic values

### Code Quality

Follows Martin Fowler's refactoring principles:

- Extract Component for reusable UI
- Extract Constants for magic values
- Composition over inheritance
- Small, focused functions

## Deployment

### Vercel

1. Connect repository to Vercel
2. Add environment variables
3. Deploy (auto-runs migrations)

### Post-Deployment

```bash
npx prisma migrate deploy  # If needed
npm run seed:admin         # Create admin user
```

## Troubleshooting

### Database Issues

```bash
npm run prisma:test-connection  # Verify connection
npm run prisma:migrate          # Apply migrations
```

### Build Errors

```bash
npm run prisma:generate  # Regenerate client
rm -rf .next && npm run build  # Clean build
```

### Admin Access

- URL: `/admin/login`
- Credentials: From `.env` (ADMIN_EMAIL/ADMIN_PASSWORD)
- Run `npm run seed:admin` if user doesn't exist

---

Built with Next.js + Prisma + Three.js
