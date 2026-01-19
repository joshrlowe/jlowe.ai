/**
 * Tests for HomeSettingsSection admin component
 *
 * Tests the main home settings section with tabbed navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomeSettingsSection from '../../../components/admin/HomeSettingsSection';

// Mock ToastProvider
const mockShowToast = jest.fn();
jest.mock('../../../components/admin/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock shared components
jest.mock('../../../components/admin/shared', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  adminStyles: {
    tabActive: 'tab-active',
    tabInactive: 'tab-inactive',
    buttonPrimary: 'btn-primary',
  },
}));

// Mock home tabs
jest.mock('../../../components/admin/home', () => ({
  WelcomeTab: ({ welcomeData, setWelcomeData, saving, onSave }) => (
    <div data-testid="welcome-tab">
      <input
        data-testid="welcome-name"
        value={welcomeData.name}
        onChange={(e) => setWelcomeData({ ...welcomeData, name: e.target.value })}
      />
      <button data-testid="save-welcome" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  ),
  HeroTab: ({ homeContent, setHomeContent, saving, onSave }) => (
    <div data-testid="hero-tab">
      <input
        data-testid="hero-title"
        value={homeContent.heroTitle}
        onChange={(e) => setHomeContent({ ...homeContent, heroTitle: e.target.value })}
      />
      <button data-testid="save-hero" onClick={onSave} disabled={saving}>
        Save
      </button>
    </div>
  ),
  ServicesTab: ({ homeContent, saving, onSave }) => (
    <div data-testid="services-tab">
      <button data-testid="save-services" onClick={onSave} disabled={saving}>
        Save
      </button>
    </div>
  ),
  GitHubTab: ({ homeContent, saving, onSave }) => (
    <div data-testid="github-tab">
      <button data-testid="save-github" onClick={onSave} disabled={saving}>
        Save
      </button>
    </div>
  ),
  SectionsTab: ({ enabledSections, setEnabledSections, saving, onSave }) => (
    <div data-testid="sections-tab">
      <button data-testid="save-sections" onClick={onSave} disabled={saving}>
        Save
      </button>
    </div>
  ),
  DEFAULT_ENABLED_SECTIONS: ['hero', 'welcome', 'projects'],
}));

// Mock fetch
global.fetch = jest.fn();

describe('HomeSettingsSection', () => {
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/welcome')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'Josh Lowe',
            briefBio: 'AI Engineer',
            callToAction: 'Building AI',
          }),
        });
      }
      if (url.includes('/api/admin/page-content')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: {
              typingIntro: 'I build...',
              heroTitle: 'AI systems',
              typingStrings: ['intelligent', 'systems'],
              primaryCta: { text: 'View Work', href: '/projects' },
              secondaryCta: { text: 'Contact', href: '/contact' },
              techBadges: [{ name: 'React', color: '#61DAFB' }],
              servicesTitle: 'Services',
              services: [],
            },
          }),
        });
      }
      if (url.includes('/api/admin/site-settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            enabledSections: ['hero', 'welcome', 'projects'],
          }),
        });
      }
      if (url.includes('/api/revalidate')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while fetching data', async () => {
      // Make fetch hang
      global.fetch.mockImplementation(() => new Promise(() => {}));

      render(<HomeSettingsSection onError={mockOnError} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('should render all tabs', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Info')).toBeInTheDocument();
      });

      expect(screen.getByText('Hero Section')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('GitHub Section')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
    });

    it('should show Welcome tab by default', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('welcome-tab')).toBeInTheDocument();
      });
    });

    it('should switch to Hero tab when clicked', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Hero Section')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Hero Section'));

      await waitFor(() => {
        expect(screen.getByTestId('hero-tab')).toBeInTheDocument();
      });
    });

    it('should switch to Sections tab when clicked', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Sections')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sections'));

      await waitFor(() => {
        expect(screen.getByTestId('sections-tab')).toBeInTheDocument();
      });
    });

    it('should switch to GitHub tab when clicked', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('GitHub Section')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('GitHub Section'));

      await waitFor(() => {
        expect(screen.getByTestId('github-tab')).toBeInTheDocument();
      });
    });

    it('should switch to Services tab when clicked', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Services'));

      await waitFor(() => {
        expect(screen.getByTestId('services-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Data fetching', () => {
    it('should fetch welcome data on mount', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/welcome');
      });
    });

    it('should fetch home content on mount', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/page-content?pageKey=home');
      });
    });

    it('should fetch site settings on mount', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/site-settings');
      });
    });

    it('should call onError when fetch fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load home page data');
      });
    });
  });

  describe('Save welcome data', () => {
    it('should save welcome data successfully', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('welcome-tab')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-welcome'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/welcome', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Welcome data saved!', 'success');
      });
    });

    it('should show error toast when save fails', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/welcome')) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('welcome-tab')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-welcome'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to save welcome data', 'error');
      });
    });
  });

  describe('Save home content', () => {
    it('should save hero content successfully', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Hero Section')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Hero Section'));

      await waitFor(() => {
        expect(screen.getByTestId('hero-tab')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-hero'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/page-content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Home content saved!', 'success');
      });
    });
  });

  describe('Save sections', () => {
    it('should save sections and trigger revalidation', async () => {
      render(<HomeSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Sections')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sections'));

      await waitFor(() => {
        expect(screen.getByTestId('sections-tab')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-sections'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Sections saved! Refresh home page to see changes.',
          'success'
        );
      });
    });
  });
});

