"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { AudioManager } from "../audio/audio-manager";
import { chapterStore } from "../state/chapter-store";

/**
 * Mute toggle + the engine-rpm driver. Audio is muted by default and only
 * starts on this button's click (a user gesture — satisfies the autoplay
 * policy). While unmuted, a rAF loop feeds the chapter store's rpm to the
 * procedural engine; the loop tears down when muted or unmounted.
 */
export function WorldAudio() {
  const [manager] = useState(() => new AudioManager());
  const [muted, setMuted] = useState(true);

  useEffect(() => () => manager.dispose(), [manager]);

  useEffect(() => {
    if (muted) return;
    let raf = 0;
    const tick = () => {
      manager.setRpm(chapterStore.getState().rpm);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [muted, manager]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => void manager.toggleMute().then(setMuted)}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      className="pointer-events-auto fixed bottom-4 left-4 z-30 bg-background/60 backdrop-blur"
    >
      {muted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}
