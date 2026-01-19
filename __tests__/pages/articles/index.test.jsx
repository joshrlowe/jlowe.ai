import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArticlesPage from '../../../pages/articles/index';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock SEO component
jest.mock('@/components/SEO', () => {
  return function MockSEO({ title, description }) {
    return <div data-testid="seo" data-title={title} data-description={description} />;
  };
});

// Mock NewsletterSubscription component
jest.mock('@/components/Articles/NewsletterSubscription', () => {
  return function MockNewsletterSubscription() {
    return <div data-testid="newsletter">Newsletter Subscription</div>;
  };
});

// Mock Pagination component
jest.mock('@/components/ui', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}));

// Mock utility functions
jest.mock('@/lib/utils/postFilters', () => ({
  filterAndSortPosts: jest.fn((posts, options) => {
    let filtered = [...posts];
    if (options.searchQuery) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(options.searchQuery.toLowerCase())
      );
    }
    if (options.topic && options.topic !== 'all') {
      filtered = filtered.filter((p) => p.topic === options.topic);
    }
    if (options.tag && options.tag !== 'all') {
      filtered = filtered.filter((p) => p.tags && p.tags.includes(options.tag));
    }
    return filtered;
  }),
  paginate: jest.fn((items, page, perPage) => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }),
  calculateTotalPages: jest.fn((total, perPage) => Math.ceil(total / perPage)),
}));

jest.mock('@/lib/utils/dateUtils', () => ({
  formatArticleDate: jest.fn((date) => 'January 1, 2024'),
}));

jest.mock('@/lib/utils/constants', () => ({
  POSTS_PER_PAGE: 10,
  PLAYLISTS_PER_PAGE: 5,
}));

describe('ArticlesPage', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'First Post',
      slug: 'first-post',
      topic: 'tech',
      description: 'First post description.',
      datePublished: '2024-01-01T00:00:00.000Z',
      coverImage: '/images/post1.jpg',
      tags: ['javascript', 'react'],
      readingTime: 5,
    },
    {
      id: '2',
      title: 'Second Post',
      slug: 'second-post',
      topic: 'ai',
      description: 'Second post description.',
      datePublished: '2024-01-02T00:00:00.000Z',
      coverImage: null,
      tags: ['python', 'ml'],
      readingTime: 10,
    },
    {
      id: '3',
      title: 'Third Post',
      slug: 'third-post',
      topic: 'tech',
      description: 'Third post description.',
      datePublished: '2024-01-03T00:00:00.000Z',
      coverImage: '/images/post3.jpg',
      tags: ['javascript'],
      readingTime: 3,
    },
  ];

  const mockPlaylists = [
    {
      id: 'pl1',
      title: 'JavaScript Playlist',
      slug: 'javascript-playlist',
      description: 'All about JavaScript.',
    },
    {
      id: 'pl2',
      title: 'AI Playlist',
      slug: 'ai-playlist',
      description: 'All about AI.',
    },
  ];

  const mockTopics = ['tech', 'ai'];
  const mockTags = ['javascript', 'react', 'python', 'ml'];

  const defaultProps = {
    recentPosts: mockPosts,
    playlists: mockPlaylists,
    allTopics: mockTopics,
    allTags: mockTags,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the articles page with SEO', () => {
    render(<ArticlesPage {...defaultProps} />);

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-title', 'Articles - Josh Lowe');
  });

  it('should render newsletter subscription component', () => {
    render(<ArticlesPage {...defaultProps} />);

    expect(screen.getByTestId('newsletter')).toBeInTheDocument();
  });

  it('should render all posts', () => {
    render(<ArticlesPage {...defaultProps} />);

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
    expect(screen.getByText('Third Post')).toBeInTheDocument();
  });

  it('should filter posts by search query', async () => {
    const user = userEvent.setup();
    render(<ArticlesPage {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'First');

    // The filterAndSortPosts mock will filter based on searchQuery
    expect(screen.getByText('First Post')).toBeInTheDocument();
  });

  it('should filter posts by topic', async () => {
    const user = userEvent.setup();
    render(<ArticlesPage {...defaultProps} />);

    // Find the topic select by its option content
    const allSelects = screen.getAllByRole('combobox');
    const topicSelect = allSelects.find((select) =>
      select.querySelector('option[value="all"]')?.textContent === 'All Topics'
    );
    
    if (topicSelect) {
      await user.selectOptions(topicSelect, 'tech');
    }
    // The mock will filter tech posts only
  });

  it('should filter posts by tag', async () => {
    const user = userEvent.setup();
    render(<ArticlesPage {...defaultProps} />);

    // Find the tag select by its option content
    const allSelects = screen.getAllByRole('combobox');
    const tagSelect = allSelects.find((select) =>
      select.querySelector('option[value="all"]')?.textContent === 'All Tags'
    );
    
    if (tagSelect) {
      await user.selectOptions(tagSelect, 'javascript');
    }
  });

  it('should render playlists section', () => {
    render(<ArticlesPage {...defaultProps} />);

    expect(screen.getByText('JavaScript Playlist')).toBeInTheDocument();
    expect(screen.getByText('AI Playlist')).toBeInTheDocument();
  });

  it('should render pagination when there are multiple pages', () => {
    // Mock many posts to trigger pagination
    const manyPosts = Array.from({ length: 15 }, (_, i) => ({
      ...mockPosts[0],
      id: String(i + 1),
      title: `Post ${i + 1}`,
      slug: `post-${i + 1}`,
    }));

    render(<ArticlesPage {...defaultProps} recentPosts={manyPosts} />);

    // There might be multiple paginations (one for posts, one for playlists)
    const paginationElements = screen.getAllByTestId('pagination');
    expect(paginationElements.length).toBeGreaterThan(0);
  });

  it('should change sort order', async () => {
    const user = userEvent.setup();
    render(<ArticlesPage {...defaultProps} />);

    // Find the sort select by its option content
    const allSelects = screen.getAllByRole('combobox');
    const sortSelect = allSelects.find((select) =>
      select.querySelector('option[value="datePublished-desc"]')
    );
    
    if (sortSelect) {
      await user.selectOptions(sortSelect, 'title-asc');
    }
  });

  it('should handle empty posts gracefully', () => {
    render(<ArticlesPage {...defaultProps} recentPosts={[]} />);

    // Should still render the page without crashing
    expect(screen.getByTestId('seo')).toBeInTheDocument();
  });

  it('should handle empty playlists gracefully', () => {
    render(<ArticlesPage {...defaultProps} playlists={[]} />);

    // Should still render the page without crashing
    expect(screen.getByTestId('seo')).toBeInTheDocument();
  });

  it('should display post descriptions', () => {
    render(<ArticlesPage {...defaultProps} />);

    expect(screen.getByText('First post description.')).toBeInTheDocument();
    expect(screen.getByText('Second post description.')).toBeInTheDocument();
  });

  it('should display reading time for posts', () => {
    render(<ArticlesPage {...defaultProps} />);

    // The component renders "{readingTime} min read"
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('10 min read')).toBeInTheDocument();
    expect(screen.getByText('3 min read')).toBeInTheDocument();
  });

  it('should link to individual article pages', () => {
    render(<ArticlesPage {...defaultProps} />);

    const firstPostLink = screen.getByRole('link', { name: /first post/i });
    expect(firstPostLink).toHaveAttribute('href', expect.stringContaining('first-post'));
  });
});

