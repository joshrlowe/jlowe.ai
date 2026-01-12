/**
 * Tests for ToastProvider Component and useToast hook
 * 
 * Tests toast notifications with all types and the useToast hook.
 */

import React from 'react';
import { screen, renderWithoutProviders, waitFor, renderHook, act } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import ToastProvider, { useToast } from '@/components/admin/ToastProvider';

expect.extend(toHaveNoViolations);

// Mock react-toastify
jest.mock('react-toastify', () => ({
  ToastContainer: ({ className }) => (
    <div data-testid="toast-container" className={className} />
  ),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Import mocked toast for assertions
import { toast } from 'react-toastify';

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      renderWithoutProviders(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render children', () => {
      renderWithoutProviders(
        <ToastProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </ToastProvider>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should render ToastContainer', () => {
      renderWithoutProviders(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should apply adminToastContainer class to ToastContainer', () => {
      renderWithoutProviders(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('toast-container')).toHaveClass('adminToastContainer');
    });
  });

  describe('useToast hook', () => {
    // Wrapper for testing the hook
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    it('should throw error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within ToastProvider');
      
      consoleSpy.mockRestore();
    });

    it('should return showToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      expect(result.current.showToast).toBeInstanceOf(Function);
    });

    it('should call toast.success for success type', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Success message', 'success');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        'Success message',
        expect.objectContaining({
          position: 'top-right',
          autoClose: 3000,
        })
      );
    });

    it('should call toast.success by default', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Default message');
      });
      
      expect(toast.success).toHaveBeenCalled();
    });

    it('should call toast.error for error type', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Error message', 'error');
      });
      
      expect(toast.error).toHaveBeenCalledWith(
        'Error message',
        expect.objectContaining({
          position: 'top-right',
        })
      );
    });

    it('should call toast.warning for warning type', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Warning message', 'warning');
      });
      
      expect(toast.warning).toHaveBeenCalledWith(
        'Warning message',
        expect.any(Object)
      );
    });

    it('should call toast.info for info type', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Info message', 'info');
      });
      
      expect(toast.info).toHaveBeenCalledWith(
        'Info message',
        expect.any(Object)
      );
    });

  });

  describe('toast options', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    it('should use top-right position', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          position: 'top-right',
        })
      );
    });

    it('should auto close after 3 seconds', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          autoClose: 3000,
        })
      );
    });

    it('should show progress bar', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          hideProgressBar: false,
        })
      );
    });

    it('should close on click', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          closeOnClick: true,
        })
      );
    });

    it('should pause on hover', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          pauseOnHover: true,
        })
      );
    });

    it('should be draggable', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      
      act(() => {
        result.current.showToast('Test');
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          draggable: true,
        })
      );
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithoutProviders(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

