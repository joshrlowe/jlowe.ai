import { useState } from "react";
import { useSession } from "next-auth/react";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import GlobalSettingsSection from "@/components/admin/GlobalSettingsSection";
import HomeSettingsSection from "@/components/admin/HomeSettingsSection";
import AboutSettingsSection from "@/components/admin/AboutSettingsSection";
import ProjectsSettingsSection from "@/components/admin/ProjectsSettingsSection";
import ContactSettingsSection from "@/components/admin/ContactSettingsSection";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminSettings() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("global");

  const sections = [
    {
      id: "global",
      label: "Global Site Settings",
      Component: GlobalSettingsSection,
    },
    { id: "home", label: "Home Page", Component: HomeSettingsSection },
    { id: "about", label: "About Page", Component: AboutSettingsSection },
    { id: "projects", label: "Projects", Component: ProjectsSettingsSection },
    { id: "contact", label: "Contact", Component: ContactSettingsSection },
  ];

  if (status === "loading" || !session) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-[var(--color-border)]">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeSection === section.id
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Active section content */}
      <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        {sections.map((section) => {
          if (section.id !== activeSection) return null;
          const { Component } = section;
          return <Component key={section.id} onError={setError} />;
        })}
      </div>
    </AdminLayout>
  );
}
