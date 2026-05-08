/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, @next/next/no-html-link-for-pages, no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
