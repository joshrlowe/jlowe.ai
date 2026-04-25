/* Projects + Articles + Contact + Footer — editorial modern */
const { useState: useStateP, useMemo: useMemoP } = React;

function Projects() {
  const data = window.__APP_DATA;
  const allTags = ['All', ...new Set(data.projects.map((p) => p.tag))];
  const [filter, setFilter] = useStateP('All');
  const list = useMemoP(() => {
    return filter === 'All' ? data.projects : data.projects.filter((p) => p.tag === filter);
  }, [filter]);
  const featured = data.projects.filter((p) => p.featured).slice(0, 4);

  return (
    <section id="projects" data-screen-label="03 Projects" className="section">
      <div className="container">
        <SectionHeader
          num="02"
          eyebrow="Projects"
          title={<>Selected <em className="italic">work</em>.</>}
          sub="AI systems, web applications, and engineering experiments — built for clients, research, and the thrill of learning."
        />

        {/* Featured grid */}
        <div className="reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 20,
          marginTop: 88,
        }} data-feat>
          {featured.map((p, i) => {
            const spans = [
              { col: 'span 7', row: 'span 2' },
              { col: 'span 5', row: 'span 1' },
              { col: 'span 5', row: 'span 1' },
              { col: 'span 12', row: 'span 1' },
            ];
            return <FeaturedCard key={p.id} p={p} big={i === 0} span={spans[i]} />;
          })}
        </div>

        {/* Archive */}
        <div style={{ marginTop: 140 }}>
          <div className="reveal" style={{
            display: 'flex', alignItems: 'end', justifyContent: 'space-between',
            marginBottom: 36, flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div className="label-mono" style={{ marginBottom: 10 }}>All projects</div>
              <div className="display" style={{ fontSize: 'clamp(32px, 3.4vw, 48px)', fontWeight: 400, color: 'var(--ink-100)' }}>
                {list.length} <em className="italic" style={{ color: 'var(--ink-70)' }}>in total</em>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allTags.map((t) => (
                <button key={t} onClick={() => setFilter(t)} className={'chip ' + (filter === t ? 'on' : '')} style={{ cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ borderTop: '1px solid var(--rule)' }}>
            {list.map((p) => <ArchiveRow key={p.id} p={p} />)}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          [data-feat] > * { grid-column: span 12 !important; grid-row: span 1 !important; }
        }
      `}</style>
    </section>
  );
}

function FeaturedCard({ p, big, span }) {
  return (
    <a href="#" className="card card-hover" style={{
      gridColumn: span.col, gridRow: span.row,
      padding: big ? 40 : 28,
      position: 'relative',
      minHeight: big ? 460 : 230,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      {big && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(circle at 78% 24%, rgba(247, 37, 133, 0.14), transparent 55%),
            radial-gradient(circle at 16% 84%, rgba(123, 44, 191, 0.16), transparent 50%)
          `,
          opacity: 0.95,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div className="label-mono">{p.tag}</div>
        <span className={'chip ' + (p.status === 'Completed' ? 'on' : '')} style={{ fontSize: 10 }}>{p.status}</span>
      </div>

      <div style={{ position: 'relative' }}>
        <h3 className="display" style={{
          fontSize: big ? 'clamp(32px, 3.8vw, 52px)' : 24,
          fontWeight: 400, color: 'var(--ink-100)',
          margin: 0, marginBottom: 14, lineHeight: 1.1,
        }}>{p.title}</h3>
        <p style={{
          fontSize: big ? 16.5 : 14,
          color: 'var(--ink-70)', margin: 0,
          lineHeight: 1.6, maxWidth: big ? 620 : '100%',
        }}>{p.short}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.tech.slice(0, big ? 4 : 3).map((t) => <span key={t} className="chip" style={{ fontSize: 10 }}>{t}</span>)}
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 15, color: 'var(--sn-pink)',
          }}>View details →</span>
        </div>
      </div>
    </a>
  );
}

function ArchiveRow({ p }) {
  return (
    <a href="#" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1.3fr) 140px 40px',
      gap: 24, alignItems: 'start',
      padding: '28px 4px',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(247, 37, 133, 0.03)'; e.currentTarget.style.paddingLeft = '24px'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '4px'; }}
    data-row
    >
      <div>
        <div className="display" style={{ fontSize: 'clamp(20px, 1.9vw, 26px)', color: 'var(--ink-100)', marginBottom: 6, fontWeight: 400 }}>{p.title}</div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-70)', lineHeight: 1.5 }}>{p.short}</div>
      </div>
      <div className="label-mono">{p.tag}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {p.tech.slice(0, 3).map((t) => <span key={t} className="chip" style={{ fontSize: 10 }}>{t}</span>)}
      </div>
      <div>
        <span className={'chip ' + (p.status === 'Completed' ? 'on' : '')} style={{ fontSize: 10 }}>{p.status}</span>
      </div>
      <div style={{
        textAlign: 'right',
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        color: 'var(--sn-pink)', fontSize: 22,
      }}>→</div>
      <style>{`
        @media (max-width: 880px) {
          [data-row] { grid-template-columns: 1fr !important; gap: 8px !important; }
          [data-row] > *:nth-child(5) { display: none; }
        }
      `}</style>
    </a>
  );
}

/* Articles */
function Articles() {
  const data = window.__APP_DATA;
  return (
    <section id="articles" data-screen-label="04 Articles" className="section">
      <div className="container">
        <SectionHeader
          num="03"
          eyebrow="Writing"
          title={<>Notes from the <em className="italic">workbench</em>.</>}
          sub="Essays and field notes — published when they hold up to a second read."
        />

        <div className="reveal" style={{ marginTop: 80, borderTop: '1px solid var(--rule)' }}>
          {data.articles.map((a, i) => (
            <a key={i} href="#" style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 140px 100px',
              gap: 28, alignItems: 'center',
              padding: '32px 4px',
              borderBottom: '1px solid var(--rule)',
              transition: 'padding 0.3s, background 0.3s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = '24px'; e.currentTarget.style.background = 'rgba(247, 37, 133, 0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = '4px'; e.currentTarget.style.background = 'transparent'; }}
            data-writing
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-60)', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{a.date}</div>
              <div className="display" style={{ fontSize: 'clamp(21px, 2vw, 28px)', color: 'var(--ink-100)', fontWeight: 400 }}>{a.title}</div>
              <div className="label-mono">{a.topic}</div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: 14, color: 'var(--sn-pink)', textAlign: 'right',
              }}>{a.read} →</div>
              <style>{`
                @media (max-width: 780px) {
                  [data-writing] { grid-template-columns: 1fr !important; gap: 8px !important; }
                }
              `}</style>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Contact */
function Contact() {
  const data = window.__APP_DATA;
  return (
    <section id="contact" data-screen-label="05 Contact" className="section">
      <div className="container">
        <div className="reveal" style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 32 }}>
            <span className="num">04</span>
            <span className="bar" />
            <span>Contact</span>
          </div>
          <h2 className="display" style={{
            fontSize: 'clamp(56px, 8vw, 132px)',
            margin: 0, lineHeight: 0.96,
          }}>
            <span style={{ color: 'var(--ink-100)' }}>Let's build</span><br />
            <em className="italic" style={{ color: 'var(--ink-80)' }}>something</em>{' '}
            <span className="sn-gradient">together.</span>
          </h2>
          <p style={{
            fontSize: 19, color: 'var(--ink-70)', lineHeight: 1.6,
            maxWidth: 580, margin: '44px auto 64px', textWrap: 'pretty',
          }}>
            Have a project in mind, or just want to trade notes on ML research?
            I read every message.
          </p>
        </div>

        <div className="reveal" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, maxWidth: 1200, margin: '0 auto',
        }} data-contact>
          {data.social.map((s) => (
            <a key={s.key} href={s.href} className="card card-hover" style={{
              padding: 28, display: 'flex', flexDirection: 'column', gap: 24,
              justifyContent: 'space-between', minHeight: 180, position: 'relative',
            }}>
              <div>
                <div className="label-mono" style={{ marginBottom: 10 }}>{s.label}</div>
                <div className="display" style={{ fontSize: 20, color: 'var(--ink-100)', fontWeight: 400, wordBreak: 'break-word', lineHeight: 1.2 }}>{s.handle}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  color: 'var(--sn-pink)', fontSize: 22,
                }}>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) { [data-contact] { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  );
}

/* Footer */
function Footer() {
  const data = window.__APP_DATA;
  return (
    <footer style={{
      position: 'relative', zIndex: 10,
      borderTop: '1px solid var(--rule)',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '64px 0 40px',
      marginTop: 80,
    }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 40, marginBottom: 56,
        }} data-footer>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #DBEAFE 22%, #22D3EE 48%, #3B82F6 80%, #0a1428 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
              }} />
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink-100)', fontWeight: 400 }}>Josh Lowe</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-60)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>AI / ML Engineer</div>
              </div>
            </div>
            <p style={{ fontSize: 15, color: 'var(--ink-70)', lineHeight: 1.6, maxWidth: 460, margin: 0 }}>
              {data.owner.shortBio}
            </p>
          </div>
          <div>
            <div className="label-mono" style={{ marginBottom: 16 }}>Navigation</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Home','About','Projects','Articles','Contact'].map((l) => (
                <li key={l}><a href={'#' + l.toLowerCase()} className="ulink" style={{ fontSize: 14, color: 'var(--ink-80)' }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label-mono" style={{ marginBottom: 16 }}>Elsewhere</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.social.map((s) => (
                <li key={s.key}><a href={s.href} className="ulink" style={{ fontSize: 14, color: 'var(--ink-80)' }}>{s.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid var(--rule)', paddingTop: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-50)', letterSpacing: '0.08em' }}>© 2026 Josh Lowe</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-60)' }}>
            Built with care in Orlando, FL.
          </span>
        </div>
      </div>
      <style>{`
        @media (max-width: 780px) { [data-footer] { grid-template-columns: 1fr !important; } [data-footer] > *:first-child { grid-column: span 1 !important; } }
      `}</style>
    </footer>
  );
}

Object.assign(window, { Projects, Articles, Contact, Footer });
