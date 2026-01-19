/**
 * Tests for BulkActionsToolbar component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionsToolbar from '../../../components/admin/BulkActionsToolbar';

describe('BulkActionsToolbar', () => {
  const mockOnSelectAll = jest.fn();
  const mockOnDeselectAll = jest.fn();
  const mockOnBulkDelete = jest.fn();
  const mockOnBulkStatusChange = jest.fn();
  const mockOnBulkFeaturedChange = jest.fn();

  const defaultProps = {
    selectedIds: ['1', '2'],
    onSelectAll: mockOnSelectAll,
    onDeselectAll: mockOnDeselectAll,
    onBulkDelete: mockOnBulkDelete,
    onBulkStatusChange: mockOnBulkStatusChange,
    onBulkFeaturedChange: mockOnBulkFeaturedChange,
    allSelected: false,
    someSelected: true,
    totalCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When no items selected', () => {
    it('should return null', () => {
      const { container } = render(<BulkActionsToolbar {...defaultProps} selectedIds={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When items are selected', () => {
    it('should render the toolbar', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByText('2 of 5 selected')).toBeInTheDocument();
    });

    it('should render Select All button', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Select All' })).toBeInTheDocument();
    });

    it('should render Deselect All button', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Deselect All' })).toBeInTheDocument();
    });

    it('should render Feature button', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Feature' })).toBeInTheDocument();
    });

    it('should render Delete Selected button', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument();
    });

    it('should render status select', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelectAll when Select All is clicked', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
      expect(mockOnSelectAll).toHaveBeenCalled();
    });

    it('should call onDeselectAll when Deselect All is clicked', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }));
      expect(mockOnDeselectAll).toHaveBeenCalled();
    });

    it('should call onBulkDelete when Delete Selected is clicked', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Delete Selected' }));
      expect(mockOnBulkDelete).toHaveBeenCalled();
    });

    it('should call onBulkFeaturedChange when Feature is clicked', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Feature' }));
      expect(mockOnBulkFeaturedChange).toHaveBeenCalledWith(true);
    });

    it('should call onBulkStatusChange when status is selected', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Published' } });
      expect(mockOnBulkStatusChange).toHaveBeenCalledWith('Published');
    });

    it('should not call onBulkStatusChange when empty option is selected', () => {
      render(<BulkActionsToolbar {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });
      expect(mockOnBulkStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('Select All disabled state', () => {
    it('should disable Select All when allSelected is true', () => {
      render(<BulkActionsToolbar {...defaultProps} allSelected={true} />);
      expect(screen.getByRole('button', { name: 'Select All' })).toBeDisabled();
    });

    it('should enable Select All when allSelected is false', () => {
      render(<BulkActionsToolbar {...defaultProps} allSelected={false} />);
      expect(screen.getByRole('button', { name: 'Select All' })).not.toBeDisabled();
    });
  });
});

