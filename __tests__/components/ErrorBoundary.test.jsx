/**
 * Tests for ErrorBoundary Component
 * 
 * Tests error boundary functionality including error catching,
 * error UI, and reset behavior.
 */

import React from 'react';
import { screen, renderWithoutProviders, fireEvent } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import ErrorBoundary from '@/components/ErrorBoundary';

expect.extend(toHaveNoViolations);

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws an error on render
const AlwaysThrows = () => {
  throw new Error('Always throws');
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  describe('normal rendering', () => {
    it('should render children when no error', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('should render nested elements', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <div>
            <span>Nested content</span>
          </div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch errors and display error UI', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error message', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    });

    it('should display refresh button', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should display error icon', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('should call handleReset when refresh is clicked', () => {
      // Mock window.location using Object.defineProperty since reload is read-only
      const mockReload = jest.fn();
      const originalLocation = window.location;
      
      delete window.location;
      window.location = { ...originalLocation, reload: mockReload };

      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      
      expect(mockReload).toHaveBeenCalled();
      
      window.location = originalLocation;
    });
  });

  describe('development mode error details', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development', () => {
      process.env.NODE_ENV = 'development';
      
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      // Error details should be in a details element
      const details = document.querySelector('details');
      expect(details).toBeInTheDocument();
    });

    it('should have expandable details', () => {
      process.env.NODE_ENV = 'development';
      
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      const summary = document.querySelector('summary');
      expect(summary).toBeInTheDocument();
      expect(summary.textContent).toContain('Error Details');
    });
  });

  describe('state management', () => {
    it('should set hasError to true when error occurs', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      // If hasError is true, error UI is shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should capture error object', () => {
      process.env.NODE_ENV = 'development';
      
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      // Error message should be displayed in development
      const pre = document.querySelector('pre');
      expect(pre).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have full screen layout', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
    });

    it('should center content', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      const container = document.querySelector('.flex.items-center.justify-center');
      expect(container).toBeInTheDocument();
    });

    it('should have error icon container', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      
      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have no violations when rendering children', async () => {
      const { container } = renderWithoutProviders(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in error state', async () => {
      const { container } = renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have heading in error state', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      renderWithoutProviders(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );
      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });
  });
});

