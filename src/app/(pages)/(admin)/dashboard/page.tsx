'use client';
import { supabase } from '@/app/supabase/supabase';
import AdoptionContainer from '@/components/AdoptionContainer';
import { DashboardDonationTable } from '@/components/DashbardDonationTable';
import DashboardDataOverview from '@/components/DashboardDataOverview';
import DashboardUserOverview from '@/components/DashboardUserOverview';
import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';

const page = () => {
  const [session, setSession] = useState<Session | null>(null);

  const kunwariGetSession = async () => {
    const response = await supabase.auth.getSession();
    const session = response.data.session;
    setSession(session);
    console.log('session', session);
  };
  useEffect(() => {
    kunwariGetSession();
  }, [session]);
  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col p-[16px] gap-[16px] overflow-y-auto">
        <DashboardDataOverview />
        <h1>Recent adoption application</h1>
        <div className="flex flex-row md:flex-wrap gap-[20px] overflow-x-auto hide-scrollbar">
          <AdoptionContainer
            adopter="Kyle Reginaldo"
            timeago="2 hours ago"
            isRequirementComplete={true}
          />
          <AdoptionContainer
            adopter="Aljhon Balmes"
            timeago="3 hours ago"
            isRequirementComplete={false}
          />
          <AdoptionContainer
            adopter="Patrick Allen"
            timeago="10 hours ago"
            isRequirementComplete={true}
          />
        </div>
        <h1>Ongoing donations</h1>
        <DashboardDonationTable />
      </div>

      <DashboardUserOverview />
    </div>
  );
};

export default page;
