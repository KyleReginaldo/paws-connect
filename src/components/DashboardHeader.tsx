const DashboardHeader = () => {
  // Keep the header minimal per design: only show title on larger screens.
  return (
    <div className="hidden md:flex justify-between items-center">
      <h1 className="font-medium text-[16px]">Dashboard</h1>
    </div>
  );
};

export default DashboardHeader;
