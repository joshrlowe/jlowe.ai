/**
 * AboutHero.test.jsx
 *
 * Comprehensive tests for AboutHero component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AboutHero from '@/components/About/AboutHero/AboutHero';

expect.extend(toHaveNoViolations);

describe('AboutHero Component', () => {
  const mockContactData = {
    emailAddress: 'josh@jlowe.ai',
    socialMediaLinks: {
      linkedIn: 'https://linkedin.com/in/joshlowe',
      github: 'https://github.com/joshlowe',
    },
  };

  const mockProps = {
    name: 'Josh Lowe',
    briefBio: 'AI/ML Engineer building production-grade systems.',
    contactData: mockContactData,
    professionalSummary: 'Professional summary text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AboutHero {...mockProps} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render name from props', () => {
      render(<AboutHero {...mockProps} />);
      expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
    });

    it('should render default "About Me" when no name', () => {
      render(<AboutHero {...mockProps} name={null} />);
      expect(screen.getByText('About Me')).toBeInTheDocument();
    });

    it('should render briefBio when provided', () => {
      render(<AboutHero {...mockProps} />);
      expect(
        screen.getByText(/AI\/ML Engineer building production-grade systems/)
      ).toBeInTheDocument();
    });

    it('should not render bio section when briefBio is null', () => {
      render(<AboutHero {...mockProps} briefBio={null} />);
      expect(
        screen.queryByText(/AI\/ML Engineer building production-grade systems/)
      ).not.toBeInTheDocument();
    });

    it('should not render bio section when briefBio is undefined', () => {
      render(<AboutHero {...mockProps} briefBio={undefined} />);
      expect(
        screen.queryByText(/AI\/ML Engineer building production-grade systems/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Social Links', () => {
    it('should render LinkedIn link', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInLink = screen.getByLabelText('LinkedIn');
      expect(linkedInLink).toBeInTheDocument();
      expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/joshlowe');
    });

    it('should render GitHub link', () => {
      render(<AboutHero {...mockProps} />);
      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', 'https://github.com/joshlowe');
    });

    it('should render Email link', () => {
      render(<AboutHero {...mockProps} />);
      const emailLink = screen.getByLabelText('Email');
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:josh@jlowe.ai');
    });

    it('should have target="_blank" on LinkedIn', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInLink = screen.getByLabelText('LinkedIn');
      expect(linkedInLink).toHaveAttribute('target', '_blank');
    });

    it('should have rel="noopener noreferrer" on LinkedIn', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInLink = screen.getByLabelText('LinkedIn');
      expect(linkedInLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have target="_blank" on GitHub', () => {
      render(<AboutHero {...mockProps} />);
      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveAttribute('target', '_blank');
    });

    it('should have rel="noopener noreferrer" on GitHub', () => {
      render(<AboutHero {...mockProps} />);
      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not have target on email link', () => {
      render(<AboutHero {...mockProps} />);
      const emailLink = screen.getByLabelText('Email');
      expect(emailLink).not.toHaveAttribute('target');
    });

    it('should not render social links when contactData is null', () => {
      render(<AboutHero {...mockProps} contactData={null} />);
      expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('GitHub')).not.toBeInTheDocument();
    });

    it('should not render LinkedIn when missing', () => {
      const dataWithoutLinkedIn = {
        ...mockContactData,
        socialMediaLinks: { ...mockContactData.socialMediaLinks, linkedIn: null },
      };
      render(<AboutHero {...mockProps} contactData={dataWithoutLinkedIn} />);
      expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
    });

    it('should not render GitHub when missing', () => {
      const dataWithoutGitHub = {
        ...mockContactData,
        socialMediaLinks: { ...mockContactData.socialMediaLinks, github: null },
      };
      render(<AboutHero {...mockProps} contactData={dataWithoutGitHub} />);
      expect(screen.queryByLabelText('GitHub')).not.toBeInTheDocument();
    });

    it('should not render Email when missing', () => {
      const dataWithoutEmail = {
        ...mockContactData,
        emailAddress: null,
      };
      render(<AboutHero {...mockProps} contactData={dataWithoutEmail} />);
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    });
  });

  describe('Social Link Images', () => {
    it('should render LinkedIn logo', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInImage = screen.getByAltText('LinkedIn');
      expect(linkedInImage).toBeInTheDocument();
      expect(linkedInImage).toHaveAttribute('src', '/images/linkedin-logo.png');
    });

    it('should render GitHub logo', () => {
      render(<AboutHero {...mockProps} />);
      const githubImage = screen.getByAltText('GitHub');
      expect(githubImage).toBeInTheDocument();
      expect(githubImage).toHaveAttribute('src', '/images/github-logo.png');
    });

    it('should render Email logo', () => {
      render(<AboutHero {...mockProps} />);
      const emailImage = screen.getByAltText('Email');
      expect(emailImage).toBeInTheDocument();
      expect(emailImage).toHaveAttribute('src', '/images/email-logo.png');
    });

    it('should have proper image styling', () => {
      render(<AboutHero {...mockProps} />);
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveClass('w-5', 'h-5', 'object-contain');
      });
    });
  });

  describe('Hover Effects', () => {
    it('should handle mouseEnter on LinkedIn link', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInLink = screen.getByLabelText('LinkedIn');
      
      expect(() => fireEvent.mouseEnter(linkedInLink)).not.toThrow();
    });

    it('should handle mouseLeave on LinkedIn link', () => {
      render(<AboutHero {...mockProps} />);
      const linkedInLink = screen.getByLabelText('LinkedIn');
      
      fireEvent.mouseEnter(linkedInLink);
      expect(() => fireEvent.mouseLeave(linkedInLink)).not.toThrow();
    });

    it('should handle mouseEnter on GitHub link', () => {
      render(<AboutHero {...mockProps} />);
      const githubLink = screen.getByLabelText('GitHub');
      
      expect(() => fireEvent.mouseEnter(githubLink)).not.toThrow();
    });

    it('should handle mouseLeave on GitHub link', () => {
      render(<AboutHero {...mockProps} />);
      const githubLink = screen.getByLabelText('GitHub');
      
      fireEvent.mouseEnter(githubLink);
      expect(() => fireEvent.mouseLeave(githubLink)).not.toThrow();
    });

    it('should handle mouseEnter on Email link', () => {
      render(<AboutHero {...mockProps} />);
      const emailLink = screen.getByLabelText('Email');
      
      expect(() => fireEvent.mouseEnter(emailLink)).not.toThrow();
    });

    it('should handle mouseLeave on Email link', () => {
      render(<AboutHero {...mockProps} />);
      const emailLink = screen.getByLabelText('Email');
      
      fireEvent.mouseEnter(emailLink);
      expect(() => fireEvent.mouseLeave(emailLink)).not.toThrow();
    });
  });

  describe('Layout and Structure', () => {
    it('should render in centered container', () => {
      const { container } = render(<AboutHero {...mockProps} />);
      expect(container.querySelector('.text-center')).toBeInTheDocument();
    });

    it('should apply padding classes', () => {
      const { container } = render(<AboutHero {...mockProps} />);
      expect(container.querySelector('.py-12')).toBeInTheDocument();
    });

    it('should render social links in flex container', () => {
      const { container } = render(<AboutHero {...mockProps} />);
      expect(container.querySelector('.flex.justify-center.gap-4')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AboutHero {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have h1 for name/title', () => {
      render(<AboutHero {...mockProps} />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Josh Lowe');
    });

    it('should have aria-label on social links', () => {
      render(<AboutHero {...mockProps} />);
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should have alt text on all images', () => {
      render(<AboutHero {...mockProps} />);
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Styling', () => {
    it('should apply ember color to name', () => {
      render(<AboutHero {...mockProps} />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveStyle({ color: 'var(--color-primary)' });
    });

    it('should apply text size classes to name', () => {
      render(<AboutHero {...mockProps} />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    });

    it('should apply max width to bio', () => {
      const { container } = render(<AboutHero {...mockProps} />);
      const bio = container.querySelector('p');
      expect(bio).toHaveStyle({ maxWidth: '80%' });
    });

    it('should apply rounded styling to social links', () => {
      render(<AboutHero {...mockProps} />);
      const socialLinks = screen.getAllByRole('link');
      socialLinks.forEach(link => {
        expect(link).toHaveClass('rounded-full');
      });
    });

    it('should apply size classes to social link containers', () => {
      render(<AboutHero {...mockProps} />);
      const socialLinks = screen.getAllByRole('link');
      socialLinks.forEach(link => {
        expect(link).toHaveClass('w-12', 'h-12');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name', () => {
      render(<AboutHero {...mockProps} name="" />);
      expect(screen.getByText('About Me')).toBeInTheDocument();
    });

    it('should handle very long name', () => {
      const longName = 'A'.repeat(100);
      render(<AboutHero {...mockProps} name={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long bio', () => {
      const longBio = 'A'.repeat(500);
      render(<AboutHero {...mockProps} briefBio={longBio} />);
      expect(screen.getByText(longBio)).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      render(<AboutHero {...mockProps} name="O'Brien & Smith, Jr." />);
      expect(screen.getByText("O'Brien & Smith, Jr.")).toBeInTheDocument();
    });

    it('should handle HTML in bio (should render as text)', () => {
      render(<AboutHero {...mockProps} briefBio="<script>alert('xss')</script>" />);
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });

    it('should handle empty socialMediaLinks object', () => {
      const dataWithEmptyLinks = {
        ...mockContactData,
        socialMediaLinks: {},
      };
      render(<AboutHero {...mockProps} contactData={dataWithEmptyLinks} />);
      expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
    });

    it('should handle null socialMediaLinks', () => {
      const dataWithNullLinks = {
        ...mockContactData,
        socialMediaLinks: null,
      };
      render(<AboutHero {...mockProps} contactData={dataWithNullLinks} />);
      expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
    });

    it('should handle undefined contactData', () => {
      render(<AboutHero {...mockProps} contactData={undefined} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle all props missing', () => {
      render(<AboutHero />);
      expect(screen.getByText('About Me')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive text sizes', () => {
      render(<AboutHero {...mockProps} />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    });

    it('should apply responsive text sizes to bio', () => {
      const { container } = render(<AboutHero {...mockProps} />);
      const bio = container.querySelector('p');
      expect(bio).toHaveClass('text-lg', 'sm:text-xl');
    });
  });

  describe('professionalSummary Prop', () => {
    it('should accept professionalSummary prop', () => {
      render(<AboutHero {...mockProps} />);
      // professionalSummary is passed but may not be rendered in AboutHero
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle null professionalSummary', () => {
      render(<AboutHero {...mockProps} professionalSummary={null} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});

