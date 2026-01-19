/**
 * Tests for HeroTab admin component
 *
 * Tests hero section editing form with typing animation, CTAs, and tech badges
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroTab from '../../../../components/admin/home/HeroTab';

// Mock shared components
jest.mock('../../../../components/admin/shared', () => ({
  FormField: ({ label, value, onChange, placeholder }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  ),
  adminStyles: {
    card: 'card',
    label: 'label',
    input: 'input',
    buttonPrimary: 'btn-primary',
    buttonDanger: 'btn-danger',
  },
}));

describe('HeroTab', () => {
  const mockHomeContent = {
    typingIntro: 'I build...',
    heroTitle: 'intelligent AI systems',
    typingStrings: ['production AI systems', 'scalable ML pipelines'],
    primaryCta: { text: 'View My Work', href: '/projects' },
    secondaryCta: { text: 'Get in Touch', href: '/contact' },
    techBadges: [
      { name: 'Python', color: '#3776AB' },
      { name: 'React', color: '#61DAFB' },
    ],
  };

  const mockSetHomeContent = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Typing Animation section', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Typing Animation')).toBeInTheDocument();
    });

    it('should render Call to Action Buttons section', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Call to Action Buttons')).toBeInTheDocument();
    });

    it('should render Tech Badges section', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Tech Badges')).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save hero content/i })).toBeInTheDocument();
    });

    it('should show saving state', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={true}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Typing Animation section', () => {
    it('should display intro text field', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-intro-text-(before-typing)')).toHaveValue('I build...');
    });

    it('should display hero title field', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-hero-title-(main-display)')).toHaveValue('intelligent AI systems');
    });

    it('should display typing strings', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      // Find typing string inputs (they have the input class)
      const inputs = screen.getAllByRole('textbox');
      const typingInputs = inputs.filter((input) => input.value === 'production AI systems');
      expect(typingInputs.length).toBeGreaterThan(0);
    });

    it('should have Add String button', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /\+ add string/i })).toBeInTheDocument();
    });
  });

  describe('Typing strings management', () => {
    it('should add typing string when Add String clicked', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /\+ add string/i }));

      expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the updater function
      const updaterFn = mockSetHomeContent.mock.calls[0][0];
      const result = updaterFn(mockHomeContent);
      expect(result.typingStrings).toHaveLength(3);
      expect(result.typingStrings[2]).toBe('');
    });

    it('should remove typing string when remove button clicked', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      // Find remove buttons (✕)
      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      // First two should be for typing strings, rest for tech badges
      fireEvent.click(removeButtons[0]);

      expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetHomeContent.mock.calls[0][0];
      const result = updaterFn(mockHomeContent);
      expect(result.typingStrings).toHaveLength(1);
    });
  });

  describe('CTA Buttons section', () => {
    it('should display primary CTA fields', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-primary-cta-text')).toHaveValue('View My Work');
      expect(screen.getByTestId('input-primary-cta-link')).toHaveValue('/projects');
    });

    it('should display secondary CTA fields', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-secondary-cta-text')).toHaveValue('Get in Touch');
      expect(screen.getByTestId('input-secondary-cta-link')).toHaveValue('/contact');
    });

    it('should update primary CTA text', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.change(screen.getByTestId('input-primary-cta-text'), {
        target: { value: 'New CTA' },
      });

      expect(mockSetHomeContent).toHaveBeenCalledWith({
        ...mockHomeContent,
        primaryCta: { ...mockHomeContent.primaryCta, text: 'New CTA' },
      });
    });
  });

  describe('Tech Badges section', () => {
    it('should display tech badges', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      // Find text inputs with badge names
      const inputs = screen.getAllByRole('textbox');
      const pythonInput = inputs.find((input) => input.value === 'Python');
      const reactInput = inputs.find((input) => input.value === 'React');

      expect(pythonInput).toBeInTheDocument();
      expect(reactInput).toBeInTheDocument();
    });

    it('should have Add Badge button', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /\+ add badge/i })).toBeInTheDocument();
    });

    it('should add tech badge when Add Badge clicked', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /\+ add badge/i }));

      expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetHomeContent.mock.calls[0][0];
      const result = updaterFn(mockHomeContent);
      expect(result.techBadges).toHaveLength(3);
      expect(result.techBadges[2]).toEqual({ name: '', color: '#E85D04' });
    });
  });

  describe('Save functionality', () => {
    it('should call onSave when save button clicked', () => {
      render(
        <HeroTab
          homeContent={mockHomeContent}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save hero content/i }));

      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty typing strings array', () => {
      const contentWithEmptyStrings = {
        ...mockHomeContent,
        typingStrings: [],
      };

      render(
        <HeroTab
          homeContent={contentWithEmptyStrings}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /\+ add string/i })).toBeInTheDocument();
    });

    it('should handle empty tech badges array', () => {
      const contentWithEmptyBadges = {
        ...mockHomeContent,
        techBadges: [],
      };

      render(
        <HeroTab
          homeContent={contentWithEmptyBadges}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /\+ add badge/i })).toBeInTheDocument();
    });

    it('should handle null CTA values', () => {
      const contentWithNullCta = {
        ...mockHomeContent,
        primaryCta: null,
        secondaryCta: null,
      };

      render(
        <HeroTab
          homeContent={contentWithNullCta}
          setHomeContent={mockSetHomeContent}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('input-primary-cta-text')).toHaveValue('');
      expect(screen.getByTestId('input-secondary-cta-text')).toHaveValue('');
    });
  });
});

