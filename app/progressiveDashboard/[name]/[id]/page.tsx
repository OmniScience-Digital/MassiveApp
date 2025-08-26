"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { ReportItem, RuntimesAudit } from "@/types/schema";
import { client } from "@/service/schemaClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import RuntimeTable from "@/components/widgets/tables/runtimeTable";

const ProgressiveDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <Footer />
        </div>
    )
}

export default ProgressiveDashboard
