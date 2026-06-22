"use client";

import { Toaster as Sonner, toast, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { useEffect } from "react";

import { consumeTwoDNotice, TWO_D_NOTICE_EVENT } from "@/lib/two-d-notice";

// Dark-only app — no next-themes provider, so the theme is fixed.
const Toaster = ({ ...props }: ToasterProps) => {
  // Flush the 2D-fallback notice queued by the /world redirect. This wrapper's
  // effect runs AFTER the child <Sonner/> has mounted/subscribed (descendants
  // commit first), so the toast always reaches a live subscriber — closing the
  // cold-load race where sonner drops a toast published before it subscribed.
  // The window event covers warm in-app navigation (Toaster already mounted).
  useEffect(() => {
    const flush = () => {
      if (!consumeTwoDNotice()) return;
      toast("This device runs the 2D experience", {
        description: "Your browser or settings don't support the 3D world.",
        action: {
          label: "Try 3D anyway",
          onClick: () => window.location.assign("/world/?mode=webgl"),
        },
      });
    };
    flush();
    window.addEventListener(TWO_D_NOTICE_EVENT, flush);
    return () => window.removeEventListener(TWO_D_NOTICE_EVENT, flush);
  }, []);

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
