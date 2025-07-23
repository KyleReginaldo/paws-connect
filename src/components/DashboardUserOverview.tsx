import React from "react";

const DashboardUserOverview = () => {
  return (
    <div className="hidden md:flex flex-col gap-[10px]">
      <div className="w-[250px] h-fit bg-white p-[16px] rounded-sm shrink-0">
        <h1 className="font-semibold text-md mb-2">Users (6)</h1>
        <div className="flex flex-col gap-[8px]">
          <p>Kyle Reginaldo</p>
          <p>Aljhon Balmes</p>
          <p>Patrick Allen</p>
          <p>Maria Cruz</p>
          <p>Jen Santos</p>
          <p>Mark Javier</p>
        </div>
      </div>
      <div className="w-[250px] h-fit bg-white p-[16px] rounded-sm shrink-0">
        <h1 className="font-semibold text-md mb-2">Staffs (6)</h1>
        <div className="flex flex-col gap-[8px]">
          <p>Kyle Reginaldo</p>
          <p>Aljhon Balmes</p>
          <p>Patrick Allen</p>
          <p>Maria Cruz</p>
          <p>Jen Santos</p>
          <p>Mark Javier</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardUserOverview;
