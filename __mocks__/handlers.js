/**
 * MSW Request Handlers
 * 
 * Comprehensive mock API handlers for testing.
 * These handlers intercept network requests during tests.
 * 
 * API Routes Covered:
 * - /api/welcome - Welcome/hero content
 * - /api/about - About page content
 * - /api/contact - Contact information
 * - /api/projects - Project listings
 * - /api/posts - Blog posts/articles
 * - /api/playlists - Content playlists
 * - /api/comments - Post comments
 * - /api/newsletter/subscribe - Newsletter signup
 * - /api/home-content - Homepage dynamic content
 * - /api/admin/* - Admin CRUD operations
 * - /api/auth/* - Authentication
 * 
 * Documentation: https://mswjs.io/docs/getting-started
 */

import { http, HttpResponse } from 'msw';

// ============================================================================
// MOCK DATA - Imported from fixtures for consistency
// ============================================================================

import { mockProject, mockProjects } from '../__fixtures__/projects';
import { mockSession, mockAdminUser } from '../__fixtures__/user';
import { 
  mockWelcome, 
  mockAbout, 
  mockContact, 
  mockHomeContent,
  mockPost,
  mockPosts,
  mockPlaylist,
  mockPlaylists,
  mockComment,
  mockComments,
  mockSiteSettings,
  mockActivityLogs,
} from '../__fixtures__/api-responses';

// ============================================================================
// PUBLIC API HANDLERS
// ============================================================================

/**
 * Welcome API handlers
 * GET /api/welcome - Returns hero section content
 */
const welcomeHandlers = [
  http.get('/api/welcome', () => {
    return HttpResponse.json(mockWelcome);
  }),
];

/**
 * About API handlers
 * GET /api/about - Returns about page content
 */
const aboutHandlers = [
  http.get('/api/about', () => {
    return HttpResponse.json(mockAbout);
  }),
];

/**
 * Contact API handlers
 * GET /api/contact - Returns contact information
 */
const contactHandlers = [
  http.get('/api/contact', () => {
    return HttpResponse.json(mockContact);
  }),
];

/**
 * Home Content API handlers
 * GET /api/home-content - Returns homepage dynamic content
 */
const homeContentHandlers = [
  http.get('/api/home-content', () => {
    return HttpResponse.json(mockHomeContent);
  }),
];

/**
 * Projects API handlers
 * GET /api/projects - Returns list of projects
 * GET /api/projects/:id - Returns single project
 * POST /api/projects - Creates new project
 */
const projectsHandlers = [
  http.get('/api/projects', ({ request }) => {
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured');
    const status = url.searchParams.get('status');
    
    let filteredProjects = [...mockProjects];
    
    if (featured === 'true') {
      filteredProjects = filteredProjects.filter(p => p.featured);
    }
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    
    return HttpResponse.json(filteredProjects);
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find(p => p.id === params.id || p.slug === params.id);
    if (!project) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json(project);
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json();
    const newProject = {
      id: `project-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newProject, { status: 201 });
  }),
];

/**
 * Posts API handlers
 * GET /api/posts - Returns paginated list of posts
 * GET /api/posts/:topic/:slug - Returns single post
 * POST /api/posts/:topic/:slug/like - Likes a post
 */
const postsHandlers = [
  http.get('/api/posts', ({ request }) => {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic');
    const status = url.searchParams.get('status') || 'Published';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    let filteredPosts = mockPosts.filter(p => p.status === status);
    
    if (topic) {
      filteredPosts = filteredPosts.filter(p => p.topic === topic);
    }
    
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);
    
    return HttpResponse.json({
      data: paginatedPosts,
      total: filteredPosts.length,
      limit,
      offset,
    });
  }),

  http.get('/api/posts/:topic/:slug', ({ params }) => {
    const post = mockPosts.find(p => p.topic === params.topic && p.slug === params.slug);
    if (!post) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.post('/api/posts/:topic/:slug/like', () => {
    return HttpResponse.json({ message: 'Post liked', likes: 42 });
  }),
];

/**
 * Playlists API handlers
 * GET /api/playlists - Returns list of playlists
 */
const playlistsHandlers = [
  http.get('/api/playlists', ({ request }) => {
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured');
    
    let filteredPlaylists = [...mockPlaylists];
    
    if (featured === 'true') {
      filteredPlaylists = filteredPlaylists.filter(p => p.featured);
    }
    
    return HttpResponse.json({
      playlists: filteredPlaylists,
      total: filteredPlaylists.length,
    });
  }),
];

/**
 * Comments API handlers
 * GET /api/comments - Returns comments for a post
 * POST /api/comments - Creates new comment
 */
const commentsHandlers = [
  http.get('/api/comments', ({ request }) => {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    
    const filteredComments = mockComments.filter(c => c.postId === postId && c.approved);
    return HttpResponse.json(filteredComments);
  }),

  http.post('/api/comments', async ({ request }) => {
    const body = await request.json();
    const newComment = {
      id: `comment-${Date.now()}`,
      ...body,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newComment, { status: 201 });
  }),
];

/**
 * Newsletter API handlers
 * POST /api/newsletter/subscribe - Subscribes email to newsletter
 */
const newsletterHandlers = [
  http.post('/api/newsletter/subscribe', async ({ request }) => {
    const body = await request.json();
    
    if (!body.email || !body.email.includes('@')) {
      return HttpResponse.json({ message: 'Valid email is required' }, { status: 400 });
    }
    
    return HttpResponse.json({
      message: 'Successfully subscribed',
      subscription: {
        id: `sub-${Date.now()}`,
        email: body.email.toLowerCase(),
        active: true,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }),
];

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================

/**
 * NextAuth API handlers
 * GET /api/auth/session - Returns current session
 * POST /api/auth/callback/credentials - Handles login
 * GET /api/auth/csrf - Returns CSRF token
 */
const authHandlers = [
  // Return null session by default (unauthenticated)
  http.get('/api/auth/session', () => {
    return HttpResponse.json(null);
  }),

  http.post('/api/auth/callback/credentials', async ({ request }) => {
    const body = await request.json();
    
    // Simulate successful login
    if (body.email === 'admin@example.com' && body.password === 'password') {
      return HttpResponse.json({
        url: '/admin/dashboard',
      });
    }
    
    return HttpResponse.json({
      error: 'CredentialsSignin',
      status: 401,
      ok: false,
      url: null,
    }, { status: 401 });
  }),

  http.get('/api/auth/csrf', () => {
    return HttpResponse.json({
      csrfToken: 'mock-csrf-token-for-testing',
    });
  }),

  http.get('/api/auth/providers', () => {
    return HttpResponse.json({
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
      },
    });
  }),
];

// ============================================================================
// ADMIN API HANDLERS (Protected Routes)
// ============================================================================

/**
 * Admin Welcome handlers
 * POST /api/admin/welcome - Updates welcome content
 */
const adminWelcomeHandlers = [
  http.post('/api/admin/welcome', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockWelcome, ...body });
  }),
];

/**
 * Admin Projects handlers
 * GET /api/admin/projects - Returns all projects (admin)
 * POST /api/admin/projects - Creates project
 * PUT /api/admin/projects/:id - Updates project
 * DELETE /api/admin/projects/:id - Deletes project
 */
const adminProjectsHandlers = [
  http.get('/api/admin/projects', () => {
    return HttpResponse.json(mockProjects);
  }),

  http.post('/api/admin/projects', async ({ request }) => {
    const body = await request.json();
    const newProject = {
      id: `project-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newProject, { status: 201 });
  }),

  http.put('/api/admin/projects/:id', async ({ params, request }) => {
    const body = await request.json();
    const project = mockProjects.find(p => p.id === params.id);
    if (!project) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json({ ...project, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete('/api/admin/projects/:id', ({ params }) => {
    const project = mockProjects.find(p => p.id === params.id);
    if (!project) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json({ message: 'Project deleted' });
  }),

  // Bulk operations
  http.post('/api/admin/projects/bulk', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: `Bulk operation completed on ${body.ids?.length || 0} projects`,
      affected: body.ids?.length || 0,
    });
  }),

  // Import/Export
  http.get('/api/admin/projects/export', () => {
    return HttpResponse.json(mockProjects);
  }),

  http.post('/api/admin/projects/import', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Import successful',
      imported: body.projects?.length || 0,
    });
  }),
];

/**
 * Admin Posts handlers
 * GET /api/admin/posts - Returns all posts (admin)
 * POST /api/admin/posts - Creates post
 * PUT /api/admin/posts/:id - Updates post
 * DELETE /api/admin/posts/:id - Deletes post
 */
const adminPostsHandlers = [
  http.get('/api/admin/posts', () => {
    return HttpResponse.json({
      posts: mockPosts,
      total: mockPosts.length,
    });
  }),

  http.post('/api/admin/posts', async ({ request }) => {
    const body = await request.json();
    const newPost = {
      id: `post-${Date.now()}`,
      ...body,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newPost, { status: 201 });
  }),

  http.put('/api/admin/posts/:id', async ({ params, request }) => {
    const body = await request.json();
    const post = mockPosts.find(p => p.id === params.id);
    if (!post) {
      return HttpResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    return HttpResponse.json({ ...post, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete('/api/admin/posts/:id', ({ params }) => {
    return HttpResponse.json({ message: 'Post deleted' });
  }),
];

/**
 * Admin Page Content handlers
 * GET /api/admin/page-content - Returns page content
 * PUT /api/admin/page-content - Updates page content
 */
const adminPageContentHandlers = [
  http.get('/api/admin/page-content', ({ request }) => {
    const url = new URL(request.url);
    const pageKey = url.searchParams.get('pageKey');
    
    if (pageKey === 'home') {
      return HttpResponse.json({ pageKey: 'home', content: mockHomeContent });
    }
    
    return HttpResponse.json({ pageKey, content: {} });
  }),

  http.put('/api/admin/page-content', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      pageKey: body.pageKey,
      content: body.content,
      updatedAt: new Date().toISOString(),
    });
  }),
];

/**
 * Admin Site Settings handlers
 * GET /api/admin/site-settings - Returns site settings
 * PUT /api/admin/site-settings - Updates site settings
 */
const adminSiteSettingsHandlers = [
  http.get('/api/admin/site-settings', () => {
    return HttpResponse.json(mockSiteSettings);
  }),

  http.put('/api/admin/site-settings', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockSiteSettings, ...body, updatedAt: new Date().toISOString() });
  }),
];

/**
 * Admin Activity Log handlers
 * GET /api/admin/activity-log - Returns activity logs
 */
const adminActivityLogHandlers = [
  http.get('/api/admin/activity-log', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    return HttpResponse.json({
      logs: mockActivityLogs.slice(0, limit),
      total: mockActivityLogs.length,
    });
  }),
];

// ============================================================================
// COMBINED HANDLERS
// ============================================================================

/**
 * All handlers combined
 * Import this in your test setup for full API mocking
 */
export const handlers = [
  ...welcomeHandlers,
  ...aboutHandlers,
  ...contactHandlers,
  ...homeContentHandlers,
  ...projectsHandlers,
  ...postsHandlers,
  ...playlistsHandlers,
  ...commentsHandlers,
  ...newsletterHandlers,
  ...authHandlers,
  ...adminWelcomeHandlers,
  ...adminProjectsHandlers,
  ...adminPostsHandlers,
  ...adminPageContentHandlers,
  ...adminSiteSettingsHandlers,
  ...adminActivityLogHandlers,
];

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Error response factories for testing error states
 * 
 * Usage:
 * server.use(errorHandlers.serverError('/api/projects'))
 */
export const errorHandlers = {
  /**
   * Returns 500 Internal Server Error
   */
  serverError: (path) =>
    http.get(path, () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }),

  /**
   * Returns 404 Not Found
   */
  notFound: (path) =>
    http.get(path, () => {
      return HttpResponse.json(
        { message: 'Not found' },
        { status: 404 }
      );
    }),

  /**
   * Returns 401 Unauthorized
   */
  unauthorized: (path) =>
    http.get(path, () => {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }),

  /**
   * Returns 403 Forbidden
   */
  forbidden: (path) =>
    http.get(path, () => {
      return HttpResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }),

  /**
   * Returns 400 Bad Request with custom message
   */
  badRequest: (path, message = 'Bad Request') =>
    http.post(path, () => {
      return HttpResponse.json(
        { message },
        { status: 400 }
      );
    }),

  /**
   * Simulates network error
   */
  networkError: (path) =>
    http.get(path, () => {
      return HttpResponse.error();
    }),

  /**
   * Simulates slow response (for loading state testing)
   */
  slowResponse: (path, data, delayMs = 2000) =>
    http.get(path, async () => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return HttpResponse.json(data);
    }),
};

// ============================================================================
// AUTHENTICATED SESSION HANDLER
// ============================================================================

/**
 * Handler that returns an authenticated session
 * Use this to test authenticated states:
 * 
 * server.use(authenticatedSessionHandler)
 */
export const authenticatedSessionHandler = http.get('/api/auth/session', () => {
  return HttpResponse.json(mockSession);
});

/**
 * Handler factory for custom session data
 */
export const createSessionHandler = (sessionData) =>
  http.get('/api/auth/session', () => {
    return HttpResponse.json(sessionData);
  });
