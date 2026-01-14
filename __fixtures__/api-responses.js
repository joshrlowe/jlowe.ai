/**
 * API Response Fixtures
 * 
 * Mock data matching the Prisma schema and API response formats.
 * Use these fixtures for consistent test data across all tests.
 */

// ============================================================================
// WELCOME DATA
// ============================================================================

export const mockWelcome = {
  id: 'welcome-1',
  name: 'Josh Lowe',
  briefBio: 'AI Engineer & Full-Stack Developer passionate about building intelligent systems.',
  callToAction: 'Get in Touch',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

// ============================================================================
// ABOUT DATA
// ============================================================================

export const mockAbout = {
  id: 'about-1',
  professionalSummary: 'Experienced software engineer specializing in AI/ML systems and full-stack development.',
  technicalSkills: [
    {
      category: 'Programming Languages',
      skills: [
        {
          name: 'Python',
          expertiseLevel: 'Expert',
          projects: [
            { name: 'ML Pipeline', repositoryLink: 'https://github.com/user/ml-pipeline' },
          ],
        },
        {
          name: 'JavaScript',
          expertiseLevel: 'Expert',
          projects: [],
        },
      ],
    },
    {
      category: 'Frameworks',
      skills: [
        {
          name: 'React',
          expertiseLevel: 'Expert',
          projects: [],
        },
        {
          name: 'Next.js',
          expertiseLevel: 'Advanced',
          projects: [],
        },
      ],
    },
    {
      category: 'Cloud',
      skills: [
        {
          name: 'AWS',
          expertiseLevel: 'Advanced',
          projects: [],
        },
      ],
    },
  ],
  professionalExperience: [
    {
      company: 'Tech Corp',
      role: 'Senior Software Engineer',
      description: 'Led AI/ML initiatives and built production systems.',
      startDate: '2022-01-01',
      endDate: '',
      isOngoing: true,
      achievements: [
        'Increased system efficiency by 40%',
        'Led team of 5 engineers',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      relevantCoursework: ['Machine Learning', 'Data Structures', 'Algorithms'],
      startDate: '2016-09-01',
      endDate: '2020-05-15',
      isOngoing: false,
      expectedGradDate: '',
    },
  ],
  technicalCertifications: [
    {
      organization: 'AWS',
      name: 'Solutions Architect Associate',
      issueDate: '2023-06-01',
      expirationDate: '2026-06-01',
      credentialUrl: 'https://aws.amazon.com/verification/...',
    },
  ],
  leadershipExperience: [
    {
      organization: 'Open Source Project',
      role: 'Maintainer',
      startDate: '2021-01-01',
      endDate: null,
      achievements: ['Grew community to 1000+ contributors'],
    },
  ],
  hobbies: ['Open Source', 'Reading', 'Hiking'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

// ============================================================================
// CONTACT DATA
// ============================================================================

export const mockContact = {
  id: 'contact-1',
  name: 'Josh Lowe',
  emailAddress: 'contact@jlowe.ai',
  phoneNumber: null,
  socialMediaLinks: {
    linkedIn: 'https://linkedin.com/in/joshrlowe',
    github: 'https://github.com/joshrlowe',
    X: 'https://x.com/joshrlowe',
  },
  location: {
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
  },
  availability: {
    workingHours: '9 AM - 5 PM PST',
    preferredContactTimes: 'Weekdays',
    additionalInstructions: 'Email preferred for initial contact.',
  },
  additionalContactMethods: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

// ============================================================================
// HOME CONTENT DATA
// ============================================================================

export const mockHomeContent = {
  typingIntro: 'I build...',
  heroTitle: 'intelligent AI systems',
  typingStrings: [
    'intelligent AI systems',
    'production ML pipelines',
    'custom LLM solutions',
    'scalable data platforms',
  ],
  primaryCta: {
    text: 'Start a Project',
    href: '/contact',
  },
  secondaryCta: {
    text: 'View My Work',
    href: '/projects',
  },
  techBadges: [
    { name: 'Python', color: '#E85D04' },
    { name: 'TensorFlow', color: '#FAA307' },
    { name: 'React', color: '#4CC9F0' },
    { name: 'AWS', color: '#F48C06' },
  ],
  servicesTitle: 'AI & Engineering Services',
  servicesSubtitle: 'From strategy to implementation.',
  services: [
    {
      iconKey: 'computer',
      title: 'AI Strategy & Consulting',
      description: 'Transform your business with data-driven AI strategies.',
      variant: 'primary',
    },
    {
      iconKey: 'database',
      title: 'Machine Learning Systems',
      description: 'End-to-end ML pipeline development.',
      variant: 'accent',
    },
  ],
};

// ============================================================================
// POST DATA
// ============================================================================

export const mockPost = {
  id: 'post-1',
  title: 'Getting Started with Machine Learning',
  description: 'A comprehensive guide to beginning your ML journey.',
  postType: 'Article',
  url: null,
  content: '# Getting Started\n\nThis is the full article content...',
  tags: ['machine-learning', 'python', 'tutorial'],
  topic: 'ai',
  slug: 'getting-started-with-machine-learning',
  author: 'Josh Lowe',
  status: 'Published',
  coverImage: '/images/posts/ml-intro.jpg',
  metaTitle: 'Getting Started with Machine Learning | Josh Lowe',
  metaDescription: 'Learn the fundamentals of machine learning.',
  ogImage: '/images/posts/ml-intro-og.jpg',
  readingTime: 8,
  viewCount: 1250,
  datePublished: '2024-06-15T10:00:00.000Z',
  createdAt: '2024-06-10T00:00:00.000Z',
  updatedAt: '2024-06-15T00:00:00.000Z',
  _count: {
    comments: 5,
    likes: 42,
  },
};

export const mockPosts = [
  mockPost,
  {
    ...mockPost,
    id: 'post-2',
    title: 'Building Production ML Pipelines',
    slug: 'building-production-ml-pipelines',
    topic: 'engineering',
    viewCount: 890,
    datePublished: '2024-07-01T10:00:00.000Z',
  },
  {
    ...mockPost,
    id: 'post-3',
    title: 'Draft Article',
    slug: 'draft-article',
    status: 'Draft',
    datePublished: null,
    viewCount: 0,
  },
];

// ============================================================================
// PLAYLIST DATA
// ============================================================================

export const mockPlaylist = {
  id: 'playlist-1',
  title: 'Machine Learning Fundamentals',
  description: 'A curated series on ML basics.',
  slug: 'ml-fundamentals',
  coverImage: '/images/playlists/ml-series.jpg',
  featured: true,
  order: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  playlistPosts: [
    { id: 'pp-1', postId: 'post-1', order: 0, post: mockPost },
  ],
  _count: {
    playlistPosts: 1,
  },
};

export const mockPlaylists = [
  mockPlaylist,
  {
    ...mockPlaylist,
    id: 'playlist-2',
    title: 'Web Development Series',
    slug: 'web-dev-series',
    featured: false,
    order: 2,
  },
];

// ============================================================================
// COMMENT DATA
// ============================================================================

export const mockComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorName: 'Jane Doe',
  authorEmail: 'jane@example.com',
  content: 'Great article! Very helpful.',
  approved: true,
  createdAt: '2024-06-20T14:30:00.000Z',
  updatedAt: '2024-06-20T14:30:00.000Z',
};

export const mockComments = [
  mockComment,
  {
    ...mockComment,
    id: 'comment-2',
    authorName: 'John Smith',
    authorEmail: 'john@example.com',
    content: 'Thanks for sharing!',
    createdAt: '2024-06-21T09:15:00.000Z',
  },
  {
    ...mockComment,
    id: 'comment-3',
    authorName: 'Pending User',
    content: 'This is awaiting moderation.',
    approved: false,
  },
];

// ============================================================================
// SITE SETTINGS DATA
// ============================================================================

export const mockSiteSettings = {
  id: 'settings-1',
  siteName: 'jlowe.ai',
  navLinks: [
    { label: 'Home', href: '/', order: 0 },
    { label: 'Projects', href: '/projects', order: 1 },
    { label: 'Articles', href: '/articles', order: 2 },
    { label: 'About', href: '/about', order: 3 },
    { label: 'Contact', href: '/contact', order: 4 },
  ],
  footerText: '© 2024 Josh Lowe. All rights reserved.',
  socials: {
    github: 'https://github.com/joshrlowe',
    linkedin: 'https://linkedin.com/in/joshrlowe',
    twitter: 'https://x.com/joshrlowe',
    email: 'contact@jlowe.ai',
  },
  seoDefaults: {
    title: 'Josh Lowe - AI Engineer & Developer',
    description: 'Personal portfolio and blog of Josh Lowe.',
    ogImage: '/images/og-default.jpg',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

// ============================================================================
// ACTIVITY LOG DATA
// ============================================================================

export const mockActivityLog = {
  id: 'log-1',
  userId: 'admin-1',
  entityType: 'Project',
  entityId: 'project-1',
  projectId: 'project-1',
  action: 'create',
  field: null,
  oldValue: null,
  newValue: { title: 'New Project' },
  description: 'Project "New Project" created',
  metadata: {},
  createdAt: '2024-06-15T10:00:00.000Z',
};

export const mockActivityLogs = [
  mockActivityLog,
  {
    ...mockActivityLog,
    id: 'log-2',
    action: 'update',
    field: 'status',
    oldValue: 'Draft',
    newValue: 'Published',
    description: 'Project status changed to Published',
    createdAt: '2024-06-16T11:00:00.000Z',
  },
  {
    ...mockActivityLog,
    id: 'log-3',
    entityType: 'Post',
    entityId: 'post-1',
    projectId: null,
    action: 'create',
    description: 'Post "Getting Started" created',
    createdAt: '2024-06-17T09:00:00.000Z',
  },
];

// ============================================================================
// NEWSLETTER SUBSCRIPTION DATA
// ============================================================================

export const mockNewsletterSubscription = {
  id: 'sub-1',
  email: 'subscriber@example.com',
  active: true,
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Creates a paginated response wrapper
 */
export function createPaginatedResponse(data, { total, limit = 10, offset = 0, key = 'data' } = {}) {
  return {
    [key]: data,
    total: total ?? data.length,
    limit,
    offset,
  };
}

/**
 * Creates an empty paginated response
 */
export function createEmptyPaginatedResponse(key = 'data') {
  return {
    [key]: [],
    total: 0,
    limit: 10,
    offset: 0,
  };
}



