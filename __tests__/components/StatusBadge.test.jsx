/**
 * Tests for StatusBadge Component
 * 
 * Tests the project status badge with all status types and sizes.
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import StatusBadge from '@/components/Project/StatusBadge';

expect.extend(toHaveNoViolations);

describe('StatusBadge', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      renderWithoutProviders(<StatusBadge status="Published" />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render a span element', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Published" />);
      expect(container.firstChild.tagName).toBe('SPAN');
    });

    it('should render status indicator dot', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Published" />);
      const dot = container.querySelector('.rounded-full.w-1\\.5');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('status types', () => {
    const statusTests = [
      { status: 'Published', label: 'Live' },
      { status: 'InProgress', label: 'In Progress' },
      { status: 'InDevelopment', label: 'In Development' },
      { status: 'Completed', label: 'Completed' },
      { status: 'Maintenance', label: 'Maintenance' },
      { status: 'OnHold', label: 'On Hold' },
      { status: 'Deprecated', label: 'Deprecated' },
      { status: 'Draft', label: 'Draft' },
    ];

    statusTests.forEach(({ status, label }) => {
      it(`should render "${label}" for ${status} status`, () => {
        renderWithoutProviders(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should default to Draft for unknown status', () => {
      renderWithoutProviders(<StatusBadge status="Unknown" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should default to Draft for undefined status', () => {
      renderWithoutProviders(<StatusBadge status={undefined} />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should render sm size by default', () => {
      renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render sm size', () => {
      renderWithoutProviders(<StatusBadge status="Published" size="sm" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render md size', () => {
      renderWithoutProviders(<StatusBadge status="Published" size="md" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render lg size', () => {
      renderWithoutProviders(<StatusBadge status="Published" size="lg" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-2');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('styling', () => {
    it('should have rounded-full styling', () => {
      renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should have inline-flex display', () => {
      renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('inline-flex');
    });

    it('should have font-medium styling', () => {
      renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = screen.getByText('Live').closest('span');
      expect(badge).toHaveClass('font-medium');
    });

    it('should apply inline styles for colors', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = container.firstChild;
      expect(badge.style.background).toBeTruthy();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.border).toBeTruthy();
    });
  });

  describe('status colors', () => {
    // Colors are returned as RGB in jsdom, so we check for the RGB values
    it('should use green color for Published', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Published" />);
      const badge = container.firstChild;
      // #10b981 = rgb(16, 185, 129)
      expect(badge.style.color).toMatch(/rgb\(16,?\s*185,?\s*129\)/);
    });

    it('should use cyan color for InProgress', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="InProgress" />);
      const badge = container.firstChild;
      // #00d4ff = rgb(0, 212, 255)
      expect(badge.style.color).toMatch(/rgb\(0,?\s*212,?\s*255\)/);
    });

    it('should use purple color for InDevelopment', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="InDevelopment" />);
      const badge = container.firstChild;
      // #8b5cf6 = rgb(139, 92, 246)
      expect(badge.style.color).toMatch(/rgb\(139,?\s*92,?\s*246\)/);
    });

    it('should use yellow color for Maintenance', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Maintenance" />);
      const badge = container.firstChild;
      // #f59e0b = rgb(245, 158, 11)
      expect(badge.style.color).toMatch(/rgb\(245,?\s*158,?\s*11\)/);
    });

    it('should use gray color for OnHold', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="OnHold" />);
      const badge = container.firstChild;
      // #64748b = rgb(100, 116, 139)
      expect(badge.style.color).toMatch(/rgb\(100,?\s*116,?\s*139\)/);
    });

    it('should use red color for Deprecated', () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Deprecated" />);
      const badge = container.firstChild;
      // #ef4444 = rgb(239, 68, 68)
      expect(badge.style.color).toMatch(/rgb\(239,?\s*68,?\s*68\)/);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithoutProviders(<StatusBadge status="Published" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all status types', async () => {
      const { container } = renderWithoutProviders(
        <div>
          <StatusBadge status="Published" />
          <StatusBadge status="InProgress" />
          <StatusBadge status="Completed" />
          <StatusBadge status="OnHold" />
          <StatusBadge status="Deprecated" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all sizes', async () => {
      const { container } = renderWithoutProviders(
        <div>
          <StatusBadge status="Published" size="sm" />
          <StatusBadge status="Published" size="md" />
          <StatusBadge status="Published" size="lg" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

