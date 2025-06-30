import React from "react";
import DashboardContainer from "@/app/components/DashboardContainer";
import { Dog, HeartHandshake, HelpingHand } from "lucide-react";

const DashboardDataOverview = () => {
  return (
    <div className="flex flex-row md:flex-wrap gap-[24px] overflow-x-auto hide-scrollbar">
      <DashboardContainer
        icon={Dog}
        title="Total pets"
        content="100"
        subcontent="+5 from last month"
      />
      <DashboardContainer
        icon={HeartHandshake}
        title="Adoptions"
        content="24"
      />
      <DashboardContainer
        icon={HelpingHand}
        title="Donations"
        content="₱15,000"
      />
    </div>
  );
};

export default DashboardDataOverview;
