/**
 * Tests for WelcomeTab admin component
 *
 * Tests welcome info editing form
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeTab from '../../../../components/admin/home/WelcomeTab';

// Mock shared components
jest.mock('../../../../components/admin/shared', () => ({
  FormField: ({ label, value, onChange, rows, placeholder }) => (
    <div>
      <label>{label}</label>
      {rows ? (
        <textarea
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  ),
  adminStyles: {
    buttonPrimary: 'btn-primary',
  },
}));

describe('WelcomeTab', () => {
  const mockWelcomeData = {
    name: 'Josh Lowe',
    briefBio: 'AI/ML Engineer building intelligent systems',
    callToAction: 'AI Engineer & Consultant',
  };

  const mockSetWelcomeData = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Tagline / Role')).toBeInTheDocument();
      expect(screen.getByText('Brief Bio')).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save welcome info/i })).toBeInTheDocument();
    });

    it('should show saving state', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={true}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Form values', () => {
    it('should display welcome data values', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-name')).toHaveValue('Josh Lowe');
      expect(screen.getByTestId('input-tagline-/-role')).toHaveValue('AI Engineer & Consultant');
      expect(screen.getByTestId('input-brief-bio')).toHaveValue('AI/ML Engineer building intelligent systems');
    });
  });

  describe('Form interactions', () => {
    it('should call setWelcomeData when name changes', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.change(screen.getByTestId('input-name'), {
        target: { value: 'New Name' },
      });

      expect(mockSetWelcomeData).toHaveBeenCalledWith({
        ...mockWelcomeData,
        name: 'New Name',
      });
    });

    it('should call setWelcomeData when tagline changes', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.change(screen.getByTestId('input-tagline-/-role'), {
        target: { value: 'New Tagline' },
      });

      expect(mockSetWelcomeData).toHaveBeenCalledWith({
        ...mockWelcomeData,
        callToAction: 'New Tagline',
      });
    });

    it('should call setWelcomeData when bio changes', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.change(screen.getByTestId('input-brief-bio'), {
        target: { value: 'New Bio' },
      });

      expect(mockSetWelcomeData).toHaveBeenCalledWith({
        ...mockWelcomeData,
        briefBio: 'New Bio',
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSave when form is submitted', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.submit(screen.getByRole('button').closest('form'));

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should prevent default form behavior', () => {
      render(
        <WelcomeTab
          welcomeData={mockWelcomeData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const form = screen.getByRole('button').closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'preventDefault', { value: jest.fn() });

      form.dispatchEvent(submitEvent);

      expect(submitEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Empty state', () => {
    it('should handle empty welcome data', () => {
      const emptyData = {
        name: '',
        briefBio: '',
        callToAction: '',
      };

      render(
        <WelcomeTab
          welcomeData={emptyData}
          setWelcomeData={mockSetWelcomeData}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-name')).toHaveValue('');
      expect(screen.getByTestId('input-tagline-/-role')).toHaveValue('');
      expect(screen.getByTestId('input-brief-bio')).toHaveValue('');
    });
  });
});

