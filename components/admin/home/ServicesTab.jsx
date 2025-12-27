/**
 * ServicesTab - Services section editing tab
 *
 * Refactoring: Extract Component from HomeSettingsSection
 */

import {
  FormField,
  adminStyles,
  ICON_OPTIONS,
  VARIANT_OPTIONS,
} from "../shared";

export default function ServicesTab({
  homeContent,
  setHomeContent,
  saving,
  onSave,
}) {
  const cardClass = adminStyles.card;

  // Service handlers
  const addService = () => {
    setHomeContent((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          iconKey: "computer",
          title: "",
          description: "",
          variant: "primary",
        },
      ],
    }));
  };

  const updateService = (index, field, value) => {
    setHomeContent((prev) => ({
      ...prev,
      services: prev.services.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeService = (index) => {
    setHomeContent((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const moveService = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= homeContent.services.length) return;

    setHomeContent((prev) => {
      const newServices = [...prev.services];
      [newServices[index], newServices[newIndex]] = [
        newServices[newIndex],
        newServices[index],
      ];
      return { ...prev, services: newServices };
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Section Header
        </h3>

        <div className="space-y-4">
          <FormField
            label="Section Title"
            value={homeContent.servicesTitle}
            onChange={(e) =>
              setHomeContent({ ...homeContent, servicesTitle: e.target.value })
            }
            placeholder="AI & Engineering Services"
          />
          <FormField
            label="Section Subtitle"
            value={homeContent.servicesSubtitle}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                servicesSubtitle: e.target.value,
              })
            }
            rows={2}
          />
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Services ({homeContent.services.length})
          </h3>
          <button
            type="button"
            onClick={addService}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            + Add Service
          </button>
        </div>

        {homeContent.services.map((service, index) => (
          <ServiceCard
            key={index}
            service={service}
            index={index}
            total={homeContent.services.length}
            onUpdate={updateService}
            onRemove={removeService}
            onMove={moveService}
          />
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className={adminStyles.buttonPrimary}
      >
        {saving ? "Saving..." : "Save Services"}
      </button>
    </div>
  );
}

/**
 * ServiceCard - Individual service editor card
 *
 * Refactoring: Extract Component
 */
function ServiceCard({ service, index, total, onUpdate, onRemove, onMove }) {
  const cardClass = adminStyles.card;

  return (
    <div className={`${cardClass} space-y-4`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Service #{index + 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="px-2 py-1 rounded bg-[var(--color-bg-dark)] text-[var(--color-text-secondary)] disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="px-2 py-1 rounded bg-[var(--color-bg-dark)] text-[var(--color-text-secondary)] disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Title"
          value={service.title}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          placeholder="Service title"
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            label="Icon"
            value={service.iconKey}
            onChange={(e) => onUpdate(index, "iconKey", e.target.value)}
            options={ICON_OPTIONS}
          />
          <FormField
            label="Color"
            value={service.variant}
            onChange={(e) => onUpdate(index, "variant", e.target.value)}
            options={VARIANT_OPTIONS}
          />
        </div>
      </div>

      <FormField
        label="Description"
        value={service.description}
        onChange={(e) => onUpdate(index, "description", e.target.value)}
        placeholder="Describe this service..."
        rows={2}
      />
    </div>
  );
}
