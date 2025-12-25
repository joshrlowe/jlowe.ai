import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, Spinner } from "react-bootstrap";
import Link from "next/link";
import styles from "@/styles/AdminDashboard.module.css";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects for stats
      const projectsRes = await fetch("/api/admin/projects");
      const projects = await projectsRes.json();

      const published = projects.filter((p) => p.status === "Published").length;
      const drafts = projects.filter((p) => p.status === "Draft").length;
      const recent = projects
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map((p) => ({
          type: "project",
          title: p.title,
          status: p.status,
          updatedAt: p.updatedAt,
        }));

      setStats({
        totalProjects: projects.length,
        published,
        drafts,
        other: projects.length - published - drafts,
      });
      setRecentActivity(recent);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className="row mb-4">
          <div className="col-md-3">
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statLabel}>Total Projects</div>
                <div className={styles.statValue}>{stats?.totalProjects || 0}</div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statLabel}>Published</div>
                <div className={`${styles.statValue} ${styles.statPublished}`}>{stats?.published || 0}</div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statLabel}>Drafts</div>
                <div className={`${styles.statValue} ${styles.statDraft}`}>{stats?.drafts || 0}</div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statLabel}>Other</div>
                <div className={`${styles.statValue} ${styles.statOther}`}>{stats?.other || 0}</div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quick Actions</h5>
          </Card.Header>
          <Card.Body>
            <div className="d-flex gap-3 flex-wrap">
              <Link href="/admin/settings" className="btn btn-primary">
                Manage Settings
              </Link>
              <Link href="/admin/settings#projects" className="btn btn-outline-primary">
                Manage Projects
              </Link>
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
                View Site
              </a>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Recent Activity</h5>
          </Card.Header>
          <Card.Body>
            {recentActivity.length === 0 ? (
              <p className="text-muted mb-0">No recent activity</p>
            ) : (
              <div className={styles.activityList}>
                {recentActivity.map((activity, i) => (
                  <div key={i} className={styles.activityItem}>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityMeta}>
                      <span className={`badge ${activity.status === "Published" ? "bg-success" : "bg-secondary"}`}>
                        {activity.status}
                      </span>
                      <span className={styles.activityDate}>
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}

