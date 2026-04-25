/* App root + tweaks */
const { useState: useSA, useEffect: useEA } = React;

function TweaksRoot() {
  const defaults = /*EDITMODE-BEGIN*/{
    "accent": "cyan",
    "font": "inter",
    "eventEnabled": true
  }/*EDITMODE-END*/;
  const [tw, setTw] = window.useTweaks ? window.useTweaks(defaults) : [defaults, () => {}];

  useEA(() => {
    window.__SN_TWEAKS = window.__SN_TWEAKS || {};
    window.__SN_TWEAKS.disableEvent = !tw.eventEnabled;

    const root = document.documentElement;
    const accents = {
      cyan:    { a: 'oklch(0.85 0.15 210)', hi: 'oklch(0.92 0.10 205)', deep: 'oklch(0.62 0.17 235)' },
      blue:    { a: 'oklch(0.65 0.20 255)', hi: 'oklch(0.78 0.15 245)', deep: 'oklch(0.50 0.18 260)' },
      ice:     { a: 'oklch(0.92 0.08 210)', hi: 'oklch(0.97 0.04 220)', deep: 'oklch(0.75 0.12 215)' },
    };
    const a = accents[tw.accent] || accents.cyan;
    root.style.setProperty('--accent-cyan', a.a);
    root.style.setProperty('--accent-cyan-hi', a.hi);
    root.style.setProperty('--accent-blue', a.deep);

    const fonts = {
      inter: '"Inter", system-ui, sans-serif',
      grotesk: '"Space Grotesk", "Inter", system-ui, sans-serif',
    };
    root.style.setProperty('--font-sans', fonts[tw.font] || fonts.inter);
    root.style.setProperty('--font-display', tw.font === 'grotesk' ? '"Space Grotesk", "Inter Tight", sans-serif' : '"Inter Tight", "Inter", sans-serif');
  }, [tw.accent, tw.font, tw.eventEnabled]);

  if (!window.TweaksPanel) return null;
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakButton } = window;

  const replaySupernova = () => {
    window.__SN_TWEAKS.replay = (window.__SN_TWEAKS.replay || 0) + 1;
  };

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Supernova">
        <TweakToggle label="Play event on load" value={tw.eventEnabled} onChange={(v) => setTw({ eventEnabled: v })} />
        <TweakButton label="Replay supernova" onClick={replaySupernova} />
      </TweakSection>
      <TweakSection title="Palette">
        <TweakRadio label="Accent" value={tw.accent} options={[
          { value: 'cyan', label: 'Cyan' },
          { value: 'blue', label: 'Electric Blue' },
          { value: 'ice',  label: 'Ice' },
        ]} onChange={(v) => setTw({ accent: v })} />
      </TweakSection>
      <TweakSection title="Typography">
        <TweakRadio label="Typeface" value={tw.font} options={[
          { value: 'inter', label: 'Inter Tight' },
          { value: 'grotesk', label: 'Space Grotesk' },
        ]} onChange={(v) => setTw({ font: v })} />
      </TweakSection>
    </TweaksPanel>
  );
}

function App() {
  window.useReveal();
  return (
    <React.Fragment>
      <window.Header />
      <main style={{ position: 'relative' }}>
        <window.Hero />
        <window.About />
        <window.Projects />
        <window.Articles />
        <window.Contact />
      </main>
      <window.Footer />
      <TweaksRoot />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(<App />);
