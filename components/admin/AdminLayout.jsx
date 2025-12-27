import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children, title = "Admin" }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-dark)]">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 ml-0 md:ml-64">
        {title && (
          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-8 font-heading">
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}
