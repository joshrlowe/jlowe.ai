/**
 * Tests for animationUtils utility
 * 
 * Tests GSAP animation configuration helpers.
 */

import {
  createFadeInAnimation,
  createScrollTriggerConfig,
  safeAnimation,
} from '@/lib/utils/animationUtils';

describe('animationUtils', () => {
  describe('createFadeInAnimation', () => {
    it('should create default fade-in animation config', () => {
      const result = createFadeInAnimation();
      
      expect(result.from).toEqual({
        opacity: 0,
        y: 50,
      });
      expect(result.to).toEqual({
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0,
      });
    });

    it('should accept custom delay', () => {
      const result = createFadeInAnimation({ delay: 0.5 });
      
      expect(result.to.delay).toBe(0.5);
    });

    it('should accept custom duration', () => {
      const result = createFadeInAnimation({ duration: 1.5 });
      
      expect(result.to.duration).toBe(1.5);
    });

    it('should accept custom ease', () => {
      const result = createFadeInAnimation({ ease: 'elastic.out' });
      
      expect(result.to.ease).toBe('elastic.out');
    });

    it('should accept all custom options', () => {
      const result = createFadeInAnimation({
        delay: 0.2,
        duration: 1.0,
        ease: 'power3.inOut',
      });
      
      expect(result.to.delay).toBe(0.2);
      expect(result.to.duration).toBe(1.0);
      expect(result.to.ease).toBe('power3.inOut');
    });

    it('should preserve default values for unspecified options', () => {
      const result = createFadeInAnimation({ delay: 0.5 });
      
      expect(result.to.duration).toBe(0.8);
      expect(result.to.ease).toBe('power2.out');
    });
  });

  describe('createScrollTriggerConfig', () => {
    it('should create default scroll trigger config', () => {
      const result = createScrollTriggerConfig();
      
      expect(result).toEqual({
        start: 'top 85%',
        toggleActions: 'play none none none',
      });
    });

    it('should accept custom start position', () => {
      const result = createScrollTriggerConfig({ start: 'top 50%' });
      
      expect(result.start).toBe('top 50%');
      expect(result.toggleActions).toBe('play none none none');
    });

    it('should accept custom toggleActions', () => {
      const result = createScrollTriggerConfig({ 
        toggleActions: 'play pause resume reset' 
      });
      
      expect(result.toggleActions).toBe('play pause resume reset');
      expect(result.start).toBe('top 85%');
    });

    it('should accept all custom options', () => {
      const result = createScrollTriggerConfig({
        start: 'center center',
        toggleActions: 'restart pause reverse pause',
      });
      
      expect(result.start).toBe('center center');
      expect(result.toggleActions).toBe('restart pause reverse pause');
    });
  });

  describe('safeAnimation', () => {
    const originalWindow = global.window;
    const originalGsap = global.gsap;

    afterEach(() => {
      global.window = originalWindow;
      global.gsap = originalGsap;
    });

    it('should return a function', () => {
      const animationFn = jest.fn();
      const safeAnimationFn = safeAnimation(animationFn);
      
      expect(typeof safeAnimationFn).toBe('function');
    });

    it('should not call animation function when window is undefined', () => {
      global.window = undefined;
      
      const animationFn = jest.fn();
      const safeAnimationFn = safeAnimation(animationFn);
      
      safeAnimationFn('arg1', 'arg2');
      
      expect(animationFn).not.toHaveBeenCalled();
    });

    it('should not call animation function when gsap is undefined', () => {
      global.window = {};
      global.gsap = undefined;
      
      const animationFn = jest.fn();
      const safeAnimationFn = safeAnimation(animationFn);
      
      safeAnimationFn('arg1', 'arg2');
      
      expect(animationFn).not.toHaveBeenCalled();
    });

    it('should call animation function when window and gsap are defined', () => {
      global.window = {};
      global.gsap = {};
      
      const animationFn = jest.fn().mockReturnValue('animation-result');
      const safeAnimationFn = safeAnimation(animationFn);
      
      const result = safeAnimationFn('arg1', 'arg2');
      
      expect(animationFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('animation-result');
    });

    it('should pass through all arguments', () => {
      global.window = {};
      global.gsap = {};
      
      const animationFn = jest.fn();
      const safeAnimationFn = safeAnimation(animationFn);
      
      safeAnimationFn(1, 'test', { option: true }, [1, 2, 3]);
      
      expect(animationFn).toHaveBeenCalledWith(1, 'test', { option: true }, [1, 2, 3]);
    });
  });
});




