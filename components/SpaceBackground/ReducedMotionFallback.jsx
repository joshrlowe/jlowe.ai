/**
 * ReducedMotionFallback - Static starfield for accessibility
 *
 * Provides a CSS-based static star background for users
 * who prefer reduced motion.
 */
export default function ReducedMotionFallback() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(3px 3px at 20px 30px, #FFFFFF, transparent),
            radial-gradient(2px 2px at 40px 70px, #FFF8F0, transparent),
            radial-gradient(4px 4px at 90px 40px, #FFFDF8, transparent),
            radial-gradient(2px 2px at 160px 120px, #FFE4B5, transparent),
            radial-gradient(3px 3px at 200px 80px, #CAE8FF, transparent),
            radial-gradient(2px 2px at 280px 200px, #FFD89B, transparent),
            radial-gradient(5px 5px at 100px 150px, #FFFFFF, transparent)
          `,
          backgroundSize: "300px 300px",
        }}
      />
    </div>
  );
}

