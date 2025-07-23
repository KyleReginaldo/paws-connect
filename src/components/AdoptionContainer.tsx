import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import corgi from "../../public/corgi.jpg";
type Props = {
  adopter: string;
  timeago: string;
  isRequirementComplete: boolean;
};
const AdoptionContainer = (props: Props) => {
  const { adopter, isRequirementComplete, timeago } = props;

  return (
    <div className="bg-white h-fit w-fit p-[8px] rounded-[10px] flex flex-col hover:bg-gray-100 cursor-pointer transition-all">
      <Image
        src={corgi}
        alt="corgi"
        width={200}
        height={100}
        style={{ objectFit: "cover", width: "200px", height: "120px" }}
        className="rounded-[8px] mb-[8px]"
      />
      <p className="text-[15px]">
        Adopter: <span className="font-medium">{adopter}</span>
      </p>
      <p className="text-[12px]">{timeago}</p>
      <div className="flex flex-row gap-[5px] items-center mb-[8px]">
        <div
          className={`h-[8px] w-[8px] ${
            isRequirementComplete ? " bg-green-500" : " bg-blue-300"
          } rounded-full`}
        ></div>
        <p className="text-[12px]">
          {isRequirementComplete
            ? "Complete requirements"
            : "Pending requirements"}
        </p>
      </div>
      <Button className="bg-[#FE5D26]">View application</Button>
    </div>
  );
};

export default AdoptionContainer;
