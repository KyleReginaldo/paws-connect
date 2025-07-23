"use client";

import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-[10px]">
      <DashboardHeader />
      {children}
    </div>
  );
}
