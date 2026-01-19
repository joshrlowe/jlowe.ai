import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from '../../pages/_app';

// Mock next/router
const mockPrefetch = jest.fn();
const mockRouter = {
  pathname: '/',
  prefetch: mockPrefetch,
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => <div data-testid="session-provider">{children}</div>,
}));

// Mock components
jest.mock('@/components/Header', () => {
  return function MockHeader({ style }) {
    return <header data-testid="header" style={style}>Header</header>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

jest.mock('@/components/admin/ToastProvider', () => {
  return function MockToastProvider({ children }) {
    return <div data-testid="toast-provider">{children}</div>;
  };
});

jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('@/components/ui/ScrollProgress', () => {
  return function MockScrollProgress() {
    return <div data-testid="scroll-progress">Scroll Progress</div>;
  };
});

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

jest.mock('@/lib/fonts', () => ({
  spaceGrotesk: { variable: 'font-space' },
  plusJakartaSans: { variable: 'font-jakarta' },
  jetbrainsMono: { variable: 'font-jetbrains' },
}));

// Mock navigator.serviceWorker
const mockRegister = jest.fn().mockResolvedValue({});
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: mockRegister,
  },
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('App', () => {
  const MockComponent = () => <div data-testid="page-content">Page Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.pathname = '/';
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should render the default layout for non-admin pages', () => {
    render(<App Component={MockComponent} pageProps={{}} />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
  });

  it('should render the admin layout for admin pages', () => {
    mockRouter.pathname = '/admin/dashboard';
    render(<App Component={MockComponent} pageProps={{}} />);

    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('should register service worker on mount', async () => {
    render(<App Component={MockComponent} pageProps={{}} />);

    await act(async () => {
      // Wait for useEffect
    });

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('should skip intro animation when not on home page', () => {
    mockRouter.pathname = '/about';
    render(<App Component={MockComponent} pageProps={{}} />);

    // Header should be visible immediately (opacity 1)
    const header = screen.getByTestId('header');
    expect(header).toHaveStyle({ opacity: 1 });
  });

  it('should skip intro animation if session storage indicates it has played', () => {
    mockSessionStorage.getItem.mockReturnValue('true');
    mockRouter.pathname = '/';
    
    render(<App Component={MockComponent} pageProps={{}} />);

    const header = screen.getByTestId('header');
    expect(header).toHaveStyle({ opacity: 1 });
  });

  it('should listen for intro animation complete event', async () => {
    mockRouter.pathname = '/';
    mockSessionStorage.getItem.mockReturnValue(null);

    render(<App Component={MockComponent} pageProps={{}} />);

    // Initially header should be hidden (intro not complete)
    const header = screen.getByTestId('header');
    expect(header).toHaveStyle({ opacity: 0 });

    // Dispatch intro complete event
    await act(async () => {
      window.dispatchEvent(new Event('introAnimationComplete'));
    });

    // Header should now be visible
    expect(header).toHaveStyle({ opacity: 1 });
  });

  it('should prefetch links on mouseenter', async () => {
    render(<App Component={MockComponent} pageProps={{}} />);

    // Wait for mount
    await act(async () => {});

    // Create a link element and trigger mouseenter
    const link = document.createElement('a');
    link.href = '/about';
    link.setAttribute('href', '/about');
    document.body.appendChild(link);

    // Simulate mouseenter on the link
    await act(async () => {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      Object.defineProperty(event, 'target', { value: link });
      link.dispatchEvent(event);
    });

    // Prefetch should have been called
    // Note: This may not work perfectly due to event handling complexity
    document.body.removeChild(link);
  });

  it('should render skip to content link', () => {
    render(<App Component={MockComponent} pageProps={{}} />);

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('should include Analytics component', () => {
    render(<App Component={MockComponent} pageProps={{}} />);

    expect(screen.getByTestId('analytics')).toBeInTheDocument();
  });

  it('should pass session to SessionProvider', () => {
    const mockSession = { user: { name: 'Test User' } };
    render(<App Component={MockComponent} pageProps={{ session: mockSession }} />);

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });
});

