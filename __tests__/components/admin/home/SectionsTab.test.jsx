/**
 * Tests for SectionsTab admin component
 *
 * Tests home page sections visibility management
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionsTab, { AVAILABLE_SECTIONS, DEFAULT_ENABLED_SECTIONS } from '../../../../components/admin/home/SectionsTab';

// Mock shared components
jest.mock('../../../../components/admin/shared', () => ({
  adminStyles: {
    buttonPrimary: 'btn-primary',
  },
}));

describe('SectionsTab', () => {
  const mockSetEnabledSections = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Exports', () => {
    it('should export AVAILABLE_SECTIONS', () => {
      expect(AVAILABLE_SECTIONS).toBeDefined();
      expect(Array.isArray(AVAILABLE_SECTIONS)).toBe(true);
    });

    it('should export DEFAULT_ENABLED_SECTIONS', () => {
      expect(DEFAULT_ENABLED_SECTIONS).toBeDefined();
      expect(Array.isArray(DEFAULT_ENABLED_SECTIONS)).toBe(true);
    });

    it('should have hero and welcome as required sections', () => {
      const heroSection = AVAILABLE_SECTIONS.find((s) => s.id === 'hero');
      const welcomeSection = AVAILABLE_SECTIONS.find((s) => s.id === 'welcome');

      expect(heroSection?.required).toBe(true);
      expect(welcomeSection?.required).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Home Page Sections')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Choose which sections appear on your home page/)).toBeInTheDocument();
    });

    it('should render all available sections', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      AVAILABLE_SECTIONS.forEach((section) => {
        expect(screen.getByText(section.label)).toBeInTheDocument();
      });
    });

    it('should render save button', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save sections/i })).toBeInTheDocument();
    });

    it('should show saving state', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={true}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('should show required badge for required sections', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const requiredBadges = screen.getAllByText('Required');
      // hero and welcome are required
      expect(requiredBadges.length).toBe(2);
    });
  });

  describe('Checkbox states', () => {
    it('should check enabled sections', () => {
      render(
        <SectionsTab
          enabledSections={['hero', 'welcome', 'projects']}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const projectsCheckbox = checkboxes.find((cb) => {
        // Find the checkbox within the projects section
        const label = cb.closest('label');
        return label?.textContent?.includes('Featured Projects');
      });

      expect(projectsCheckbox).toBeChecked();
    });

    it('should not check disabled sections', () => {
      render(
        <SectionsTab
          enabledSections={['hero', 'welcome']}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const projectsCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Featured Projects');
      });

      expect(projectsCheckbox).not.toBeChecked();
    });

    it('should disable required section checkboxes', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const heroCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Hero Section');
      });

      expect(heroCheckbox).toBeDisabled();
    });
  });

  describe('Toggle sections', () => {
    it('should add section when checking unchecked box', () => {
      render(
        <SectionsTab
          enabledSections={['hero', 'welcome']}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const servicesCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Services');
      });

      fireEvent.click(servicesCheckbox);

      expect(mockSetEnabledSections).toHaveBeenCalledWith(['hero', 'welcome', 'services']);
    });

    it('should remove section when unchecking checked box', () => {
      render(
        <SectionsTab
          enabledSections={['hero', 'welcome', 'projects']}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const projectsCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Featured Projects');
      });

      fireEvent.click(projectsCheckbox);

      expect(mockSetEnabledSections).toHaveBeenCalledWith(['hero', 'welcome']);
    });

    it('should not toggle required sections', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const heroCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Hero Section');
      });

      fireEvent.click(heroCheckbox);

      expect(mockSetEnabledSections).not.toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should call onSave when form is submitted', () => {
      render(
        <SectionsTab
          enabledSections={DEFAULT_ENABLED_SECTIONS}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      fireEvent.submit(screen.getByRole('button', { name: /save sections/i }).closest('form'));

      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Default values', () => {
    it('should use default sections when enabledSections is undefined', () => {
      render(
        <SectionsTab
          enabledSections={undefined}
          setEnabledSections={mockSetEnabledSections}
          saving={false}
          onSave={mockOnSave}
        />
      );

      // Should render without errors
      expect(screen.getByText('Home Page Sections')).toBeInTheDocument();
    });
  });
});

