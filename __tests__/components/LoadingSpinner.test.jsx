/**
 * Tests for LoadingSpinner Component
 * 
 * Tests the loading spinner with all size variations and accessibility.
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoadingSpinner from '@/components/admin/shared/LoadingSpinner';

expect.extend(toHaveNoViolations);

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render a spinning element', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have rounded full shape', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full');
    });
  });

  describe('sizes', () => {
    it('should render md size by default', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('should render sm size', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
    });

    it('should render lg size', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
    });
  });

  describe('border thickness', () => {
    it('should have border-2 for sm size', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-2');
    });

    it('should have border-2 for md size', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner size="md" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-2');
    });

    it('should have border-4 for lg size', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-4');
    });
  });

  describe('custom className', () => {
    it('should apply custom className to container', () => {
      const { container } = renderWithoutProviders(
        <LoadingSpinner className="custom-loading" />
      );
      expect(container.firstChild).toHaveClass('custom-loading');
    });

    it('should merge with default container classes', () => {
      const { container } = renderWithoutProviders(
        <LoadingSpinner className="extra-class" />
      );
      expect(container.firstChild).toHaveClass('extra-class');
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
      expect(container.firstChild).toHaveClass('justify-center');
    });
  });

  describe('container styling', () => {
    it('should be centered', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
      expect(container.firstChild).toHaveClass('justify-center');
    });

    it('should have vertical padding', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass('py-8');
    });
  });

  describe('spinner styling', () => {
    it('should have border with primary color', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-[var(--color-primary)]');
    });

    it('should have transparent top border for spinning effect', () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-t-transparent');
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithoutProviders(<LoadingSpinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all sizes', async () => {
      const { container } = renderWithoutProviders(
        <div>
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});



