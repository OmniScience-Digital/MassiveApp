"use client";

import Navbar from "@/components/layout/navbar";
import DynamicDashboardlist from "@/components/dashboard/dynamiclist";
import Footer from "@/components/layout/footer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

export default function App() {
  const router = useRouter();

  useEffect(() => {
    // Block unauthenticated access — redirect to login if no valid token
    fetchAuthSession()
      .then((session) => {
        if (!session.tokens?.accessToken) {
          router.replace("/");
        }
      })
      .catch(() => {
        router.replace("/");
      });

    // Reset pagination
    localStorage.setItem(
      "sitesTablePagination",
      JSON.stringify({ pageIndex: 0, pageSize: 10 }),
    );
  }, [router]);

  return (
  <>
        <DynamicDashboardlist />
     </>
  );
}
