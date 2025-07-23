import { LucideProps } from "lucide-react";
import React from "react";

type Props = {
  title: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  isActive: boolean;
  onButtonClick: () => void;
};

const SideBarTile = (props: Props) => {
  const { title, icon: Icon, isActive, onButtonClick } = props;
  return (
    <li
      className={`cursor-pointer flex items-center gap-[8px] w-[180px] hover:bg-[#FE5D26] p-[8px] hover:text-white mx-[10px] rounded-[8px] ${
        isActive ? "bg-[#FE5D26]" : null
      } ${isActive ? "text-white" : null}`}
      onClick={onButtonClick}
    >
      <Icon className="w-5 h-5" />
      <span>{title}</span>
    </li>
  );
};

export default SideBarTile;
