import AdminSidebar from "./AdminSidebar";
import styles from "@/styles/AdminLayout.module.css";

export default function AdminLayout({ children, title = "Admin" }) {
  return (
    <div className={`${styles.adminLayout} adminWrapper`}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        {title && <h1 className={styles.adminPageTitle}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}

