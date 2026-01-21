/**
 * Mock: @react-three/fiber
 * 
 * Mocks React Three Fiber to prevent WebGL canvas errors in tests.
 * The Canvas component renders a simple div placeholder instead
 * of attempting to create a WebGL context.
 * 
 * All Three.js hooks return mock values to prevent runtime errors.
 */

import React from 'react';

/**
 * Mock Canvas component
 * Renders children in a div instead of WebGL canvas
 */
export const Canvas = React.forwardRef(({ children, ...props }, ref) => (
    <div
        ref={ref}
        data-testid="r3f-canvas"
        style={{ width: '100%', height: '100%' }}
        {...props}
    >
        {children}
    </div>
));
Canvas.displayName = 'MockCanvas';

/**
 * Mock useThree hook
 * Returns mock Three.js context values
 */
export const useThree = jest.fn(() => ({
    camera: {
        position: { x: 0, y: 0, z: 5, set: jest.fn() },
        rotation: { x: 0, y: 0, z: 0 },
        aspect: 1,
        updateProjectionMatrix: jest.fn(),
    },
    scene: {
        children: [],
        add: jest.fn(),
        remove: jest.fn(),
        background: null,
    },
    gl: {
        domElement: document.createElement('canvas'),
        setSize: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
    },
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600, factor: 1 },
    clock: { getElapsedTime: () => 0, getDelta: () => 0.016 },
    mouse: { x: 0, y: 0 },
    raycaster: { setFromCamera: jest.fn() },
    pointer: { x: 0, y: 0 },
    set: jest.fn(),
    get: jest.fn(),
    invalidate: jest.fn(),
    advance: jest.fn(),
    setSize: jest.fn(),
    setDpr: jest.fn(),
    setFrameloop: jest.fn(),
}));

/**
 * Mock useFrame hook
 * Calls the callback once immediately for testing
 */
export const useFrame = jest.fn((callback) => {
    // Optionally call the callback once for testing
    // callback({ clock: { getElapsedTime: () => 0 } }, 0.016);
});

/**
 * Mock useLoader hook
 * Returns empty object or mock data
 */
export const useLoader = jest.fn(() => ({}));

/**
 * Mock useGraph hook
 */
export const useGraph = jest.fn(() => ({
    nodes: {},
    materials: {},
}));

/**
 * Mock extend function
 * Used to add custom objects to the fiber catalogue
 */
export const extend = jest.fn();

/**
 * Mock createPortal function
 */
export const createPortal = jest.fn((children) => children);

/**
 * Mock applyProps function
 */
export const applyProps = jest.fn();

/**
 * Mock addEffect function
 */
export const addEffect = jest.fn(() => () => { });

/**
 * Mock addAfterEffect function
 */
export const addAfterEffect = jest.fn(() => () => { });

/**
 * Mock addTail function
 */
export const addTail = jest.fn(() => () => { });

/**
 * Mock invalidate function
 */
export const invalidate = jest.fn();

/**
 * Mock advance function
 */
export const advance = jest.fn();

/**
 * Mock getRootState function
 */
export const getRootState = jest.fn(() => ({}));

// Default export
export default {
    Canvas,
    useThree,
    useFrame,
    useLoader,
    useGraph,
    extend,
    createPortal,
    applyProps,
    addEffect,
    addAfterEffect,
    addTail,
    invalidate,
    advance,
    getRootState,
};




