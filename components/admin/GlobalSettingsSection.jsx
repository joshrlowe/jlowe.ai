import { useState, useEffect } from "react";
import { Button, Form, Alert, Card } from "react-bootstrap";
import { useToast } from "./ToastProvider";

export default function GlobalSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "",
    footerText: "",
    socials: { github: "", linkedin: "", twitter: "", instagram: "", email: "" },
    navLinks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/site-settings");
      const data = await res.json();
      setSettings({
        siteName: data.siteName || "",
        footerText: data.footerText || "",
        socials: data.socials || { github: "", linkedin: "", twitter: "", instagram: "", email: "" },
        navLinks: data.navLinks || [],
        seoDefaults: data.seoDefaults || {},
      });
    } catch (error) {
      onError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage("Settings saved successfully!");
      showToast("Settings saved successfully!", "success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      showToast("Failed to save settings", "error");
      onError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () => {
    setSettings({
      ...settings,
      navLinks: [...settings.navLinks, { label: "", href: "", order: settings.navLinks.length }],
    });
  };

  const removeNavLink = (index) => {
    setSettings({
      ...settings,
      navLinks: settings.navLinks.filter((_, i) => i !== index),
    });
  };

  const updateNavLink = (index, field, value) => {
    const updated = [...settings.navLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, navLinks: updated });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form onSubmit={handleSave}>
      {message && <Alert variant="success">{message}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Site Name</Form.Label>
        <Form.Control
          type="text"
          value={settings.siteName}
          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Footer Text</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={settings.footerText}
          onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
        />
      </Form.Group>

      <Card className="mb-3">
        <Card.Header>Social Media Links</Card.Header>
        <Card.Body>
          {["github", "linkedin", "twitter", "instagram", "email"].map((platform) => (
            <Form.Group key={platform} className="mb-2">
              <Form.Label>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Form.Label>
              <Form.Control
                type="text"
                value={settings.socials[platform] || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, [platform]: e.target.value },
                  })
                }
              />
            </Form.Group>
          ))}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          Navigation Links
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={addNavLink}>
            Add Link
          </Button>
        </Card.Header>
        <Card.Body>
          {settings.navLinks.map((link, index) => (
            <div key={index} className="d-flex gap-2 mb-2">
              <Form.Control
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateNavLink(index, "label", e.target.value)}
              />
              <Form.Control
                placeholder="URL"
                value={link.href}
                onChange={(e) => updateNavLink(index, "href", e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => removeNavLink(index)}>
                Remove
              </Button>
            </div>
          ))}
        </Card.Body>
      </Card>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </Form>
  );
}

