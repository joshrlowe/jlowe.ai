import { useEffect } from "react";
import { useRouter } from "next/router";
import { requireAuth } from "@/lib/auth.js";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard page
    router.replace("/admin/dashboard");
  }, [router]);

  return null;
}

