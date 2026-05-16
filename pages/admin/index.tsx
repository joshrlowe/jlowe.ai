import { useEffect } from "react";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { requireAuth } from "@/lib/auth";

export async function getServerSideProps(context: GetServerSidePropsContext) {
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
