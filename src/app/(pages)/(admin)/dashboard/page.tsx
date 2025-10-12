'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/components/ui/notification';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDashboardData, { type ChartDataPoint, type User } from '@/hooks/useDashboardData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Activity,
  ArrowUpRight,
  CalendarIcon,
  Dog,
  DollarSign,
  FileText,
  Heart,
  PawPrint,
  Shield,
  TrendingUp,
  UserCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
// Charts
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardSkeleton } from '@/components/ui/skeleton-patterns';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';

const chartConfig = {
  users: {
    label: 'Users',
    color: '#FFA726', // Lighter orange
  },
  donations: {
    label: 'Donations',
    color: '#FFB74D', // Even lighter orange
  },
  pets: {
    label: 'Pets',
    color: '#FFCC80', // Soft orange
  },
  activity: {
    label: 'Activity',
    color: '#FFE0B2', // Very light orange
  },
  dogs: {
    label: 'Dogs',
    color: '#FFA726',
  },
  cats: {
    label: 'Cats',
    color: '#FFB74D',
  },
} satisfies ChartConfig;

function EnhancedUserGrowthChart({ chartData }: { chartData: ChartDataPoint[] }) {
  return (
    <div className="w-full overflow-hidden">
      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFA726" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FFA726" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newUserGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB74D" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FFB74D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ stroke: 'hsl(var(--border))' }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stackId="1"
            stroke="#FFA726"
            fill="url(#userGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="newUsers"
            stackId="2"
            stroke="#FFB74D"
            fill="url(#newUserGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function EnhancedDonationTrendsChart({ chartData }: { chartData: ChartDataPoint[] }) {
  return (
    <div className="w-full overflow-hidden">
      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
        <BarChart data={chartData}>
          <defs>
            <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB74D" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#FFB74D" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'hsl(var(--muted)/10)' }}
          />
          <Bar dataKey="donations" fill="url(#donationGradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function EnhancedPetAnalytics({
  period,
  chartData,
}: {
  period: string;
  chartData: ChartDataPoint[];
}) {
  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      <div className="w-full overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="dogGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFA726" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFA726" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="catGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB74D" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFB74D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="dogs"
              stackId="1"
              stroke="#FFA726"
              fill="url(#dogGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cats"
              stackId="1"
              stroke="#FFB74D"
              fill="url(#catGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">Dog Breeds ({period})</h4>
          <div className="space-y-1">
            {[
              'Aspin (Philippine Dog)',
              'Mixed Breed',
              'Labrador Mix',
              'Golden Retriever Mix',
              'Other',
            ].map((breed) => (
              <div key={breed} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate flex-1 mr-2">{breed}</span>
                <span className="font-medium text-orange-500 flex-shrink-0">
                  {Math.floor(Math.random() * 5) + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">Cat Breeds ({period})</h4>
          <div className="space-y-1">
            {['Persian', 'Siamese', 'Maine Coon', 'Mixed Breed', 'Other'].map((breed) => (
              <div key={breed} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate flex-1 mr-2">{breed}</span>
                <span className="font-medium text-orange-500 flex-shrink-0">
                  {Math.floor(Math.random() * 3) + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffRoleAnalytics({ users }: { users: User[] }) {
  const staffData = [
    {
      role: 'Admin',
      count: users.filter((u) => u.role === 1).length,
      color: '#FFA726',
      icon: Shield,
      responsibilities: 'System management, user oversight',
    },
    {
      role: 'Staff',
      count: users.filter((u) => u.role === 2).length,
      color: '#FFB74D',
      icon: UserCheck,
      responsibilities: 'Pet care, adoption coordination',
    },
    {
      role: 'Users',
      count: users.filter((u) => u.role === 3).length,
      color: '#FFCC80',
      icon: UserIcon,
      responsibilities: 'Adoption applications, donations',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {staffData.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gradient-to-r from-orange-25 to-orange-50 border border-orange-100 min-w-0"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="p-2 rounded-full bg-white shadow-sm flex-shrink-0">
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: item.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-gray-900 block truncate">
                {item.role}
              </span>
              <p className="text-xs text-muted-foreground truncate">{item.responsibilities}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-600 border-orange-100 font-semibold flex-shrink-0 ml-2"
          >
            {item.count}
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface ActivityItem {
  id: string;
  type: 'adoption' | 'donation' | 'user' | 'pet';
  title: string;
  subtitle: string;
  time: string;
}

function RecentActivityComponent({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      {activities.map((it) => (
        <div key={it.id} className="flex items-start space-x-3 sm:space-x-4 min-w-0">
          <div
            className={`p-2 rounded-full flex-shrink-0 ${
              it.type === 'user'
                ? 'bg-orange-50'
                : it.type === 'adoption'
                  ? 'bg-orange-50'
                  : 'bg-orange-50'
            }`}
          >
            {it.type === 'user' ? (
              <Users className="h-4 w-4 text-orange-500" />
            ) : it.type === 'adoption' ? (
              <Heart className="h-4 w-4 text-orange-500" />
            ) : it.type === 'pet' ? (
              <PawPrint className="h-4 w-4 text-orange-500" />
            ) : (
              <DollarSign className="h-4 w-4 text-orange-500" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{it.title}</p>
            {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
            <p className="text-xs text-muted-foreground">{new Date(it.time).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const Page = () => {
  const {
    users,
    campaigns,
    loading,
    error,
    stats,
    generateChartData,
    generateRecentActivity,
    generateRecentAdoptions,
    refetch,
  } = useDashboardData();

  const { success, error: showError, info } = useNotifications();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');

  const handleGenerateReport = async () => {
    try {
      info('Generating Report', 'Preparing comprehensive dashboard report PDF...');

      // Fetch all necessary data for comprehensive report
      const [
        fundraisingResponse,
        donationsResponse,
        petsResponse,
        adoptionsResponse,
        usersResponse,
      ] = await Promise.all([
        fetch('/api/v1/fundraising'),
        fetch('/api/v1/donations'),
        fetch('/api/v1/pets'),
        fetch('/api/v1/adoption'),
        fetch('/api/v1/users'),
      ]);

      const fundraisingData = fundraisingResponse.ok
        ? await fundraisingResponse.json()
        : { data: [] };
      const donationsData = donationsResponse.ok ? await donationsResponse.json() : { data: [] };
      const petsData = petsResponse.ok ? await petsResponse.json() : { data: [] };
      const adoptionsData = adoptionsResponse.ok ? await adoptionsResponse.json() : { data: [] };
      const usersData = usersResponse.ok ? await usersResponse.json() : { data: [] };

      const fundraisingCampaigns = fundraisingData.data || [];
      const donations = donationsData.data || [];
      const pets = petsData.data || [];
      const adoptions = adoptionsData.data || [];
      const allUsers = usersData.data || [];

      // Create comprehensive dashboard report
      const reportData = {
        generated_at: new Date().toISOString(),
        report_period: `As of ${new Date().toLocaleDateString()}`,

        // Executive Summary
        executive_summary: {
          total_pets: pets.length,
          available_pets: pets.filter(
            (p: { request_status?: string }) => p.request_status === 'approved',
          ).length,
          total_adoptions: adoptions.length,
          successful_adoptions: adoptions.filter(
            (a: { status?: string }) => a.status === 'APPROVED' || a.status === 'COMPLETED',
          ).length,
          pending_adoptions: adoptions.filter((a: { status?: string }) => a.status === 'PENDING')
            .length,
          total_users: allUsers.length,
          total_campaigns: fundraisingCampaigns.length,
          active_campaigns: fundraisingCampaigns.filter(
            (c: { status?: string }) => c.status === 'ONGOING',
          ).length,
          total_raised: donations.reduce(
            (sum: number, d: { amount?: number }) => sum + (d.amount || 0),
            0,
          ),
          total_donations: donations.length,
          adoption_success_rate:
            adoptions.length > 0
              ? (
                  (adoptions.filter(
                    (a: { status?: string }) => a.status === 'APPROVED' || a.status === 'COMPLETED',
                  ).length /
                    adoptions.length) *
                  100
                ).toFixed(2) + '%'
              : '0%',
        },

        // Pet Management Analytics
        pet_analytics: {
          by_type: {
            dogs: pets.filter((p: { type?: string }) => p.type?.toLowerCase() === 'dog').length,
            cats: pets.filter((p: { type?: string }) => p.type?.toLowerCase() === 'cat').length,
            others: pets.filter(
              (p: { type?: string }) => p.type && !['dog', 'cat'].includes(p.type.toLowerCase()),
            ).length,
          },
          by_status: {
            available: pets.filter(
              (p: { request_status?: string }) => p.request_status === 'approved',
            ).length,
            pending: pets.filter((p: { request_status?: string }) => p.request_status === 'pending')
              .length,
            adopted: pets.filter((p: { request_status?: string }) => p.request_status === 'adopted')
              .length,
          },
          by_size: {
            small: pets.filter((p: { size?: string }) => p.size === 'small').length,
            medium: pets.filter((p: { size?: string }) => p.size === 'medium').length,
            large: pets.filter((p: { size?: string }) => p.size === 'large').length,
          },
          health_status: pets.map(
            (p: {
              id?: number;
              name?: string;
              health_status?: string;
              is_vaccinated?: boolean;
              is_spayed_or_neutured?: boolean;
            }) => ({
              id: p.id,
              name: p.name,
              health_status: p.health_status || 'Not specified',
              is_vaccinated: p.is_vaccinated || false,
              is_spayed_neutered: p.is_spayed_or_neutured || false,
            }),
          ),
        },

        // Adoption Analytics
        adoption_analytics: adoptions.map(
          (adoption: {
            id?: number;
            created_at?: string;
            status?: string;
            pets?: { name?: string; type?: string };
            users?: { username?: string; email?: string };
            type_of_residence?: string;
          }) => ({
            id: adoption.id,
            date: new Date(adoption.created_at || '').toLocaleDateString(),
            status: adoption.status,
            pet_name: adoption.pets?.name || 'Unknown Pet',
            pet_type: adoption.pets?.type || 'Unknown Type',
            adopter_name: adoption.users?.username || 'Unknown User',
            adopter_email: adoption.users?.email || 'No email',
            residence_type: adoption.type_of_residence || 'Not specified',
            days_since_application: Math.floor(
              (new Date().getTime() - new Date(adoption.created_at || '').getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          }),
        ),

        // Fundraising Analytics
        fundraising_analytics: {
          campaign_performance: fundraisingCampaigns.map(
            (campaign: {
              id?: number;
              title?: string;
              status?: string;
              target_amount?: number;
              raised_amount?: number;
              created_at?: string;
            }) => {
              const campaignDonations = donations.filter(
                (d: { fundraising?: number }) => d.fundraising === campaign.id,
              );
              const progress = campaign.target_amount
                ? (((campaign.raised_amount || 0) / campaign.target_amount) * 100).toFixed(2)
                : '0';

              return {
                id: campaign.id,
                title: campaign.title,
                status: campaign.status,
                target_amount: campaign.target_amount || 0,
                raised_amount: campaign.raised_amount || 0,
                progress_percentage: progress + '%',
                donations_count: campaignDonations.length,
                created_date: new Date(campaign.created_at || '').toLocaleDateString(),
                days_active: Math.floor(
                  (new Date().getTime() - new Date(campaign.created_at || '').getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              };
            },
          ),
          donation_trends: donations.map(
            (d: { amount?: number; donated_at?: string; fundraising?: number }) => ({
              amount: d.amount || 0,
              date: new Date(d.donated_at || '').toLocaleDateString(),
              campaign_title:
                fundraisingCampaigns.find((c: { id?: number }) => c.id === d.fundraising)?.title ||
                'Unknown Campaign',
            }),
          ),
        },

        // User Analytics
        user_analytics: {
          by_role: {
            admins: allUsers.filter((u: { role?: number }) => u.role === 1).length,
            staff: allUsers.filter((u: { role?: number }) => u.role === 2).length,
            customers: allUsers.filter((u: { role?: number }) => u.role === 3).length,
          },
          by_status: {
            fully_verified: allUsers.filter(
              (u: { status?: string }) => u.status === 'FULLY_VERIFIED',
            ).length,
            semi_verified: allUsers.filter((u: { status?: string }) => u.status === 'SEMI_VERIFIED')
              .length,
            pending: allUsers.filter((u: { status?: string }) => u.status === 'PENDING').length,
          },
          recent_registrations: allUsers
            .filter((u: { created_at?: string }) => {
              const userDate = new Date(u.created_at || '');
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return userDate >= thirtyDaysAgo;
            })
            .map(
              (u: { username?: string; email?: string; created_at?: string; status?: string }) => ({
                username: u.username,
                email: u.email,
                registration_date: new Date(u.created_at || '').toLocaleDateString(),
                status: u.status,
              }),
            ),
        },
      };

      // Create PDF document
      const doc = new jsPDF();

      // Set orange theme colors
      const primaryColor: [number, number, number] = [255, 167, 38]; // Orange color
      const textColor: [number, number, number] = [51, 51, 51]; // Dark gray

      // Page 1: Cover Page
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('PAWS CONNECT', 105, 25, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Comprehensive Dashboard Report', 105, 35, { align: 'center' });

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 70, { align: 'center' });
      doc.text(`Report Period: ${reportData.report_period}`, 105, 85, { align: 'center' });

      // Executive Summary Section
      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Executive Summary', 20, 110);

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(12);
      const yPos = 130;

      const summaryData = [
        ['Metric', 'Value'],
        ['Total Pets', reportData.executive_summary.total_pets.toString()],
        ['Available Pets', reportData.executive_summary.available_pets.toString()],
        ['Total Adoptions', reportData.executive_summary.total_adoptions.toString()],
        ['Successful Adoptions', reportData.executive_summary.successful_adoptions.toString()],
        ['Pending Adoptions', reportData.executive_summary.pending_adoptions.toString()],
        ['Adoption Success Rate', reportData.executive_summary.adoption_success_rate],
        ['Total Users', reportData.executive_summary.total_users.toString()],
        ['Total Campaigns', reportData.executive_summary.total_campaigns.toString()],
        ['Active Campaigns', reportData.executive_summary.active_campaigns.toString()],
        ['Total Raised', `₱${reportData.executive_summary.total_raised.toLocaleString()}`],
        ['Total Donations', reportData.executive_summary.total_donations.toString()],
      ];

      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 },
      });

      // Page 2: Pet Analytics
      doc.addPage();
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Pet Management Analytics', 105, 20, { align: 'center' });

      // Pet Statistics by Type
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.text('Pets by Type', 20, 50);

      const petTypeData = [
        ['Type', 'Count'],
        ['Dogs', reportData.pet_analytics.by_type.dogs.toString()],
        ['Cats', reportData.pet_analytics.by_type.cats.toString()],
        ['Others', reportData.pet_analytics.by_type.others.toString()],
      ];

      autoTable(doc, {
        head: [petTypeData[0]],
        body: petTypeData.slice(1),
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 90 },
      });

      // Pet Statistics by Status
      doc.text('Pets by Status', 20, 110);

      const petStatusData = [
        ['Status', 'Count'],
        ['Available', reportData.pet_analytics.by_status.available.toString()],
        ['Pending', reportData.pet_analytics.by_status.pending.toString()],
        ['Adopted', reportData.pet_analytics.by_status.adopted.toString()],
      ];

      autoTable(doc, {
        head: [petStatusData[0]],
        body: petStatusData.slice(1),
        startY: 120,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 90 },
      });

      // Pet Statistics by Size
      doc.text('Pets by Size', 20, 170);

      const petSizeData = [
        ['Size', 'Count'],
        ['Small', reportData.pet_analytics.by_size.small.toString()],
        ['Medium', reportData.pet_analytics.by_size.medium.toString()],
        ['Large', reportData.pet_analytics.by_size.large.toString()],
      ];

      autoTable(doc, {
        head: [petSizeData[0]],
        body: petSizeData.slice(1),
        startY: 180,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 90 },
      });

      // Page 3: Adoption Analytics
      if (reportData.adoption_analytics.length > 0) {
        doc.addPage();
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Adoption Analytics', 105, 20, { align: 'center' });

        const adoptionTableData = reportData.adoption_analytics
          .slice(0, 20)
          .map(
            (adoption: {
              id?: number;
              date?: string;
              status?: string;
              pet_name?: string;
              pet_type?: string;
              adopter_name?: string;
            }) => [
              adoption.id?.toString() || 'N/A',
              adoption.date || 'N/A',
              adoption.status || 'N/A',
              adoption.pet_name || 'N/A',
              adoption.pet_type || 'N/A',
              adoption.adopter_name || 'N/A',
            ],
          );

        autoTable(doc, {
          head: [['ID', 'Date', 'Status', 'Pet Name', 'Pet Type', 'Adopter']],
          body: adoptionTableData,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          margin: { left: 10, right: 10 },
        });
      }

      // Page 4: Fundraising Analytics
      if (reportData.fundraising_analytics.campaign_performance.length > 0) {
        doc.addPage();
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Fundraising Analytics', 105, 20, { align: 'center' });

        const campaignTableData = reportData.fundraising_analytics.campaign_performance
          .slice(0, 15)
          .map(
            (campaign: {
              id?: number;
              title?: string;
              status?: string;
              target_amount?: number;
              raised_amount?: number;
              progress_percentage?: string;
            }) => [
              campaign.id?.toString() || 'N/A',
              (campaign.title || 'N/A').substring(0, 20) +
                ((campaign.title?.length || 0) > 20 ? '...' : ''),
              campaign.status || 'N/A',
              `₱${(campaign.target_amount || 0).toLocaleString()}`,
              `₱${(campaign.raised_amount || 0).toLocaleString()}`,
              campaign.progress_percentage || '0%',
            ],
          );

        autoTable(doc, {
          head: [['ID', 'Title', 'Status', 'Target', 'Raised', 'Progress']],
          body: campaignTableData,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          margin: { left: 10, right: 10 },
        });
      }

      // Page 5: User Analytics
      doc.addPage();
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('User Analytics', 105, 20, { align: 'center' });

      // Users by Role
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.text('Users by Role', 20, 50);

      const userRoleData = [
        ['Role', 'Count'],
        ['Admins', reportData.user_analytics.by_role.admins.toString()],
        ['Staff', reportData.user_analytics.by_role.staff.toString()],
        ['Customers', reportData.user_analytics.by_role.customers.toString()],
      ];

      autoTable(doc, {
        head: [userRoleData[0]],
        body: userRoleData.slice(1),
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 90 },
      });

      // Users by Status
      doc.text('Users by Verification Status', 20, 120);

      const userStatusData = [
        ['Status', 'Count'],
        ['Fully Verified', reportData.user_analytics.by_status.fully_verified.toString()],
        ['Semi Verified', reportData.user_analytics.by_status.semi_verified.toString()],
        ['Pending', reportData.user_analytics.by_status.pending.toString()],
      ];

      autoTable(doc, {
        head: [userStatusData[0]],
        body: userStatusData.slice(1),
        startY: 130,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 90 },
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `paws-connect-dashboard-report-${timestamp}.pdf`;

      // Save the PDF file
      doc.save(filename);

      success(
        'Report Generated Successfully',
        `Comprehensive dashboard report has been downloaded as ${filename}`,
        8000,
      );
    } catch (err) {
      console.error('Report generation failed:', err);
      showError(
        'Report Generation Failed',
        'Failed to generate the comprehensive report. Please try again.',
      );
    }
  };

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-orange-25/50 to-orange-50/50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Failed to load dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'Total Pets',
      value: String(stats.totalPets),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Dog,
      description: `${stats.availablePets} available for adoption`,
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Adoptions',
      value: String(stats.adoptedPets),
      change: '+23%',
      changeType: 'positive' as const,
      icon: Heart,
      description: 'Successfully adopted',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Total Donations',
      value: `₱${stats.totalDonations.toLocaleString()}`,
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: `${stats.activeCampaigns} active campaigns`,
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Active Users',
      value: String(stats.totalUsers),
      change: '+5%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Registered users',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
  ];

  const recentAdoptions = generateRecentAdoptions();
  const recentActivity = generateRecentActivity();

  const ongoingCampaigns = campaigns
    .filter((c) => c.status === 'ONGOING' || c.status === 'PENDING')
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      title: c.title || 'Untitled Campaign',
      description: c.description || 'No description available',
      target: c.target_amount || 0,
      raised: c.raised_amount || 0,
      daysLeft: c.end_date
        ? Math.max(
            0,
            Math.ceil(
              (new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : Math.floor(Math.random() * 30) + 1,
      supporters: Math.floor(Math.random() * 100) + 10, // Placeholder until we have donation counts
    }));

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-orange-25/50 to-orange-50/50 min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-2">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            id="pc-dash-generate-report"
            onClick={handleGenerateReport}
            variant="outline"
            size="sm"
            className="gap-2 border-orange-200 hover:bg-orange-25 bg-transparent"
          >
            <FileText className="h-4 w-4 text-orange-500" />
            Generate Report
          </Button>
          <Popover open={pickerOpen} onOpenChange={(open) => setPickerOpen(open)}>
            <PopoverTrigger asChild>
              <Button
                id="pc-dash-date-filter"
                variant="outline"
                className="border-orange-200 hover:bg-orange-25 bg-transparent whitespace-nowrap"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {dateRange?.from
                    ? dateRange.to
                      ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(
                          dateRange.to,
                        ).toLocaleDateString()}`
                      : `${new Date(dateRange.from).toLocaleDateString()}`
                    : 'Today'}
                </span>
                <span className="sm:hidden">{dateRange?.from ? 'Custom' : 'Today'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-2">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    const maybe = range as { from?: Date | null; to?: Date | null };
                    if (!maybe?.from) {
                      setDateRange(undefined);
                      return;
                    }
                    const newRange: DateRange = { from: maybe.from as Date };
                    if (maybe.to) newRange.to = maybe.to as Date;
                    setDateRange(newRange);
                    // close popover automatically if user picked both from & to
                    if (newRange.from && newRange.to) setPickerOpen(false);
                  }}
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickerOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        id="pc-dash-stats-grid"
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {dashboardStats.map((stat, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} border-0 shadow-sm hover:shadow-md transition-shadow`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 truncate pr-2">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.iconColor} flex-shrink-0`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {stat.value}
              </div>
              <div className="flex items-center text-xs mt-2">
                <TrendingUp className="mr-1 h-3 w-3 text-orange-500 flex-shrink-0" />
                <span className="text-orange-600 font-medium">{stat.change}</span>
                <span className="ml-1 text-gray-600 truncate">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Analytics
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comprehensive insights with weekly, monthly, and annual breakdowns
            </p>
          </div>
          <Tabs
            id="pc-dash-analytics-tabs"
            value={analyticsPeriod}
            onValueChange={setAnalyticsPeriod}
            className="w-auto flex-shrink-0"
          >
            <TabsList className="grid w-full grid-cols-3 bg-orange-50">
              <TabsTrigger
                value="weekly"
                className="data-[state=active]:bg-orange-400 data-[state=active]:text-white text-xs sm:text-sm"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-orange-400 data-[state=active]:text-white text-xs sm:text-sm"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                className="data-[state=active]:bg-orange-400 data-[state=active]:text-white text-xs sm:text-sm"
              >
                Annual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-3">
          {/* Enhanced User Analytics */}
          <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <Users className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">User Growth ({analyticsPeriod})</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Total users and new registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="w-full min-h-0">
                <EnhancedUserGrowthChart
                  chartData={generateChartData(analyticsPeriod as 'weekly' | 'monthly' | 'annual')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Staff Role Analytics */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <Shield className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">User Distribution</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Breakdown by staff roles and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <StaffRoleAnalytics users={users} />
            </CardContent>
          </Card>

          {/* Enhanced Donation Analytics */}
          <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <DollarSign className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">Donation Analytics ({analyticsPeriod})</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Donation amounts and campaign performance over time
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="w-full min-h-0">
                <EnhancedDonationTrendsChart
                  chartData={generateChartData(analyticsPeriod as 'weekly' | 'monthly' | 'annual')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Pet Analytics */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <PawPrint className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">Pet Intake Analytics ({analyticsPeriod})</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Pet arrivals by type and breed breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <EnhancedPetAnalytics
                period={analyticsPeriod}
                chartData={generateChartData(analyticsPeriod as 'weekly' | 'monthly' | 'annual')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Adoptions */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
              <PawPrint className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <span className="truncate">Recent Adoption Applications</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Latest adoption requests and their current status
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {recentAdoptions.length > 0 ? (
              <div className="space-y-4">
                {recentAdoptions.map((adoption) => (
                  <div
                    key={adoption.id}
                    className="flex items-center justify-between space-x-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-orange-25 to-orange-50 border border-orange-100 min-w-0"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <Avatar className="ring-2 ring-orange-100 flex-shrink-0">
                        <AvatarImage
                          src={adoption.image || '/placeholder.svg'}
                          alt={adoption.petName}
                        />
                        <AvatarFallback className="bg-orange-50 text-orange-600">
                          {adoption.petName?.[0] ?? 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-none text-gray-900 truncate">
                          {adoption.petName} • {adoption.petType}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          Adopter: {adoption.adopter}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge
                        variant={adoption.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          adoption.status === 'completed'
                            ? 'bg-orange-50 text-orange-600 border-orange-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }
                      >
                        {adoption.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {adoption.timeAgo}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full border-orange-200 hover:bg-orange-25 text-orange-500 bg-transparent"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4 flex-shrink-0" />
                  View All Applications
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                  <PawPrint className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  No adoption applications yet
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Applications will appear here once users start applying for pets
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 hover:bg-orange-25 text-orange-500 bg-transparent"
                >
                  <ArrowUpRight className="mr-2 h-3 w-3 flex-shrink-0" />
                  View All Applications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
              <Activity className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <span className="truncate">Recent Activity</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Latest updates from your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            <RecentActivityComponent activities={recentActivity} />
          </CardContent>
        </Card>
      </div>

      {/* Donation Campaigns */}
      <Card
        id="pc-dash-campaigns"
        className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm"
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
            <DollarSign className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="truncate">Active Fundraising Campaigns</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Current donation drives and their progress
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {ongoingCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-25 to-orange-50"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-orange-500 truncate">
                          ₱{campaign.raised.toLocaleString()}
                        </span>
                        <span className="text-gray-600 truncate">
                          ₱{campaign.target.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(campaign.raised / campaign.target) * 100}
                        className="h-2 bg-orange-50"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="truncate">{campaign.supporters} supporters</span>
                        <span className="truncate">{campaign.daysLeft} days left</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-25 text-orange-500 bg-transparent"
            >
              <ArrowUpRight className="mr-2 h-4 w-4 flex-shrink-0" />
              View All Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
