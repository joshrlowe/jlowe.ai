/**
 * Tests for KeyboardShortcutsHelp component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KeyboardShortcutsHelp from '../../../components/admin/KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp', () => {
  const mockOnHide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When show is false', () => {
    it('should return null', () => {
      const { container } = render(<KeyboardShortcutsHelp show={false} onHide={mockOnHide} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When show is true', () => {
    it('should render the modal', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should render all keyboard shortcuts', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      expect(screen.getByText('Focus search')).toBeInTheDocument();
      expect(screen.getByText('Create new project')).toBeInTheDocument();
      expect(screen.getByText('Save (in modal)')).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('Deselect all')).toBeInTheDocument();
      expect(screen.getByText('Close modal')).toBeInTheDocument();
    });

    it('should render keyboard keys', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      expect(screen.getByText('Ctrl/Cmd + K')).toBeInTheDocument();
      expect(screen.getByText('Ctrl/Cmd + N')).toBeInTheDocument();
      expect(screen.getByText('Ctrl/Cmd + S')).toBeInTheDocument();
      expect(screen.getByText('Ctrl/Cmd + A')).toBeInTheDocument();
      expect(screen.getByText('Ctrl/Cmd + D')).toBeInTheDocument();
      expect(screen.getByText('Escape')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should call onHide when close button is clicked', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);
      expect(mockOnHide).toHaveBeenCalled();
    });

    it('should call onHide when backdrop is clicked', () => {
      render(<KeyboardShortcutsHelp show={true} onHide={mockOnHide} />);
      // Find the backdrop (the fixed div with bg-black/50)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(backdrop);
      expect(mockOnHide).toHaveBeenCalled();
    });
  });
});

