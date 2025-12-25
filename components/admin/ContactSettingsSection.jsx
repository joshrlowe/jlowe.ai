import { useState, useEffect } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { useToast } from "./ToastProvider";

export default function ContactSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [content, setContent] = useState({
    headline: "",
    body: "",
    email: "",
    phone: "",
    formRecipientEmail: "",
    name: "",
    location: "",
    availability: "",
    socialMediaLinks: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch from the actual Contact API
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setContent({
          headline: "",
          body: "",
          email: data.emailAddress || "",
          phone: data.phoneNumber || "",
          formRecipientEmail: data.emailAddress || "",
          name: data.name || "",
          location: typeof data.location === "string" ? data.location : data.location?.city || "",
          availability: typeof data.availability === "string" 
            ? data.availability 
            : data.availability?.workingHours || "",
          socialMediaLinks: data.socialMediaLinks || {},
        });
      }
    } catch (error) {
      onError("Failed to load contact page content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Save to the actual Contact API
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: content.name,
          emailAddress: content.email,
          phoneNumber: content.phone,
          location: content.location,
          availability: { workingHours: content.availability },
          socialMediaLinks: content.socialMediaLinks,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage("Contact page content saved successfully!");
      showToast("Contact page content saved successfully!", "success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      showToast("Failed to save contact page content", "error");
      onError("Failed to save contact page content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form onSubmit={handleSave}>
      {message && <Alert variant="success">{message}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Headline</Form.Label>
        <Form.Control
          type="text"
          value={content.headline}
          onChange={(e) => setContent({ ...content, headline: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Body Text</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={content.body}
          onChange={(e) => setContent({ ...content, body: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={content.name}
          onChange={(e) => setContent({ ...content, name: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Contact Email</Form.Label>
        <Form.Control
          type="email"
          value={content.email}
          onChange={(e) => setContent({ ...content, email: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Phone Number</Form.Label>
        <Form.Control
          type="text"
          value={content.phone}
          onChange={(e) => setContent({ ...content, phone: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Location</Form.Label>
        <Form.Control
          type="text"
          value={content.location}
          onChange={(e) => setContent({ ...content, location: e.target.value })}
          placeholder="e.g., Hatfield, PA, US"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Availability / Working Hours</Form.Label>
        <Form.Control
          type="text"
          value={content.availability}
          onChange={(e) => setContent({ ...content, availability: e.target.value })}
          placeholder="e.g., Monday-Friday, 9am-5pm EST"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Form Recipient Email</Form.Label>
        <Form.Control
          type="email"
          value={content.formRecipientEmail}
          onChange={(e) => setContent({ ...content, formRecipientEmail: e.target.value })}
        />
        <Form.Text className="text-muted">
          Email address where contact form submissions will be sent
        </Form.Text>
      </Form.Group>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving..." : "Save Contact Page Content"}
      </Button>
    </Form>
  );
}

