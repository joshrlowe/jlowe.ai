/**
 * Tests for dataFetching utility functions
 */

import {
  extractSocialMediaLinks,
  createSafeHref,
  handleSafeLinkClick,
} from "@/lib/utils/dataFetching";

describe("dataFetching utilities", () => {
  describe("extractSocialMediaLinks", () => {
    it("should extract social media links from contact data", () => {
      const contactData = {
        socialMediaLinks: {
          linkedIn: "https://linkedin.com/in/test",
          github: "https://github.com/test",
          X: "https://x.com/test",
        },
      };

      const result = extractSocialMediaLinks(contactData);

      expect(result.linkedIn).toBe("https://linkedin.com/in/test");
      expect(result.github).toBe("https://github.com/test");
      expect(result.X).toBe("https://x.com/test");
    });

    it("should return empty object when socialMediaLinks is missing", () => {
      const contactData = {};
      const result = extractSocialMediaLinks(contactData);

      expect(result).toEqual({});
    });

    it("should return empty object when socialMediaLinks is not an object", () => {
      const contactData = { socialMediaLinks: "invalid" };
      const result = extractSocialMediaLinks(contactData);

      expect(result).toEqual({});
    });

    it("should handle null contactData", () => {
      const result = extractSocialMediaLinks(null);

      expect(result).toEqual({});
    });
  });

  describe("createSafeHref", () => {
    it("should return url when mounted is true and url exists", () => {
      const result = createSafeHref(true, "https://example.com");

      expect(result).toBe("https://example.com");
    });

    it("should return # when mounted is false", () => {
      const result = createSafeHref(false, "https://example.com");

      expect(result).toBe("#");
    });

    it("should return # when url is missing", () => {
      const result = createSafeHref(true, null);

      expect(result).toBe("#");
    });

    it("should return # when url is empty string", () => {
      const result = createSafeHref(true, "");

      expect(result).toBe("#");
    });
  });

  describe("handleSafeLinkClick", () => {
    it("should prevent default when href is #", () => {
      const e = {
        preventDefault: jest.fn(),
      };

      handleSafeLinkClick(e, "#");

      expect(e.preventDefault).toHaveBeenCalled();
    });

    it("should not prevent default when href is not #", () => {
      const e = {
        preventDefault: jest.fn(),
      };

      handleSafeLinkClick(e, "https://example.com");

      expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it("should handle undefined href", () => {
      const e = {
        preventDefault: jest.fn(),
      };

      handleSafeLinkClick(e, undefined);

      expect(e.preventDefault).not.toHaveBeenCalled();
    });
  });
});
