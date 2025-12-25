import { useState } from "react";
import { useSession } from "next-auth/react";
import { Accordion, Alert, Spinner } from "react-bootstrap";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import GlobalSettingsSection from "@/components/admin/GlobalSettingsSection";
import HomeSettingsSection from "@/components/admin/HomeSettingsSection";
import AboutSettingsSection from "@/components/admin/AboutSettingsSection";
import ProjectsSettingsSection from "@/components/admin/ProjectsSettingsSection";
import ContactSettingsSection from "@/components/admin/ContactSettingsSection";
import styles from "@/styles/AdminSettings.module.css";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminSettings() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [activeKey, setActiveKey] = useState("0");

  if (status === "loading" || !session) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className={styles.alert}>
          {error}
        </Alert>
      )}

      <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)} className={styles.accordion}>
        <Accordion.Item eventKey="0" className={styles.accordionItem}>
          <Accordion.Header className={styles.accordionHeader}>Global Site Settings</Accordion.Header>
          <Accordion.Body className={styles.accordionBody}>
            <GlobalSettingsSection onError={setError} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1" className={styles.accordionItem}>
          <Accordion.Header className={styles.accordionHeader}>Home Page</Accordion.Header>
          <Accordion.Body className={styles.accordionBody}>
            <HomeSettingsSection onError={setError} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2" className={styles.accordionItem}>
          <Accordion.Header className={styles.accordionHeader}>About Page</Accordion.Header>
          <Accordion.Body className={styles.accordionBody}>
            <AboutSettingsSection onError={setError} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3" className={styles.accordionItem}>
          <Accordion.Header className={styles.accordionHeader}>Projects</Accordion.Header>
          <Accordion.Body className={styles.accordionBody}>
            <ProjectsSettingsSection onError={setError} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="4" className={styles.accordionItem}>
          <Accordion.Header className={styles.accordionHeader}>Contact</Accordion.Header>
          <Accordion.Body className={styles.accordionBody}>
            <ContactSettingsSection onError={setError} />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </AdminLayout>
  );
}

