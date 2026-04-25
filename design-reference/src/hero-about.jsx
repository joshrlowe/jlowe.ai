/* Hero + About — editorial modern, supernova-gradient display type */

function Hero() {
  const data = window.__APP_DATA;

  return (
    <section id="home" data-screen-label="01 Home" style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      padding: '160px 0 100px',
    }}>
      <div className="container" style={{ width: '100%' }}>
        <div style={{ maxWidth: 1100 }}>
          {/* Availability chip */}
          <div className="reveal" style={{ marginBottom: 44 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '9px 16px 9px 14px',
              border: '1px solid var(--rule-mid)',
              borderRadius: 999,
              fontSize: 13, color: 'var(--ink-80)',
              background: 'rgba(10,10,14,0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}>
              <span className="live-dot" />
              <span style={{ color: 'var(--ink-60)' }}>Currently</span>
              <span style={{ color: 'var(--ink-100)' }}>{data.owner.focus}</span>
            </span>
          </div>

          {/* Massive serif display — "Building What's Next." but editorial + supernova-lit */}
          <h1 className="reveal display" style={{
            fontSize: 'clamp(64px, 11vw, 176px)',
            margin: 0,
            marginBottom: 36,
            lineHeight: 0.92,
          }}>
            <span style={{ color: 'var(--ink-100)' }}>Building</span>{' '}
            <em style={{ color: 'var(--ink-80)' }}>what's</em><br />
            <span className="sn-gradient">next</span>
            <span style={{ color: 'var(--ink-100)' }}>.</span>
          </h1>

          {/* Subrole — serif italic lead-in + role */}
          <div className="reveal" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(18px, 1.5vw, 22px)',
            color: 'var(--ink-70)',
            lineHeight: 1.5,
            marginBottom: 52,
            maxWidth: 720,
            textWrap: 'pretty',
            fontWeight: 400,
          }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-90)', fontSize: '1.1em' }}>
              MSCS student
            </span>
            {' '}at UCF, researching privacy-preserving ML at the{' '}
            <span style={{ color: 'var(--ink-100)' }}>AI MIND Lab</span>.
            Building production intelligence for teams who need results, not prototypes.
          </div>

          {/* CTAs */}
          <div className="reveal" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 72 }}>
            <a href="#contact" className="btn btn-primary">
              Let's talk
              <span style={{ fontSize: 14 }}>→</span>
            </a>
            <a href="#projects" className="btn btn-ghost">See the work</a>
          </div>

          {/* Specialty row — not a wall of chips */}
          <div className="reveal" style={{
            display: 'flex', alignItems: 'center', gap: 20,
            paddingTop: 28, borderTop: '1px solid var(--rule)',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--ink-50)',
            }}>Specialties</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {data.techBadges.map((t, i) => (
                <React.Fragment key={t}>
                  <span style={{ fontSize: 14, color: 'var(--ink-80)' }}>{t}</span>
                  {i < data.techBadges.length - 1 && (
                    <span style={{ color: 'var(--ink-30)' }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gentle scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 36, right: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        opacity: 0.55,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--ink-60)', letterSpacing: '0.2em', textTransform: 'uppercase',
          writingMode: 'vertical-rl',
        }}>Scroll</span>
        <span style={{
          width: 1, height: 44,
          background: 'linear-gradient(to bottom, var(--ink-50), transparent)',
        }} />
      </div>
    </section>
  );
}

/* About — editorial two-column with numbered section headers */
function About() {
  const data = window.__APP_DATA;
  return (
    <section id="about" data-screen-label="02 About" className="section">
      <div className="container">
        <SectionHeader num="01" eyebrow="About" title={<>A brief <em className="italic">introduction</em>.</>} sub={data.owner.tagline} />

        {/* Professional Summary — large quote-like copy */}
        <div style={{ marginTop: 96 }}>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }} data-aboutgrid>
            <div>
              <div className="label-mono">Professional Summary</div>
            </div>
            <p className="display" style={{
              fontSize: 'clamp(22px, 2.2vw, 32px)',
              lineHeight: 1.35, color: 'var(--ink-90)',
              margin: 0, maxWidth: 860,
              fontWeight: 400, letterSpacing: '-0.015em',
              textWrap: 'pretty',
            }}>
              {data.owner.summary}
            </p>
          </div>
        </div>

        {/* Experience — timeline-ish rows, serif headings */}
        <div style={{ marginTop: 120 }}>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, marginBottom: 8 }} data-aboutgrid>
            <div className="label-mono">Professional Experience</div>
            <div />
          </div>
          <div className="reveal">
            {data.experience.map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '240px 1fr',
                gap: 48, padding: '36px 0',
                borderTop: '1px solid var(--rule)',
                borderBottom: i === data.experience.length - 1 ? '1px solid var(--rule)' : 'none',
              }} data-aboutgrid>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-50)', letterSpacing: '0.04em' }}>{e.years}</div>
                <div>
                  <div className="display" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: 'var(--ink-100)', marginBottom: 6, fontWeight: 400 }}>
                    {e.role}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    fontSize: 18, color: 'var(--sn-pink)', marginBottom: 18,
                  }}>{e.org}</div>
                  <p style={{ fontSize: 16.5, color: 'var(--ink-70)', lineHeight: 1.65, margin: 0, maxWidth: 860, textWrap: 'pretty' }}>
                    {e.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education — softened cards */}
        <div style={{ marginTop: 120 }}>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, marginBottom: 28 }} data-aboutgrid>
            <div className="label-mono">Education</div>
            <div />
          </div>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} data-edugrid>
            {data.education.map((e, i) => (
              <div key={i} className="card" style={{ padding: 32, position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-60)', marginBottom: 14, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{e.years}</div>
                <h4 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 8, lineHeight: 1.2, fontWeight: 400, color: 'var(--ink-100)' }}>
                  {e.degree}
                </h4>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  fontSize: 15, color: 'var(--sn-pink)', marginBottom: 22,
                }}>{e.school}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-50)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Coursework</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {e.coursework.slice(0, 6).map((c) => (
                    <span key={c} style={{ fontSize: 12, color: 'var(--ink-80)', padding: '4px 10px', border: '1px solid var(--rule)', borderRadius: 999 }}>{c}</span>
                  ))}
                  {e.coursework.length > 6 && <span style={{ fontSize: 12, color: 'var(--ink-50)', padding: '4px 8px' }}>+{e.coursework.length - 6}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div style={{ marginTop: 96 }}>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, marginBottom: 24 }} data-aboutgrid>
            <div className="label-mono">Certifications</div>
            <div />
          </div>
          <div className="reveal" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {data.certifications.map((c) => (
              <div key={c.name} className="card" style={{
                padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
                borderRadius: 999,
              }}>
                <div style={{
                  width: 36, height: 36,
                  display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg, var(--sn-magenta), var(--sn-violet))',
                  color: 'var(--ink-100)',
                  fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 18,
                  borderRadius: '50%',
                  boxShadow: 'var(--glow-violet)',
                }}>{c.issuer[0]}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-100)', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-60)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{c.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hobbies */}
        <div style={{ marginTop: 96 }}>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, marginBottom: 20 }} data-aboutgrid>
            <div className="label-mono">Hobbies &amp; Interests</div>
            <div />
          </div>
          <div className="reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {data.hobbies.map((h) => (
              <span key={h} style={{
                fontSize: 15, padding: '10px 18px',
                border: '1px solid var(--rule)', borderRadius: 999,
                color: 'var(--ink-80)', background: 'rgba(255,255,255,0.015)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              }}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          [data-aboutgrid] { grid-template-columns: 1fr !important; gap: 16px !important; }
          [data-edugrid] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1100px) {
          [data-edugrid] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}

function SectionHeader({ num, eyebrow, title, sub }) {
  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 28 }}>
        {num && <span className="num">{num}</span>}
        <span className="bar" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="display" style={{
        fontSize: 'clamp(48px, 6.2vw, 104px)',
        margin: 0, marginBottom: sub ? 22 : 0,
        lineHeight: 0.98,
      }}>{title}</h2>
      {sub && (
        <p style={{
          fontSize: 'clamp(17px, 1.4vw, 20px)',
          lineHeight: 1.55, color: 'var(--ink-70)', margin: 0,
          maxWidth: 680, textWrap: 'pretty',
        }}>{sub}</p>
      )}
    </div>
  );
}

Object.assign(window, { Hero, About, SectionHeader });
