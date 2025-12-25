import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { Container, Form, Button, Alert } from "react-bootstrap";

export default function AdminLogin({ isAdminPage: _ }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="darkBackground adminWrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Container>
        <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
          <h1 className="text-center mb-4" style={{ color: "var(--color-primary)", fontFamily: "var(--font-family-display)", fontSize: "var(--font-size-4xl)" }}>Admin Login</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "var(--color-text-primary)" }}>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ backgroundColor: "var(--color-bg-dark-alt)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "var(--color-text-primary)" }}>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ backgroundColor: "var(--color-bg-dark-alt)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={loading} style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
}

