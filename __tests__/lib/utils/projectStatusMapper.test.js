/**
 * Tests for lib/utils/projectStatusMapper.js
 *
 * Tests project status mapping between MongoDB and Prisma formats
 */

import { mapProjectStatus } from '../../../lib/utils/projectStatusMapper.js';

describe('projectStatusMapper', () => {
  describe('mapProjectStatus', () => {
    describe('Valid status mappings', () => {
      it('should map "Planned" to "Planned"', () => {
        expect(mapProjectStatus('Planned')).toBe('Planned');
      });

      it('should map "In Progress" to "InProgress"', () => {
        expect(mapProjectStatus('In Progress')).toBe('InProgress');
      });

      it('should map "In Development" to "InDevelopment"', () => {
        expect(mapProjectStatus('In Development')).toBe('InDevelopment');
      });

      it('should map "In Testing" to "InTesting"', () => {
        expect(mapProjectStatus('In Testing')).toBe('InTesting');
      });

      it('should map "Completed" to "Completed"', () => {
        expect(mapProjectStatus('Completed')).toBe('Completed');
      });

      it('should map "In Production" to "InProduction"', () => {
        expect(mapProjectStatus('In Production')).toBe('InProduction');
      });

      it('should map "Maintenance" to "Maintenance"', () => {
        expect(mapProjectStatus('Maintenance')).toBe('Maintenance');
      });

      it('should map "On Hold" to "OnHold"', () => {
        expect(mapProjectStatus('On Hold')).toBe('OnHold');
      });

      it('should map "Deprecated" to "Deprecated"', () => {
        expect(mapProjectStatus('Deprecated')).toBe('Deprecated');
      });

      it('should map "Sunsetted" to "Sunsetted"', () => {
        expect(mapProjectStatus('Sunsetted')).toBe('Sunsetted');
      });
    });

    describe('Edge cases', () => {
      it('should return null for null input', () => {
        expect(mapProjectStatus(null)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(mapProjectStatus(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(mapProjectStatus('')).toBeNull();
      });

      it('should return null for unknown status', () => {
        expect(mapProjectStatus('Unknown')).toBeNull();
      });

      it('should return null for invalid status', () => {
        expect(mapProjectStatus('Invalid Status')).toBeNull();
      });

      it('should be case sensitive', () => {
        expect(mapProjectStatus('planned')).toBeNull();
        expect(mapProjectStatus('PLANNED')).toBeNull();
        expect(mapProjectStatus('in progress')).toBeNull();
      });

      it('should handle whitespace-only string', () => {
        expect(mapProjectStatus('   ')).toBeNull();
      });
    });
  });
});

