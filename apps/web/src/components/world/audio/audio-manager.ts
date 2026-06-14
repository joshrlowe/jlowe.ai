import { engineParamsForRpm } from "./engine-curve";

/**
 * Procedural chapter audio — zero asset bytes, nothing to license or fetch.
 *
 * - **Engine**: three detuned sawtooth oscillators → low-pass → gain. The
 *   fundamental, cutoff, and gain ramp toward `engineParamsForRpm(rpm)` every
 *   frame, so the engine note tracks the car's revs.
 * - **Ambient**: a generated brown-noise buffer looped through a gentle
 *   low-pass — a wind/sea bed under the engine.
 *
 * The graph is built lazily on the first unmute (a user gesture), satisfying
 * the autoplay policy; `setRpm` is a no-op until then and while muted. Muted by
 * default — audio only ever starts when the listener asks for it.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private readonly oscillators: OscillatorNode[] = [];
  private muted = true;

  get isMuted(): boolean {
    return this.muted;
  }

  /** Toggle audio. First call builds the graph + resumes the context. */
  async toggleMute(): Promise<boolean> {
    await this.ensureGraph();
    this.muted = !this.muted;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 1,
        this.ctx.currentTime,
        0.05,
      );
    }
    return this.muted;
  }

  /** Ramp the engine toward the rpm target. No-op until unmuted. */
  setRpm(rpm: number): void {
    if (!this.ctx || this.muted) return;
    const { frequency, cutoff, gain } = engineParamsForRpm(rpm);
    const now = this.ctx.currentTime;
    for (const osc of this.oscillators) {
      osc.frequency.setTargetAtTime(frequency, now, 0.06);
    }
    this.engineFilter?.frequency.setTargetAtTime(cutoff, now, 0.08);
    this.engineGain?.gain.setTargetAtTime(gain, now, 0.1);
  }

  dispose(): void {
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch {
        // already stopped — fine.
      }
    }
    this.oscillators.length = 0;
    void this.ctx?.close();
    this.ctx = null;
  }

  private async ensureGraph(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0; // muted until toggled on
    master.connect(ctx.destination);
    this.master = master;

    // Engine bus.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    const eGain = ctx.createGain();
    const idle = engineParamsForRpm(0);
    filter.frequency.value = idle.cutoff;
    eGain.gain.value = idle.gain;
    filter.connect(eGain);
    eGain.connect(master);
    for (const detune of [-8, 0, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = idle.frequency;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
      this.oscillators.push(osc);
    }
    this.engineFilter = filter;
    this.engineGain = eGain;

    // Ambient brown-noise bed.
    const ambient = ctx.createBufferSource();
    ambient.buffer = brownNoise(ctx, 2);
    ambient.loop = true;
    const aFilter = ctx.createBiquadFilter();
    aFilter.type = "lowpass";
    aFilter.frequency.value = 720;
    const aGain = ctx.createGain();
    aGain.gain.value = 0.16;
    ambient.connect(aFilter);
    aFilter.connect(aGain);
    aGain.connect(master);
    ambient.start();

    await ctx.resume();
  }
}

/** A short mono brown-noise buffer — integrated white noise, normalized. */
function brownNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}
