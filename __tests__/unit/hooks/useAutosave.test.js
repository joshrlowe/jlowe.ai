/**
 * Tests for useAutosave custom hook
 * 
 * Tests autosave functionality with debouncing.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutosave } from '@/components/admin/useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should not call onSave immediately', () => {
      const onSave = jest.fn();
      const data = { title: 'Test' };
      
      renderHook(() => useAutosave(data, onSave, 1000));
      
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should call onSave after interval', () => {
      const onSave = jest.fn();
      const data = { title: 'Test' };
      
      renderHook(() => useAutosave(data, onSave, 1000));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalledWith(data);
    });

    it('should use default interval of 30 seconds', () => {
      const onSave = jest.fn();
      const data = { title: 'Test' };
      
      renderHook(() => useAutosave(data, onSave));
      
      act(() => {
        jest.advanceTimersByTime(29000);
      });
      
      expect(onSave).not.toHaveBeenCalled();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('data change detection', () => {
    it('should not call onSave if data has not changed', () => {
      const onSave = jest.fn();
      const data = { title: 'Test' };
      
      const { rerender } = renderHook(
        ({ data, onSave, interval }) => useAutosave(data, onSave, interval),
        { initialProps: { data, onSave, interval: 1000 } }
      );
      
      // First save
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalledTimes(1);
      
      // Trigger the early return on line 16 by rerendering with same data
      // which should hit the `if (dataString === lastSavedRef.current) return` path
      rerender({ data, onSave, interval: 1000 });
      
      // Advance time - the timeout for the second render should not fire
      // because the data hasn't changed and the early return prevents scheduling
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should not call again because data hasn't changed
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should early return when data matches lastSaved', () => {
      const onSave = jest.fn();
      const data = { title: 'Same' };
      
      const { rerender } = renderHook(
        ({ data, onSave, interval }) => useAutosave(data, onSave, interval),
        { initialProps: { data, onSave, interval: 500 } }
      );
      
      // First save triggers and sets lastSavedRef
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      
      // Create a new object with the same JSON value to trigger rerender
      // but hit the early return because lastSavedRef matches
      const sameDataNewRef = { title: 'Same' };
      rerender({ data: sameDataNewRef, onSave, interval: 500 });
      
      // The early return on line 16 should prevent a new timeout from being set
      // so no additional saves should occur
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when data changes', () => {
      const onSave = jest.fn();
      const initialData = { title: 'Test' };
      const updatedData = { title: 'Updated' };
      
      const { rerender } = renderHook(
        ({ data, onSave, interval }) => useAutosave(data, onSave, interval),
        { initialProps: { data: initialData, onSave, interval: 1000 } }
      );
      
      // First save
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalledWith(initialData);
      
      // Update data
      rerender({ data: updatedData, onSave, interval: 1000 });
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalledWith(updatedData);
      expect(onSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('debouncing', () => {
    it('should reset timer on data change', () => {
      const onSave = jest.fn();
      const data1 = { title: 'First' };
      const data2 = { title: 'Second' };
      
      const { rerender } = renderHook(
        ({ data, onSave, interval }) => useAutosave(data, onSave, interval),
        { initialProps: { data: data1, onSave, interval: 1000 } }
      );
      
      // Advance halfway
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(onSave).not.toHaveBeenCalled();
      
      // Change data - should reset timer
      rerender({ data: data2, onSave, interval: 1000 });
      
      // Advance another 500ms (total 1000ms since start, but only 500ms since last change)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Should not have saved yet because timer was reset
      expect(onSave).not.toHaveBeenCalled();
      
      // Advance remaining 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Now it should save
      expect(onSave).toHaveBeenCalledWith(data2);
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const onSave = jest.fn();
      const data = { title: 'Test' };
      
      const { unmount } = renderHook(() => useAutosave(data, onSave, 1000));
      
      unmount();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null onSave callback', () => {
      const data = { title: 'Test' };
      
      // Should not throw
      expect(() => {
        renderHook(() => useAutosave(data, null, 1000));
        
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });

    it('should handle undefined onSave callback', () => {
      const data = { title: 'Test' };
      
      expect(() => {
        renderHook(() => useAutosave(data, undefined, 1000));
        
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });

    it('should handle complex data structures', () => {
      const onSave = jest.fn();
      const data = {
        title: 'Test',
        items: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };
      
      renderHook(() => useAutosave(data, onSave, 1000));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(onSave).toHaveBeenCalledWith(data);
    });
  });
});

