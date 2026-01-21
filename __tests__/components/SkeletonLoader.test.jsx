/**
 * Tests for SkeletonLoader Component
 * 
 * Tests skeleton loading states for cards and tables.
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import SkeletonLoader, {
  TableRowSkeleton,
  CardSkeleton,
} from '@/components/admin/SkeletonLoader';

expect.extend(toHaveNoViolations);

describe('SkeletonLoader', () => {
  describe('CardSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = renderWithoutProviders(<CardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      const { container } = renderWithoutProviders(<CardSkeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('should have card styling', () => {
      const { container } = renderWithoutProviders(<CardSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg');
      expect(container.firstChild).toHaveClass('border');
    });

    it('should render placeholder lines', () => {
      const { container } = renderWithoutProviders(<CardSkeleton />);
      const placeholders = container.querySelectorAll('.rounded');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('TableRowSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      expect(container.querySelector('tr')).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      expect(container.querySelector('tr')).toHaveClass('animate-pulse');
    });

    it('should render 6 columns by default', () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      const cells = container.querySelectorAll('td');
      expect(cells).toHaveLength(6);
    });

    it('should render custom column count', () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton colCount={4} />
          </tbody>
        </table>
      );
      const cells = container.querySelectorAll('td');
      expect(cells).toHaveLength(4);
    });

    it('should render placeholder in each cell', () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton colCount={3} />
          </tbody>
        </table>
      );
      const placeholders = container.querySelectorAll('.rounded');
      expect(placeholders).toHaveLength(3);
    });
  });

  describe('SkeletonLoader (default export)', () => {
    describe('card type', () => {
      it('should render card type by default', () => {
        const { container } = renderWithoutProviders(<SkeletonLoader />);
        expect(container.querySelector('.space-y-4')).toBeInTheDocument();
      });

      it('should render 3 cards by default', () => {
        const { container } = renderWithoutProviders(<SkeletonLoader />);
        const cards = container.querySelectorAll('.animate-pulse');
        expect(cards).toHaveLength(3);
      });

      it('should render custom count of cards', () => {
        const { container } = renderWithoutProviders(<SkeletonLoader count={5} />);
        const cards = container.querySelectorAll('.animate-pulse');
        expect(cards).toHaveLength(5);
      });

      it('should render 1 card when count is 1', () => {
        const { container } = renderWithoutProviders(<SkeletonLoader count={1} />);
        const cards = container.querySelectorAll('.animate-pulse');
        expect(cards).toHaveLength(1);
      });
    });

    describe('table type', () => {
      it('should render table rows when type is table', () => {
        const { container } = renderWithoutProviders(
          <table>
            <tbody>
              <SkeletonLoader type="table" />
            </tbody>
          </table>
        );
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(3);
      });

      it('should render custom count of rows', () => {
        const { container } = renderWithoutProviders(
          <table>
            <tbody>
              <SkeletonLoader type="table" count={5} />
            </tbody>
          </table>
        );
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(5);
      });

      it('should render 1 row when count is 1', () => {
        const { container } = renderWithoutProviders(
          <table>
            <tbody>
              <SkeletonLoader type="table" count={1} />
            </tbody>
          </table>
        );
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(1);
      });
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations for card skeleton', async () => {
      const { container } = renderWithoutProviders(<CardSkeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for table row skeleton', async () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for multiple card skeletons', async () => {
      const { container } = renderWithoutProviders(<SkeletonLoader count={3} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for table type', async () => {
      const { container } = renderWithoutProviders(
        <table>
          <tbody>
            <SkeletonLoader type="table" count={3} />
          </tbody>
        </table>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});




