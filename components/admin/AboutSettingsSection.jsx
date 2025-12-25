import { useState, useEffect } from "react";
import { Button, Form, Alert, Card } from "react-bootstrap";
import { useToast } from "./ToastProvider";

export default function AboutSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [content, setContent] = useState({
    bio: "",
    skills: [],
    resumeUrl: "",
    professionalExperience: [],
    leadershipExperience: [],
    education: [],
    technicalCertifications: [],
    hobbies: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch from the actual About API
      const res = await fetch("/api/about");
      if (res.ok) {
        const data = await res.json();
        
        // Transform technicalSkills from database format [{category, skillName, ...}] 
        // to admin UI format [{category, items: [skillName, ...]}]
        const skillsMap = {};
        const dbSkills = Array.isArray(data.technicalSkills) ? data.technicalSkills : [];
        
        dbSkills.forEach((skill) => {
          if (skill && skill.category && skill.skillName) {
            if (!skillsMap[skill.category]) {
              skillsMap[skill.category] = [];
            }
            skillsMap[skill.category].push(skill.skillName);
          }
        });
        
        const transformedSkills = Object.keys(skillsMap).map((category) => ({
          category,
          items: skillsMap[category] || [],
        }));
        
        setContent({
          bio: data.professionalSummary || "",
          skills: transformedSkills,
          resumeUrl: "",
          professionalExperience: Array.isArray(data.professionalExperience) ? data.professionalExperience : [],
          leadershipExperience: Array.isArray(data.leadershipExperience) ? data.leadershipExperience : [],
          education: Array.isArray(data.education) ? data.education : [],
          technicalCertifications: Array.isArray(data.technicalCertifications) ? data.technicalCertifications : [],
          hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
        });
      }
    } catch (error) {
      onError("Failed to load about page content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Transform skills from admin UI format [{category, items: [...]}]
      // to database format [{category, skillName, expertiseLevel, projects: []}]
      const transformedSkills = [];
      content.skills.forEach((skillCategory) => {
        if (skillCategory && skillCategory.category && Array.isArray(skillCategory.items)) {
          skillCategory.items.forEach((skillName) => {
            if (skillName && skillName.trim()) {
              transformedSkills.push({
                category: skillCategory.category,
                skillName: skillName.trim(),
                expertiseLevel: 3, // Default value, can be enhanced later
                projects: [],
              });
            }
          });
        }
      });

      // Save to the actual About API
      const res = await fetch("/api/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalSummary: content.bio,
          technicalSkills: transformedSkills,
          professionalExperience: content.professionalExperience || [],
          leadershipExperience: content.leadershipExperience || [],
          education: content.education || [],
          technicalCertifications: content.technicalCertifications || [],
          hobbies: content.hobbies || [],
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage("About page content saved successfully!");
      showToast("About page content saved successfully!", "success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      showToast("Failed to save about page content", "error");
      onError("Failed to save about page content");
    } finally {
      setSaving(false);
    }
  };

  // Bio is a string, not an array
  const updateBio = (value) => {
    setContent({ ...content, bio: value });
  };

  const addSkillCategory = () => {
    setContent({
      ...content,
      skills: [...content.skills, { category: "", items: [] }],
    });
  };

  const removeSkillCategory = (index) => {
    setContent({
      ...content,
      skills: content.skills.filter((_, i) => i !== index),
    });
  };

  const updateSkillCategory = (index, field, value) => {
    const updated = [...content.skills];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, skills: updated });
  };

  const addSkillItem = (categoryIndex) => {
    const updated = [...content.skills];
    if (!updated[categoryIndex]) {
      updated[categoryIndex] = { category: "", items: [] };
    }
    if (!Array.isArray(updated[categoryIndex].items)) {
      updated[categoryIndex].items = [];
    }
    updated[categoryIndex].items = [...updated[categoryIndex].items, ""];
    setContent({ ...content, skills: updated });
  };

  const removeSkillItem = (categoryIndex, itemIndex) => {
    const updated = [...content.skills];
    if (updated[categoryIndex] && Array.isArray(updated[categoryIndex].items)) {
      updated[categoryIndex].items = updated[categoryIndex].items.filter((_, i) => i !== itemIndex);
      setContent({ ...content, skills: updated });
    }
  };

  const updateSkillItem = (categoryIndex, itemIndex, value) => {
    const updated = [...content.skills];
    if (updated[categoryIndex] && Array.isArray(updated[categoryIndex].items)) {
      updated[categoryIndex].items[itemIndex] = value;
      setContent({ ...content, skills: updated });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form onSubmit={handleSave}>
      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mb-3">
        <Card.Header>Professional Summary / Bio</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Bio Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={content.bio}
              onChange={(e) => updateBio(e.target.value)}
              placeholder="Enter your professional summary/bio..."
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          Skills
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={addSkillCategory}>
            Add Category
          </Button>
        </Card.Header>
        <Card.Body>
          {content.skills.map((skill, categoryIndex) => (
            <Card key={categoryIndex} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Category {categoryIndex + 1}</strong>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeSkillCategory(categoryIndex)}
                  >
                    Remove Category
                  </Button>
                </div>
                <Form.Group className="mb-2">
                  <Form.Label>Category Name</Form.Label>
                  <Form.Control
                    value={skill.category}
                    onChange={(e) =>
                      updateSkillCategory(categoryIndex, "category", e.target.value)
                    }
                  />
                </Form.Group>
                <Form.Label>Skills</Form.Label>
                {(Array.isArray(skill.items) ? skill.items : []).map((item, itemIndex) => (
                  <div key={itemIndex} className="d-flex gap-2 mb-2">
                    <Form.Control
                      value={item}
                      onChange={(e) =>
                        updateSkillItem(categoryIndex, itemIndex, e.target.value)
                      }
                    />
                    <Button
                      variant="outline-danger"
                      onClick={() => removeSkillItem(categoryIndex, itemIndex)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => addSkillItem(categoryIndex)}
                >
                  Add Skill
                </Button>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>

      <Form.Group className="mb-3">
        <Form.Label>Resume URL</Form.Label>
        <Form.Control
          type="text"
          value={content.resumeUrl}
          onChange={(e) => setContent({ ...content, resumeUrl: e.target.value })}
        />
      </Form.Group>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving..." : "Save About Page Content"}
      </Button>
    </Form>
  );
}

