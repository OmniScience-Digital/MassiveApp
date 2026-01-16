import React from "react";
import GridHeader from "../GridHeader";
import EditableSiteConstants from "./Editablelabel";
import { SiteConstantsInterface } from "@/types/schema";

// Define the props interface for SiteConstants
interface SiteConstantsProps {
  siteConstants: SiteConstantsInterface; 
   onUpdate?: (updatedConstants: SiteConstantsInterface) => void;
}

const SiteConstants = ({ siteConstants,onUpdate }: SiteConstantsProps) => {
  return (
    <div className="px-6 py-2 border h-full w-full rounded-lg shadow-sm bg-background space-y-4">
      <GridHeader children="Site Constants" />
      <EditableSiteConstants
        siteConstants={siteConstants}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default SiteConstants;
