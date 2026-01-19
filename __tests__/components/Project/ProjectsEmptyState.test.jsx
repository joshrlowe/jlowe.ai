/**
 * Tests for ProjectsEmptyState component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectsEmptyState from '../../../components/Project/ProjectsEmptyState';

describe('ProjectsEmptyState', () => {
  const mockOnClearFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state message', () => {
    render(<ProjectsEmptyState hasFilters={false} onClearFilters={mockOnClearFilters} />);
    expect(screen.getByText(/no projects/i)).toBeInTheDocument();
  });

  it('should show clear filters button when hasFilters is true', () => {
    render(<ProjectsEmptyState hasFilters={true} onClearFilters={mockOnClearFilters} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should not show clear filters button when hasFilters is false', () => {
    render(<ProjectsEmptyState hasFilters={false} onClearFilters={mockOnClearFilters} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('should call onClearFilters when clear button is clicked', () => {
    render(<ProjectsEmptyState hasFilters={true} onClearFilters={mockOnClearFilters} />);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(mockOnClearFilters).toHaveBeenCalled();
  });
});

