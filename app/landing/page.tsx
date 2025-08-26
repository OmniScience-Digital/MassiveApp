"use client";

import Navbar from "@/components/layout/navbar";
import DynamicDashboardlist from "@/components/dashboard/dynamiclist";
import Footer from "@/components/layout/footer";
import { useEffect } from "react";

export default function App() {


  useEffect(() => {
    //set table page from this page.
    localStorage.setItem('sitesTablePagination', JSON.stringify({
      pageIndex: 0,
      pageSize: 10,
    }));
  
  }, []);

 

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 p-1 mt-20 ">
        <DynamicDashboardlist />
      </main>
      <Footer />

    </div>
  );
}



