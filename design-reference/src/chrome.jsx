/* Header + reveal-on-scroll */
const { useState, useEffect, useRef } = React;

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY || 0);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return y;
}

function useReveal() {
  useEffect(() => {
    let io;
    const setup = () => {
      if (!io) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
      }
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    };
    const timers = [0, 50, 200, 600, 1500].map((t) => setTimeout(setup, t));
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 2000);
    return () => { if (io) io.disconnect(); timers.forEach(clearTimeout); clearTimeout(fallback); };
  }, []);
}

function Header() {
  const y = useScrollY();
  const scrolled = y > 40;
  const [hash, setHash] = useState('#home');
  useEffect(() => {
    const onHash = () => setHash(location.hash || '#home');
    onHash();
    window.addEventListener('hashchange', onHash);
    const ids = ['home','about','projects','articles','contact'];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setHash('#' + e.target.id);
      });
    }, { threshold: 0.35 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => { window.removeEventListener('hashchange', onHash); io.disconnect(); };
  }, []);

  const links = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#projects', label: 'Work' },
    { href: '#articles', label: 'Writing' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: scrolled ? '14px 0' : '24px 0',
      transition: 'all 0.4s var(--ease-out-expo)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        {/* Brand mark */}
        <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, position: 'relative',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #DBEAFE 22%, #22D3EE 48%, #3B82F6 80%, #0a1428 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.18), 0 0 24px oklch(0.65 0.20 255 / 0.5)',
          }} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: 19, letterSpacing: '-0.01em', color: 'var(--ink-100)',
            }}>Josh Lowe</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-60)',
              marginTop: 3, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>AI / ML Engineer</div>
          </div>
        </a>

        {/* Centered pill nav */}
        <nav className="desktop-only" style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '5px 6px',
          borderRadius: 999,
          background: scrolled ? 'rgba(10,10,14,0.7)' : 'rgba(10,10,14,0.4)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          border: '1px solid var(--rule-mid)',
          boxShadow: '0 10px 40px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {links.map((l) => {
            const active = hash === l.href;
            return (
              <a key={l.href} href={l.href} style={{
                position: 'relative',
                padding: '9px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                color: active ? 'var(--ink-100)' : 'var(--ink-70)',
                fontWeight: 500,
                borderRadius: 999,
                transition: 'color 0.3s, background 0.3s',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}>
                {l.label}
              </a>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-only">
          <a href="#contact" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 13 }}>
            Get in touch
            <span style={{ fontSize: 13 }}>→</span>
          </a>
        </div>
      </div>
      <style>{`
        @media (max-width: 920px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </header>
  );
}

Object.assign(window, { Header, useReveal, useScrollY });
