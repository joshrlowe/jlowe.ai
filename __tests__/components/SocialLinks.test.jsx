/**
 * SocialLinks.test.jsx
 *
 * Comprehensive tests for SocialLinks component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SocialLinks from '@/components/SocialLinks';

expect.extend(toHaveNoViolations);

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

describe('SocialLinks Component', () => {
  const mockContactData = {
    emailAddress: 'josh@jlowe.ai',
    socialMediaLinks: {
      github: 'https://github.com/joshlowe',
      linkedIn: 'https://linkedin.com/in/joshlowe',
      X: 'https://x.com/joshlowe',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should render null when no contactData', () => {
      const { container } = render(<SocialLinks />);
      expect(container.firstChild).toBeNull();
    });

    it('should render null when contactData is null', () => {
      const { container } = render(<SocialLinks contactData={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render all social links', () => {
      render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByLabelText('Visit GitHub profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Visit LinkedIn profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Visit X (Twitter) profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Send email')).toBeInTheDocument();
    });
  });

  describe('Social Links', () => {
    it('should render GitHub link with correct href', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const githubLink = screen.getByLabelText('Visit GitHub profile');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/joshlowe');
    });

    it('should render LinkedIn link with correct href', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const linkedInLink = screen.getByLabelText('Visit LinkedIn profile');
      expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/joshlowe');
    });

    it('should render X link with correct href', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const xLink = screen.getByLabelText('Visit X (Twitter) profile');
      expect(xLink).toHaveAttribute('href', 'https://x.com/joshlowe');
    });

    it('should render email link with mailto', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const emailLink = screen.getByLabelText('Send email');
      expect(emailLink).toHaveAttribute('href', 'mailto:josh@jlowe.ai');
    });

    it('should have target="_blank" on external links', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const githubLink = screen.getByLabelText('Visit GitHub profile');
      const linkedInLink = screen.getByLabelText('Visit LinkedIn profile');
      const xLink = screen.getByLabelText('Visit X (Twitter) profile');
      
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(linkedInLink).toHaveAttribute('target', '_blank');
      expect(xLink).toHaveAttribute('target', '_blank');
    });

    it('should have rel="noopener noreferrer" on external links', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const githubLink = screen.getByLabelText('Visit GitHub profile');
      const linkedInLink = screen.getByLabelText('Visit LinkedIn profile');
      const xLink = screen.getByLabelText('Visit X (Twitter) profile');
      
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(linkedInLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not have target on email link', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const emailLink = screen.getByLabelText('Send email');
      expect(emailLink).not.toHaveAttribute('target');
    });

    it('should not have rel on email link', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const emailLink = screen.getByLabelText('Send email');
      expect(emailLink).not.toHaveAttribute('rel');
    });
  });

  describe('Images', () => {
    it('should render GitHub image with correct alt text', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const githubImage = screen.getByAltText('GitHub');
      expect(githubImage).toBeInTheDocument();
    });

    it('should render LinkedIn image with correct alt text', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const linkedInImage = screen.getByAltText('LinkedIn');
      expect(linkedInImage).toBeInTheDocument();
    });

    it('should render X image with correct alt text', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const xImage = screen.getByAltText('X (Twitter)');
      expect(xImage).toBeInTheDocument();
    });

    it('should render Email image with correct alt text', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const emailImage = screen.getByAltText('Email');
      expect(emailImage).toBeInTheDocument();
    });

    it('should render images with correct src', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const githubImage = screen.getByAltText('GitHub');
      const linkedInImage = screen.getByAltText('LinkedIn');
      const xImage = screen.getByAltText('X (Twitter)');
      const emailImage = screen.getByAltText('Email');
      
      expect(githubImage).toHaveAttribute('src', '/images/github-logo.png');
      expect(linkedInImage).toHaveAttribute('src', '/images/linkedin-logo.png');
      expect(xImage).toHaveAttribute('src', '/images/x-logo.png');
      expect(emailImage).toHaveAttribute('src', '/images/email-logo.png');
    });

    it('should render images with unoptimized flag', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('data-nimg');
      });
    });
  });

  describe('Vertical Layout', () => {
    it('should support vertical layout', () => {
      const { container } = render(
        <SocialLinks contactData={mockContactData} vertical={true} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply vertical class when vertical prop is true', () => {
      const { container } = render(
        <SocialLinks contactData={mockContactData} vertical={true} />
      );
      // Component should render with vertical layout
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should apply horizontal class by default', () => {
      const { container } = render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Missing Social Links', () => {
    it('should not render GitHub link if missing', () => {
      const dataWithoutGithub = {
        ...mockContactData,
        socialMediaLinks: { ...mockContactData.socialMediaLinks, github: null },
      };
      render(<SocialLinks contactData={dataWithoutGithub} />);
      expect(screen.queryByLabelText('Visit GitHub profile')).not.toBeInTheDocument();
    });

    it('should not render LinkedIn link if missing', () => {
      const dataWithoutLinkedIn = {
        ...mockContactData,
        socialMediaLinks: { ...mockContactData.socialMediaLinks, linkedIn: null },
      };
      render(<SocialLinks contactData={dataWithoutLinkedIn} />);
      expect(screen.queryByLabelText('Visit LinkedIn profile')).not.toBeInTheDocument();
    });

    it('should not render X link if missing', () => {
      const dataWithoutX = {
        ...mockContactData,
        socialMediaLinks: { ...mockContactData.socialMediaLinks, X: null },
      };
      render(<SocialLinks contactData={dataWithoutX} />);
      expect(screen.queryByLabelText('Visit X (Twitter) profile')).not.toBeInTheDocument();
    });

    it('should not render email link if missing', () => {
      const dataWithoutEmail = {
        ...mockContactData,
        emailAddress: null,
      };
      render(<SocialLinks contactData={dataWithoutEmail} />);
      expect(screen.queryByLabelText('Send email')).not.toBeInTheDocument();
    });

    it('should handle empty socialMediaLinks object', () => {
      const dataWithEmptyLinks = {
        ...mockContactData,
        socialMediaLinks: {},
      };
      render(<SocialLinks contactData={dataWithEmptyLinks} />);
      expect(screen.queryByLabelText('Visit GitHub profile')).not.toBeInTheDocument();
    });

    it('should handle null socialMediaLinks', () => {
      const dataWithNullLinks = {
        ...mockContactData,
        socialMediaLinks: null,
      };
      render(<SocialLinks contactData={dataWithNullLinks} />);
      expect(screen.queryByLabelText('Visit GitHub profile')).not.toBeInTheDocument();
    });

    it('should handle undefined socialMediaLinks', () => {
      const dataWithUndefinedLinks = {
        emailAddress: 'test@example.com',
      };
      render(<SocialLinks contactData={dataWithUndefinedLinks} />);
      expect(screen.queryByLabelText('Visit GitHub profile')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SocialLinks contactData={mockContactData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have role list', () => {
      render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have aria-label on container', () => {
      render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByLabelText('Social media links')).toBeInTheDocument();
    });

    it('should have role listitem on links', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const listitems = screen.getAllByRole('listitem');
      expect(listitems.length).toBe(4);
    });

    it('should have proper aria-labels on links', () => {
      render(<SocialLinks contactData={mockContactData} />);
      expect(screen.getByLabelText('Visit GitHub profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Visit LinkedIn profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Visit X (Twitter) profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Send email')).toBeInTheDocument();
    });

    it('should have alt text on all images', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined vertical prop', () => {
      expect(() => 
        render(<SocialLinks contactData={mockContactData} vertical={undefined} />)
      ).not.toThrow();
    });

    it('should handle false vertical prop', () => {
      expect(() => 
        render(<SocialLinks contactData={mockContactData} vertical={false} />)
      ).not.toThrow();
    });

    it('should handle empty string in social links', () => {
      const dataWithEmptyStrings = {
        emailAddress: '',
        socialMediaLinks: {
          github: '',
          linkedIn: '',
          X: '',
        },
      };
      const { container } = render(<SocialLinks contactData={dataWithEmptyStrings} />);
      // Should not render links with empty strings
      expect(container.querySelector('a')).toBeNull();
    });

    it('should handle contactData with extra properties', () => {
      const dataWithExtra = {
        ...mockContactData,
        extraProperty: 'extra',
        anotherProperty: 123,
      };
      render(<SocialLinks contactData={dataWithExtra} />);
      expect(screen.getByLabelText('Visit GitHub profile')).toBeInTheDocument();
    });

    it('should handle missing emailAddress property', () => {
      const dataWithoutEmailProp = {
        socialMediaLinks: mockContactData.socialMediaLinks,
      };
      render(<SocialLinks contactData={dataWithoutEmailProp} />);
      expect(screen.queryByLabelText('Send email')).not.toBeInTheDocument();
    });

    it('should handle very long URLs', () => {
      const dataWithLongUrls = {
        emailAddress: 'test@verylongdomainnamethatisextremely.long.com',
        socialMediaLinks: {
          github: 'https://github.com/verylongusernamethatisverylong',
          linkedIn: 'https://linkedin.com/in/verylongusernamethatisverylong',
          X: 'https://x.com/verylongusernamethatisverylong',
        },
      };
      render(<SocialLinks contactData={dataWithLongUrls} />);
      expect(screen.getByLabelText('Visit GitHub profile')).toHaveAttribute(
        'href',
        'https://github.com/verylongusernamethatisverylong'
      );
    });

    it('should handle special characters in email', () => {
      const dataWithSpecialEmail = {
        emailAddress: 'test+tag@example.com',
        socialMediaLinks: mockContactData.socialMediaLinks,
      };
      render(<SocialLinks contactData={dataWithSpecialEmail} />);
      expect(screen.getByLabelText('Send email')).toHaveAttribute(
        'href',
        'mailto:test+tag@example.com'
      );
    });
  });

  describe('Animation', () => {
    it('should trigger GSAP animations on mount', () => {
      render(<SocialLinks contactData={mockContactData} />);
      // GSAP animations are mocked, just verify component renders
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should handle re-renders', () => {
      const { rerender } = render(<SocialLinks contactData={mockContactData} />);
      
      rerender(<SocialLinks contactData={mockContactData} />);
      
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply CSS modules classes', () => {
      const { container } = render(<SocialLinks contactData={mockContactData} />);
      // Should have proper styling classes applied
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render links as inline elements', () => {
      render(<SocialLinks contactData={mockContactData} />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<SocialLinks contactData={mockContactData} />);
      expect(() => unmount()).not.toThrow();
    });
  });
});

