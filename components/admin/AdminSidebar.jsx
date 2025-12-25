import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import styles from "@/styles/AdminLayout.module.css";

export default function AdminSidebar() {
  const router = useRouter();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: null },
    { href: "/admin/settings", label: "Settings", icon: null },
    { href: "/admin/articles", label: "Articles", icon: null },
    // Add more navigation items here as they're created
  ];

  const isActive = (href) => {
    return router.pathname === href;
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
      </div>
      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
          >
            {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className={styles.logoutButton}
        >
          <span className={styles.navLabel}>Logout</span>
        </button>
      </div>
    </div>
  );
}

