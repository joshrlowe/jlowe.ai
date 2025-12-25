import { useState, useEffect } from "react";
import { Button, Form, Alert, Card } from "react-bootstrap";
import { useToast } from "./ToastProvider";

export default function HomeSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [content, setContent] = useState({
    hero: { headline: "", subheadline: "", ctaText: "", ctaHref: "", imageUrl: "" },
    highlights: [],
    featuredProjectSlugs: [],
    briefBio: "",
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchContent();
    fetchProjects();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch from the actual Welcome API
      const res = await fetch("/api/welcome");
      if (res.ok) {
        const data = await res.json();
        setContent({
          hero: {
            headline: data.name || "",
            subheadline: "",
            ctaText: data.callToAction || "",
            ctaHref: "",
            imageUrl: "",
          },
          highlights: [],
          featuredProjectSlugs: [],
          briefBio: data.briefBio || "",
        });
      }
    } catch (error) {
      onError("Failed to load home page content");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      setProjects(data.filter((p) => p.slug));
    } catch (error) {
      onError("Failed to load projects");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Save to the actual Welcome API
      const res = await fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: content.hero.headline,
          callToAction: content.hero.ctaText,
          briefBio: content.briefBio,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage("Home page content saved successfully!");
      showToast("Home page content saved successfully!", "success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      showToast("Failed to save home page content", "error");
      onError("Failed to save home page content");
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    setContent({
      ...content,
      highlights: [...content.highlights, { title: "", body: "" }],
    });
  };

  const removeHighlight = (index) => {
    setContent({
      ...content,
      highlights: content.highlights.filter((_, i) => i !== index),
    });
  };

  const updateHighlight = (index, field, value) => {
    const updated = [...content.highlights];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, highlights: updated });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form onSubmit={handleSave}>
      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mb-3">
        <Card.Header>Hero Section</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Headline</Form.Label>
            <Form.Control
              type="text"
              value={content.hero.headline}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, headline: e.target.value },
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Subheadline</Form.Label>
            <Form.Control
              type="text"
              value={content.hero.subheadline}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, subheadline: e.target.value },
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>CTA Text</Form.Label>
            <Form.Control
              type="text"
              value={content.hero.ctaText}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, ctaText: e.target.value },
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>CTA URL</Form.Label>
            <Form.Control
              type="text"
              value={content.hero.ctaHref}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, ctaHref: e.target.value },
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Hero Image URL</Form.Label>
            <Form.Control
              type="text"
              value={content.hero.imageUrl}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: { ...content.hero, imageUrl: e.target.value },
                })
              }
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Brief Bio</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Bio Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={content.briefBio}
              onChange={(e) =>
                setContent({
                  ...content,
                  briefBio: e.target.value,
                })
              }
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          Highlights
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={addHighlight}>
            Add Highlight
          </Button>
        </Card.Header>
        <Card.Body>
          {content.highlights.map((highlight, index) => (
            <div key={index} className="mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <strong>Highlight {index + 1}</strong>
                <Button size="sm" variant="outline-danger" onClick={() => removeHighlight(index)}>
                  Remove
                </Button>
              </div>
              <Form.Group className="mb-2">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={highlight.title}
                  onChange={(e) => updateHighlight(index, "title", e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Body</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={highlight.body}
                  onChange={(e) => updateHighlight(index, "body", e.target.value)}
                />
              </Form.Group>
            </div>
          ))}
        </Card.Body>
      </Card>

      <Form.Group className="mb-3">
        <Form.Label>Featured Projects (Select multiple)</Form.Label>
        <Form.Select
          multiple
          value={content.featuredProjectSlugs}
          onChange={(e) =>
            setContent({
              ...content,
              featuredProjectSlugs: Array.from(e.target.selectedOptions, (option) => option.value),
            })
          }
        >
          {projects.map((project) => (
            <option key={project.id} value={project.slug}>
              {project.title}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">Hold Ctrl/Cmd to select multiple</Form.Text>
      </Form.Group>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving..." : "Save Home Page Content"}
      </Button>
    </Form>
  );
}

