/**
 * Tests for GlobalSettingsSection admin component
 *
 * Tests site-wide settings management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalSettingsSection from '../../../components/admin/GlobalSettingsSection';

// Mock ToastProvider
const mockShowToast = jest.fn();
jest.mock('../../../components/admin/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GlobalSettingsSection', () => {
  const mockOnError = jest.fn();
  const mockSettings = {
    ownerName: 'Josh Lowe',
    siteName: 'jlowe.ai',
    footerText: 'Copyright 2024',
    navLinks: [
      { label: 'Home', href: '/', order: 0 },
      { label: 'Projects', href: '/projects', order: 1 },
    ],
    seoDefaults: { title: 'Josh Lowe' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockImplementation((url) => {
      if (url === '/api/admin/site-settings') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSettings),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while fetching', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<GlobalSettingsSection onError={mockOnError} />);

      // Check for spinner by class name
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Form rendering', () => {
    it('should render owner name input', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Owner Name')).toBeInTheDocument();
      });
    });

    it('should render site name input', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Site Name')).toBeInTheDocument();
      });
    });

    it('should render footer sections', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Footer Title/Role')).toBeInTheDocument();
        expect(screen.getByText('Footer Description')).toBeInTheDocument();
      });
    });

    it('should render navigation links section', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Navigation Links')).toBeInTheDocument();
      });
    });

    it('should render save button', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form values', () => {
    it('should display fetched settings values', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Josh Lowe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jlowe.ai')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Copyright 2024')).toBeInTheDocument();
      });
    });

    it('should display navigation links', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Projects')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/projects')).toBeInTheDocument();
      });
    });
  });

  describe('Form interactions', () => {
    it('should update site name on input', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('jlowe.ai')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('jlowe.ai'), {
        target: { value: 'New Site Name' },
      });

      expect(screen.getByDisplayValue('New Site Name')).toBeInTheDocument();
    });

    it('should update footer text on input', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Copyright 2024')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('Copyright 2024'), {
        target: { value: 'New Footer' },
      });

      expect(screen.getByDisplayValue('New Footer')).toBeInTheDocument();
    });
  });

  describe('Navigation links management', () => {
    it('should add new nav link when Add Link clicked', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Navigation Links')).toBeInTheDocument();
      });

      const initialLinks = screen.getAllByPlaceholderText('Label').length;
      fireEvent.click(screen.getByRole('button', { name: /add link/i }));

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText('Label').length).toBe(initialLinks + 1);
      });
    });

    it('should remove nav link when Remove clicked', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText('Label').length).toBe(2);
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText('Label').length).toBe(1);
      });
    });

    it('should update nav link label', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('Home'), {
        target: { value: 'Homepage' },
      });

      expect(screen.getByDisplayValue('Homepage')).toBeInTheDocument();
    });

    it('should update nav link URL', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/')).toBeInTheDocument();
      });

      const urlInputs = screen.getAllByPlaceholderText('URL');
      fireEvent.change(urlInputs[0], {
        target: { value: '/home' },
      });

      expect(screen.getByDisplayValue('/home')).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should save settings on submit', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });
    });

    it('should show success message on save', async () => {
      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Settings saved!', 'success');
      });
    });

    it('should show error on save failure', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (options?.method === 'PUT') {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSettings),
        });
      });

      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to save settings', 'error');
      });
    });

    it('should disable button while saving', async () => {
      // Make save hang
      global.fetch.mockImplementation((url, options) => {
        if (options?.method === 'PUT') {
          return new Promise(() => {});
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSettings),
        });
      });

      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });
    });
  });

  describe('Error handling', () => {
    it('should call onError when fetch fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<GlobalSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load settings');
      });
    });
  });
});

