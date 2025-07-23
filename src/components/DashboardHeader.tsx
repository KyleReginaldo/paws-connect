import React from "react";
import danilo from "../../public/danilo.jpg";
import Image from "next/image";
const DashboardHeader = () => {
  return (
    <div className="hidden md:flex justify-between items-center">
      <h1 className="font-medium text-[16px]">Dashboard</h1>
      <div className="flex items-center bg-white py-[4px] px-[12px] gap-[8px] rounded-[4px]">
        <Image
          src={danilo}
          alt="profile"
          width={48}
          height={48}
          className="rounded-[2px] object-cover"
        />
        <div className="flex flex-col items-start">
          <h1 className="text-[16px] font-semibold">James Cooper</h1>
          <p className="text-[14px] text-[#3D3C42]">admin@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
