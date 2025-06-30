import React from "react";
import { Expand, LucideProps } from "lucide-react";
type Props = {
  title: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  content: string;
  subcontent?: string | null;
};
const DashboardContainer = (props: Props) => {
  const { content, icon: Icon, title, subcontent } = props;
  return (
    <div className="flex flex-col justify-start items-center h-fit bg-white rounded-[10px] p-[20px]">
      <div className="flex items-center gap-[20px] mb-[8px]">
        <Icon
          className="border-1 p-[2px] rounded-[4px] border-[#cacaca]"
          size={32}
          color="#FE5D26"
        />
        <h1 className="text-[18px]">{title}</h1>
        <Expand size={16} color="#7B7B7B" />
      </div>
      <h1 className="text-[32px] text-[#FE5D26] font-bold">{content}</h1>
      {subcontent ? (
        <>
          <hr className="w-full  border-t-[1px] border-[#cacaca] my-[8px]" />
          <p className="text-[#7B7B7B] text-[14px] place-self-start">
            {subcontent}
          </p>
        </>
      ) : null}
    </div>
  );
};

export default DashboardContainer;
