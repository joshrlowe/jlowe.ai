import { useCallback, useEffect, useState } from "react";
import type { AboutEditableShape } from "@/components/admin/about/types";

const EMPTY_ABOUT: AboutEditableShape = {
  professionalSummary: "",
  technicalSkills: [],
  professionalExperience: [],
  education: [],
  technicalCertifications: [],
  leadershipExperience: [],
  leadershipSubtitle: "",
  hobbies: [],
};

interface UseAboutFormOptions {
  /** Optional callback for surfacing user-visible error strings to the host. */
  onError?: (message: string) => void;
}

interface UseAboutFormResult {
  data: AboutEditableShape;
  loading: boolean;
  saving: boolean;
  /** Update a single field on the in-memory shape (does not persist). */
  updateField: <K extends keyof AboutEditableShape>(
    field: K,
    value: AboutEditableShape[K]
  ) => void;
  /** PUT the full shape to /api/admin/about. Resolves true on success. */
  save: () => Promise<boolean>;
}

/**
 * Owns the load/edit/save loop for the About admin section.
 *
 * - Loads from GET /api/about on mount
 * - Tracks the editable shape locally; updateField sets one key
 * - PUT /api/admin/about on save() — endpoint is delete-then-create per
 *   pages/api/admin/about.ts, so the entire shape must round-trip
 * - Toasts ("About page settings saved!" / "Failed to save settings")
 *   are emitted by the host via onError + a separate toast hook;
 *   the hook itself stays UI-agnostic so it's reusable in other
 *   contexts (e.g. preview environments).
 */
export function useAboutForm({ onError }: UseAboutFormOptions = {}): UseAboutFormResult {
  const [data, setData] = useState<AboutEditableShape>(EMPTY_ABOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAboutData = useCallback(async () => {
    try {
      const res = await fetch("/api/about");
      if (!res.ok) throw new Error("Failed to fetch");
      const fresh = (await res.json()) as Partial<AboutEditableShape>;
      setData({
        professionalSummary: fresh.professionalSummary || "",
        technicalSkills: fresh.technicalSkills || [],
        professionalExperience: fresh.professionalExperience || [],
        education: fresh.education || [],
        technicalCertifications: fresh.technicalCertifications || [],
        leadershipExperience: fresh.leadershipExperience || [],
        leadershipSubtitle: fresh.leadershipSubtitle || "",
        hobbies: fresh.hobbies || [],
      });
    } catch (_error) {
      onError?.("Failed to load about page data");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const updateField = useCallback(
    <K extends keyof AboutEditableShape>(field: K, value: AboutEditableShape[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return true;
    } catch (_error) {
      onError?.("Failed to save settings");
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, onError]);

  return { data, loading, saving, updateField, save };
}
