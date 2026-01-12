/**
 * Mock: @react-three/drei
 * 
 * Mocks React Three Drei helper components and hooks.
 * All components render null or minimal elements to prevent WebGL errors.
 * 
 * Drei provides many utility components for Three.js - we mock the commonly used ones.
 */

import React from 'react';

// ============================================================================
// CAMERA CONTROLS
// ============================================================================

export const OrbitControls = React.forwardRef((props, ref) => null);
OrbitControls.displayName = 'MockOrbitControls';

export const FlyControls = React.forwardRef((props, ref) => null);
FlyControls.displayName = 'MockFlyControls';

export const MapControls = React.forwardRef((props, ref) => null);
MapControls.displayName = 'MockMapControls';

export const TrackballControls = React.forwardRef((props, ref) => null);
TrackballControls.displayName = 'MockTrackballControls';

// ============================================================================
// LOADERS
// ============================================================================

export const useGLTF = jest.fn(() => ({
    scene: { children: [] },
    nodes: {},
    materials: {},
    animations: [],
}));
useGLTF.preload = jest.fn();

export const useTexture = jest.fn(() => ({}));
useTexture.preload = jest.fn();

export const useFBX = jest.fn(() => ({ children: [] }));

export const useFont = jest.fn(() => ({}));

// ============================================================================
// ABSTRACTIONS
// ============================================================================

export const Html = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="drei-html" {...props}>
        {children}
    </div>
));
Html.displayName = 'MockHtml';

export const Text = React.forwardRef(({ children, ...props }, ref) => (
    <mesh ref={ref} data-testid="drei-text">
        {children}
    </mesh>
));
Text.displayName = 'MockText';

export const Text3D = React.forwardRef(({ children, ...props }, ref) => null);
Text3D.displayName = 'MockText3D';

export const Billboard = React.forwardRef(({ children, ...props }, ref) => (
    <group ref={ref}>{children}</group>
));
Billboard.displayName = 'MockBillboard';

export const ScreenQuad = React.forwardRef((props, ref) => null);
ScreenQuad.displayName = 'MockScreenQuad';

// ============================================================================
// STAGING / ENVIRONMENT
// ============================================================================

export const Environment = React.forwardRef((props, ref) => null);
Environment.displayName = 'MockEnvironment';

export const Sky = React.forwardRef((props, ref) => null);
Sky.displayName = 'MockSky';

export const Stars = React.forwardRef((props, ref) => null);
Stars.displayName = 'MockStars';

export const Cloud = React.forwardRef((props, ref) => null);
Cloud.displayName = 'MockCloud';

export const Clouds = React.forwardRef(({ children, ...props }, ref) => children || null);
Clouds.displayName = 'MockClouds';

export const Stage = React.forwardRef(({ children, ...props }, ref) => (
    <group ref={ref}>{children}</group>
));
Stage.displayName = 'MockStage';

export const ContactShadows = React.forwardRef((props, ref) => null);
ContactShadows.displayName = 'MockContactShadows';

export const Sparkles = React.forwardRef((props, ref) => null);
Sparkles.displayName = 'MockSparkles';

// ============================================================================
// HELPERS
// ============================================================================

export const useHelper = jest.fn();

export const GizmoHelper = React.forwardRef(({ children, ...props }, ref) => null);
GizmoHelper.displayName = 'MockGizmoHelper';

export const GizmoViewport = React.forwardRef((props, ref) => null);
GizmoViewport.displayName = 'MockGizmoViewport';

export const Grid = React.forwardRef((props, ref) => null);
Grid.displayName = 'MockGrid';

// ============================================================================
// SHAPES
// ============================================================================

export const Box = React.forwardRef((props, ref) => <mesh ref={ref} />);
Box.displayName = 'MockBox';

export const Sphere = React.forwardRef((props, ref) => <mesh ref={ref} />);
Sphere.displayName = 'MockSphere';

export const Plane = React.forwardRef((props, ref) => <mesh ref={ref} />);
Plane.displayName = 'MockPlane';

export const Circle = React.forwardRef((props, ref) => <mesh ref={ref} />);
Circle.displayName = 'MockCircle';

export const Torus = React.forwardRef((props, ref) => <mesh ref={ref} />);
Torus.displayName = 'MockTorus';

export const TorusKnot = React.forwardRef((props, ref) => <mesh ref={ref} />);
TorusKnot.displayName = 'MockTorusKnot';

// ============================================================================
// PERFORMANCE
// ============================================================================

export const Preload = React.forwardRef((props, ref) => null);
Preload.displayName = 'MockPreload';

export const PerformanceMonitor = React.forwardRef(({ children, ...props }, ref) => children || null);
PerformanceMonitor.displayName = 'MockPerformanceMonitor';

export const AdaptiveDpr = React.forwardRef((props, ref) => null);
AdaptiveDpr.displayName = 'MockAdaptiveDpr';

export const AdaptiveEvents = React.forwardRef((props, ref) => null);
AdaptiveEvents.displayName = 'MockAdaptiveEvents';

// ============================================================================
// EFFECTS / POST-PROCESSING
// ============================================================================

export const EffectComposer = React.forwardRef(({ children, ...props }, ref) => children || null);
EffectComposer.displayName = 'MockEffectComposer';

export const Bloom = React.forwardRef((props, ref) => null);
Bloom.displayName = 'MockBloom';

// ============================================================================
// HOOKS
// ============================================================================

export const useScroll = jest.fn(() => ({
    offset: 0,
    fill: 0,
    range: jest.fn(() => 0),
    curve: jest.fn(() => 0),
    visible: jest.fn(() => true),
}));

export const useBounds = jest.fn(() => ({
    refresh: jest.fn(),
    clip: jest.fn(),
    fit: jest.fn(),
}));

export const useProgress = jest.fn(() => ({
    active: false,
    progress: 100,
    errors: [],
    item: '',
    loaded: 0,
    total: 0,
}));

export const useCursor = jest.fn();

export const useAspect = jest.fn(() => [1, 1, 1]);

// ============================================================================
// SCROLL CONTROLS
// ============================================================================

export const ScrollControls = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-controls">
        {children}
    </div>
));
ScrollControls.displayName = 'MockScrollControls';

export const Scroll = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref}>{children}</div>
));
Scroll.displayName = 'MockScroll';

// ============================================================================
// FLOAT ANIMATION
// ============================================================================

export const Float = React.forwardRef(({ children, ...props }, ref) => (
    <group ref={ref}>{children}</group>
));
Float.displayName = 'MockFloat';

// ============================================================================
// VIEW
// ============================================================================

export const View = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="drei-view">
        {children}
    </div>
));
View.displayName = 'MockView';

// ============================================================================
// MISC
// ============================================================================

export const Center = React.forwardRef(({ children, ...props }, ref) => (
    <group ref={ref}>{children}</group>
));
Center.displayName = 'MockCenter';

export const PerspectiveCamera = React.forwardRef((props, ref) => null);
PerspectiveCamera.displayName = 'MockPerspectiveCamera';

export const OrthographicCamera = React.forwardRef((props, ref) => null);
OrthographicCamera.displayName = 'MockOrthographicCamera';

export const CameraShake = React.forwardRef((props, ref) => null);
CameraShake.displayName = 'MockCameraShake';

// Default export
export default {
    OrbitControls,
    Html,
    Text,
    Environment,
    Stars,
    Float,
    useGLTF,
    useTexture,
    useProgress,
    useScroll,
};



