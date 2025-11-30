'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notification';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDashboardData, { type ChartDataPoint, type User } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Activity,
  ArrowUpRight,
  CalendarIcon,
  Dog,
  FileText,
  Heart,
  PawPrint,
  PhilippinePeso,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface DateRange {
  from: Date;
  to?: Date;
}
// Charts
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardSkeleton } from '@/components/ui/skeleton-patterns';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';

const chartConfig: ChartConfig = {
  users: { label: 'Users', color: '#FFA726' },
  donations: { label: 'Donations', color: '#FFB74D' },
  pets: { label: 'Pets', color: '#FFA726' },
  dogs: { label: 'Dogs', color: '#FFA726' },
  cats: { label: 'Cats', color: '#FFB74D' },
};

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

function UserRoleAnalytics({ users }: { users: User[] }) {
  const roleData = [
    {
      role: 'Admin',
      count: users.filter((u) => u.role === 1).length,
      color: '#FFA726',
      icon: Shield,
      responsibilities: 'System management, user oversight',
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
      {roleData.map((item, index) => (
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
              <PhilippinePeso className="h-4 w-4 text-orange-500" />
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
    adoptions,
    loading,
    error,
    stats,
    generateChartData,
    generateRecentActivity,
    generateRecentAdoptions,
    refetch,
  } = useDashboardData();

  const { success, error: showError, info } = useNotifications();
  const [dateRange] = useState<DateRange | undefined>(undefined);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  // const [dateRange, setDateRange] = useState<DateRange | undefined>({
  //   from: new Date(2025, 5, 12),
  //   to: new Date(2025, 6, 15),
  // });

  const handleGenerateReport = async (selectedDateRange?: DateRange) => {
    try {
      setReportModalOpen(false);
      info('Generating Report', 'Preparing comprehensive dashboard report PDF...');

      // Fetch all necessary data
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

      // Filter data by date range if provided
      const filterByDateRange = <T extends Record<string, unknown>>(
        data: T[],
        dateField: string = 'created_at',
      ): T[] => {
        if (!selectedDateRange?.from) return data;
        return data.filter((item) => {
          const itemDate = new Date(item[dateField] as string);
          const from = new Date(selectedDateRange.from!);
          from.setHours(0, 0, 0, 0);
          if (!selectedDateRange.to) {
            const to = new Date(from);
            to.setHours(23, 59, 59, 999);
            return itemDate >= from && itemDate <= to;
          }
          const to = new Date(selectedDateRange.to);
          to.setHours(23, 59, 59, 999);
          return itemDate >= from && itemDate <= to;
        });
      };

      const filteredPets = filterByDateRange(pets);
      const filteredAdoptions = filterByDateRange(adoptions);
      const filteredUsers = filterByDateRange(allUsers);
      const filteredDonations = filterByDateRange(donations);

      // Use filtered data for calculations
      const reportPets = filteredPets.length > 0 ? filteredPets : pets;
      const reportAdoptions = filteredAdoptions.length > 0 ? filteredAdoptions : adoptions;
      const reportUsers = filteredUsers.length > 0 ? filteredUsers : allUsers;
      const reportDonations = filteredDonations.length > 0 ? filteredDonations : donations;

      // Create PDF document
      const doc = new jsPDF();

      // Define colors
      const primaryColor: [number, number, number] = [255, 167, 38];
      const secondaryColor: [number, number, number] = [255, 204, 128];
      const textColor: [number, number, number] = [51, 51, 51];
      const lightBg: [number, number, number] = [255, 250, 245];

      // Helper function to add page header
      const addPageHeader = (title: string, pageNum: number) => {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 105, 22, { align: 'center' });

        // Page number
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNum}`, 195, 290, { align: 'right' });
      };

      // ===========================================
      // PAGE 1: COVER PAGE
      // ===========================================
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 297, 'F');

      // Logo/Title section
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.text('PAWS CONNECT', 105, 100, { align: 'center' });

      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      const reportTitle = selectedDateRange?.from
        ? `Dashboard Analytics Report\n${format(selectedDateRange.from, 'MMM dd, yyyy')}${selectedDateRange.to ? ` - ${format(selectedDateRange.to, 'MMM dd, yyyy')}` : ''}`
        : 'Dashboard Analytics Report';
      doc.text(reportTitle, 105, 120, { align: 'center' });

      // Decorative line
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(55, 135, 155, 135);

      // Report details
      doc.setFontSize(14);
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        105,
        155,
        { align: 'center' },
      );

      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 105, 170, { align: 'center' });

      // Key metrics preview box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, 190, 150, 70, 3, 3, 'F');

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Summary', 105, 205, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const totalPets = reportPets.length;
      const totalUsers = reportUsers.length;
      const totalDonations = reportDonations.reduce(
        (sum: number, d: { amount?: number }) => sum + (d.amount || 0),
        0,
      );
      const totalAdoptions = reportAdoptions.length;

      doc.text(`Total Pets: ${totalPets}`, 40, 220);
      doc.text(`Total Users: ${totalUsers}`, 40, 230);
      doc.text(`Total Adoptions: ${totalAdoptions}`, 40, 240);
      doc.text(`Fundraising: ${totalDonations.toLocaleString()}`, 40, 250);

      // ===========================================
      // PAGE 2: EXECUTIVE DASHBOARD
      // ===========================================
      doc.addPage();
      addPageHeader('Executive Dashboard', 2);

      const successfulAdoptions = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'APPROVED' || a.status === 'COMPLETED',
      ).length;
      const pendingAdoptions = adoptions.filter(
        (a: { status?: string }) => a.status === 'PENDING',
      ).length;
      const adoptionRate =
        adoptions.length > 0 ? ((successfulAdoptions / adoptions.length) * 100).toFixed(1) : '0';
      const activeCampaigns = fundraisingCampaigns.filter(
        (c: { status?: string }) => c.status === 'ONGOING',
      ).length;
      const availablePets = pets.filter(
        (p: { request_status?: string }) => p.request_status === 'approved',
      ).length;

      const executiveSummary = [
        ['Metric', 'Value', 'Status'],
        ['Total Pets in System', totalPets.toString(), availablePets + ' Available'],
        ['Total Adoption Applications', totalAdoptions.toString(), pendingAdoptions + ' Pending'],
        ['Successful Adoptions', successfulAdoptions.toString(), adoptionRate + '% Success Rate'],
        [
          'Total Registered Users',
          totalUsers.toString(),
          allUsers.filter((u: { status?: string }) => u.status === 'FULLY_VERIFIED').length +
            ' Verified',
        ],
        ['Active Campaigns', activeCampaigns.toString(), fundraisingCampaigns.length + ' Total'],
        ['Total Funds Raised', totalDonations.toLocaleString(), donations.length + ' Donations'],
      ];

      autoTable(doc, {
        head: [executiveSummary[0]],
        body: executiveSummary.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 10,
          textColor: textColor,
        },
        alternateRowStyles: {
          fillColor: lightBg,
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center', fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, halign: 'right', fontSize: 9 },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 3: PET ANALYTICS DETAILED
      // ===========================================
      doc.addPage();
      addPageHeader('Pet Management Analytics', 3);

      // Summary boxes
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.roundedRect(15, 45, 55, 25, 2, 2, 'F');
      doc.roundedRect(75, 45, 55, 25, 2, 2, 'F');
      doc.roundedRect(135, 45, 60, 25, 2, 2, 'F');

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Pets', 42.5, 53, { align: 'center' });
      doc.text('Available', 102.5, 53, { align: 'center' });
      doc.text('Adopted', 165, 53, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(totalPets.toString(), 42.5, 65, { align: 'center' });
      doc.text(availablePets.toString(), 102.5, 65, { align: 'center' });
      doc.text(
        pets
          .filter((p: { request_status?: string }) => p.request_status === 'adopted')
          .length.toString(),
        165,
        65,
        { align: 'center' },
      );

      // Pet breakdown by type
      const dogs = pets.filter((p: { type?: string }) => p.type?.toLowerCase() === 'dog').length;
      const cats = pets.filter((p: { type?: string }) => p.type?.toLowerCase() === 'cat').length;
      const others = pets.filter(
        (p: { type?: string }) => p.type && !['dog', 'cat'].includes(p.type.toLowerCase()),
      ).length;

      const petBreakdown = [
        ['Category', 'Count', 'Percentage'],
        ['Dogs', dogs.toString(), ((dogs / totalPets) * 100).toFixed(1) + '%'],
        ['Cats', cats.toString(), ((cats / totalPets) * 100).toFixed(1) + '%'],
        ['Others', others.toString(), ((others / totalPets) * 100).toFixed(1) + '%'],
      ];

      autoTable(doc, {
        head: [petBreakdown[0]],
        body: petBreakdown.slice(1),
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 60, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // Pet by size
      const petBySize = [
        ['Size', 'Count', 'Status Distribution'],
        [
          'Small',
          pets.filter((p: { size?: string }) => p.size === 'small').length.toString(),
          pets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'small' && p.request_status === 'approved',
          ).length + ' available',
        ],
        [
          'Medium',
          pets.filter((p: { size?: string }) => p.size === 'medium').length.toString(),
          pets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'medium' && p.request_status === 'approved',
          ).length + ' available',
        ],
        [
          'Large',
          pets.filter((p: { size?: string }) => p.size === 'large').length.toString(),
          pets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'large' && p.request_status === 'approved',
          ).length + ' available',
        ],
      ];

      autoTable(doc, {
        head: [petBySize[0]],
        body: petBySize.slice(1),
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
        theme: 'striped',
        headStyles: {
          fillColor: secondaryColor,
          textColor: textColor,
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 90, halign: 'right', fontSize: 8 },
        },
        margin: { left: 15, right: 15 },
      });

      // Health status summary
      const vaccinated = pets.filter((p: { is_vaccinated?: boolean }) => p.is_vaccinated).length;
      const spayedNeutered = pets.filter(
        (p: { is_spayed_or_neutured?: boolean }) => p.is_spayed_or_neutured,
      ).length;

      const healthData = [
        ['Health Metric', 'Count', 'Percentage'],
        [
          'Vaccinated Pets',
          vaccinated.toString(),
          ((vaccinated / totalPets) * 100).toFixed(1) + '%',
        ],
        [
          'Spayed/Neutered',
          spayedNeutered.toString(),
          ((spayedNeutered / totalPets) * 100).toFixed(1) + '%',
        ],
      ];

      autoTable(doc, {
        head: [healthData[0]],
        body: healthData.slice(1),
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 60, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 4: ADOPTION ANALYTICS
      // ===========================================
      doc.addPage();
      addPageHeader('Adoption Analytics', 4);

      // Adoption status breakdown
      const approvedAdoptions = adoptions.filter(
        (a: { status?: string }) => a.status === 'APPROVED',
      ).length;
      const completedAdoptions = adoptions.filter(
        (a: { status?: string }) => a.status === 'COMPLETED',
      ).length;
      const rejectedAdoptions = adoptions.filter(
        (a: { status?: string }) => a.status === 'REJECTED',
      ).length;

      const adoptionStatus = [
        ['Status', 'Count', 'Percentage'],
        [
          'Approved',
          approvedAdoptions.toString(),
          ((approvedAdoptions / totalAdoptions) * 100).toFixed(1) + '%',
        ],
        [
          'Completed',
          completedAdoptions.toString(),
          ((completedAdoptions / totalAdoptions) * 100).toFixed(1) + '%',
        ],
        [
          'Pending',
          pendingAdoptions.toString(),
          ((pendingAdoptions / totalAdoptions) * 100).toFixed(1) + '%',
        ],
        [
          'Rejected',
          rejectedAdoptions.toString(),
          ((rejectedAdoptions / totalAdoptions) * 100).toFixed(1) + '%',
        ],
        ['Total Applications', totalAdoptions.toString(), '100%'],
      ];

      autoTable(doc, {
        head: [adoptionStatus[0]],
        body: adoptionStatus.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center', fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // Recent adoptions table
      const recentAdoptions = adoptions
        .sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime(),
        )
        .slice(0, 15);

      const adoptionDetails = recentAdoptions.map(
        (a: {
          id?: number;
          created_at?: string;
          status?: string;
          pets?: { name?: string; type?: string };
          users?: { username?: string };
        }) => [
          a.id?.toString() || 'N/A',
          new Date(a.created_at || '').toLocaleDateString(),
          (a.pets?.name || 'Unknown').substring(0, 15),
          a.pets?.type || 'N/A',
          (a.users?.username || 'Unknown').substring(0, 20),
          a.status || 'N/A',
        ],
      );

      autoTable(doc, {
        head: [['ID', 'Date', 'Pet Name', 'Type', 'Adopter', 'Status']],
        body: adoptionDetails,
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15,
        theme: 'grid',
        headStyles: {
          fillColor: secondaryColor,
          textColor: textColor,
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
          5: { cellWidth: 30, halign: 'center', fontSize: 7 },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 5: FUNDRAISING & DONATIONS
      // ===========================================
      doc.addPage();
      addPageHeader('Fundraising & Donations Analytics', 5);

      // Campaign summary
      const completedCampaigns = fundraisingCampaigns.filter(
        (c: { status?: string }) => c.status === 'COMPLETED',
      ).length;
      const pendingCampaigns = fundraisingCampaigns.filter(
        (c: { status?: string }) => c.status === 'PENDING',
      ).length;
      const totalTarget = fundraisingCampaigns.reduce(
        (sum: number, c: { target_amount?: number }) => sum + (c.target_amount || 0),
        0,
      );
      const totalRaised = fundraisingCampaigns.reduce(
        (sum: number, c: { raised_amount?: number }) => sum + (c.raised_amount || 0),
        0,
      );
      const overallProgress =
        totalTarget > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : '0';

      const campaignSummary = [
        ['Metric', 'Value', 'Details'],
        ['Total Campaigns', fundraisingCampaigns.length.toString(), activeCampaigns + ' Active'],
        ['Completed Campaigns', completedCampaigns.toString(), pendingCampaigns + ' Pending'],
        ['Total Target Amount', totalTarget.toLocaleString(), 'Combined goal'],
        ['Total Raised', totalRaised.toLocaleString(), overallProgress + '% of target'],
        [
          'Total Donations',
          donations.length.toString(),
          'From ' + new Set(donations.map((d: { donor?: number }) => d.donor)).size + ' donors',
        ],
        ['Average Donation', (totalRaised / donations.length).toFixed(2), 'Per transaction'],
      ];

      autoTable(doc, {
        head: [campaignSummary[0]],
        body: campaignSummary.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center', fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, halign: 'right', fontSize: 8 },
        },
        margin: { left: 15, right: 15 },
      });

      // Top campaigns
      const topCampaigns = fundraisingCampaigns
        .sort(
          (a: { raised_amount?: number }, b: { raised_amount?: number }) =>
            (b.raised_amount || 0) - (a.raised_amount || 0),
        )
        .slice(0, 10);

      const campaignDetails = topCampaigns.map(
        (c: {
          id?: number;
          title?: string;
          status?: string;
          target_amount?: number;
          raised_amount?: number;
        }) => {
          const progress = c.target_amount
            ? (((c.raised_amount || 0) / c.target_amount) * 100).toFixed(0)
            : '0';
          const donationCount = donations.filter(
            (d: { fundraising?: number }) => d.fundraising === c.id,
          ).length;
          return [
            c.id?.toString() || 'N/A',
            (c.title || 'Untitled').substring(0, 30) + ((c.title?.length || 0) > 30 ? '...' : ''),
            c.status || 'N/A',
            (c.target_amount || 0).toLocaleString(),
            (c.raised_amount || 0).toLocaleString(),
            progress + '%',
            donationCount.toString(),
          ];
        },
      );

      autoTable(doc, {
        head: [['ID', 'Campaign Title', 'Status', 'Target', 'Raised', 'Progress', 'Donors']],
        body: campaignDetails,
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15,
        theme: 'grid',
        headStyles: {
          fillColor: secondaryColor,
          textColor: textColor,
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 22, halign: 'center', fontSize: 6 },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 6: USER ANALYTICS
      // ===========================================
      doc.addPage();
      addPageHeader('User Analytics', 6);

      // User status breakdown
      const fullyVerified = allUsers.filter(
        (u: { status?: string }) => u.status === 'FULLY_VERIFIED',
      ).length;
      const semiVerified = allUsers.filter(
        (u: { status?: string }) => u.status === 'SEMI_VERIFIED',
      ).length;
      const pendingUsers = allUsers.filter(
        (u: { status?: string }) => u.status === 'PENDING',
      ).length;
      const admins = allUsers.filter((u: { role?: number }) => u.role === 1).length;
      const customers = allUsers.filter((u: { role?: number }) => u.role === 3).length;

      const userStats = [
        ['Category', 'Count', 'Percentage'],
        ['Total Users', totalUsers.toString(), '100%'],
        [
          'Fully Verified',
          fullyVerified.toString(),
          ((fullyVerified / totalUsers) * 100).toFixed(1) + '%',
        ],
        [
          'Semi Verified',
          semiVerified.toString(),
          ((semiVerified / totalUsers) * 100).toFixed(1) + '%',
        ],
        [
          'Pending Verification',
          pendingUsers.toString(),
          ((pendingUsers / totalUsers) * 100).toFixed(1) + '%',
        ],
        ['Administrators', admins.toString(), ((admins / totalUsers) * 100).toFixed(1) + '%'],
        ['Regular Users', customers.toString(), ((customers / totalUsers) * 100).toFixed(1) + '%'],
      ];

      autoTable(doc, {
        head: [userStats[0]],
        body: userStats.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'center', fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = allUsers
        .filter((u: { created_at?: string }) => new Date(u.created_at || '') >= thirtyDaysAgo)
        .sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime(),
        )
        .slice(0, 20);

      const userDetails = recentUsers.map(
        (u: {
          id?: number;
          username?: string;
          email?: string;
          created_at?: string;
          status?: string;
          role?: number;
        }) => [
          u.id?.toString() || 'N/A',
          (u.username || 'Unknown').substring(0, 25),
          (u.email || 'No email').substring(0, 30),
          new Date(u.created_at || '').toLocaleDateString(),
          u.status || 'N/A',
          u.role === 1 ? 'Admin' : 'User',
        ],
      );

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(
        'Recent User Registrations (Last 30 Days)',
        15,
        (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15,
      );

      autoTable(doc, {
        head: [['ID', 'Username', 'Email', 'Registered', 'Status', 'Role']],
        body: userDetails,
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: {
          fillColor: secondaryColor,
          textColor: textColor,
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: 'center', fontSize: 6 },
          5: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 7: REPORT SUMMARY & INSIGHTS
      // ===========================================
      doc.addPage();
      addPageHeader('Key Insights & Recommendations', 7);

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');

      // Key insights section
      let yPosition = 50;
      doc.text('Key Performance Indicators', 15, yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;

      const insights = [
        `• Pet Adoption Success Rate: ${adoptionRate}% (${successfulAdoptions} of ${totalAdoptions} applications)`,
        `• Average pets per type: Dogs (${dogs}), Cats (${cats}), Others (${others})`,
        `• Fundraising effectiveness: ${overallProgress}% of total target achieved`,
        `• User verification rate: ${((fullyVerified / totalUsers) * 100).toFixed(1)}% fully verified`,
        `• Average donation amount: ${(totalRaised / donations.length).toFixed(2)} per transaction`,
        `• Pet health compliance: ${((vaccinated / totalPets) * 100).toFixed(1)}% vaccinated, ${((spayedNeutered / totalPets) * 100).toFixed(1)}% spayed/neutered`,
      ];

      insights.forEach((insight) => {
        doc.text(insight, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 15, yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;

      const recommendations = [
        `• Focus on pending adoptions: ${pendingAdoptions} applications need review`,
        `• Promote campaigns: ${activeCampaigns} active campaigns could benefit from marketing`,
        `• Verify users: ${pendingUsers} users are waiting for verification`,
        `• Update pet health records: Ensure all ${totalPets} pets have current health information`,
        `• Engage donors: ${new Set(donations.map((d: { donor?: number }) => d.donor)).size} unique donors could be thanked personally`,
      ];

      recommendations.forEach((rec) => {
        const lines = doc.splitTextToSize(rec, 175);
        lines.forEach((line: string) => {
          doc.text(line, 20, yPosition);
          yPosition += 7;
        });
        yPosition += 3;
      });

      // Report footer
      yPosition += 20;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(15, yPosition, 180, 40, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Generated By:', 25, yPosition + 12);
      doc.setFont('helvetica', 'normal');
      doc.text('PAWS Connect Dashboard System', 25, yPosition + 20);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 25, yPosition + 28);
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 25, yPosition + 36);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `paws-connect-report-${timestamp}.pdf`;

      // Save the PDF file
      doc.save(filename);

      success(
        'Report Generated Successfully',
        `Comprehensive dashboard report with ${doc.internal.getNumberOfPages()} pages has been downloaded`,
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

  // Filter data based on date range
  const isDateInRange = (dateStr: string) => {
    if (!dateRange?.from) return true; // No filter, show all

    const date = new Date(dateStr);
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);

    if (!dateRange.to) {
      // Only from date, filter by that day
      const to = new Date(from);
      to.setHours(23, 59, 59, 999);
      return date >= from && date <= to;
    }

    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
  };

  // Get filtered data based on date range
  const getFilteredData = () => {
    const filteredPets = stats.totalPets; // Keep total pets count
    const filteredUsers = users.filter((u) => isDateInRange(u.created_at));
    const filteredCampaigns = campaigns.filter((c) => isDateInRange(c.created_at));
    const filteredAdoptions = adoptions.filter((a) => isDateInRange(a.created_at));

    return {
      pets: filteredPets,
      users: filteredUsers.length,
      campaigns: filteredCampaigns,
      adoptions: filteredAdoptions.length,
      donations: filteredCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0),
    };
  };

  const filtered = getFilteredData();

  // Dashboard stats with filtered data
  const dashboardStats = [
    {
      title: 'Total Pets',
      value: String(filtered.pets),
      changeType: 'positive' as const,
      icon: Dog,
      description: `${filtered.pets} total pets`,
      gradient: 'from-orange-200 to-orange-400',
      iconColor: 'text-white',
    },
    {
      title: 'Adoption Applications',
      value: String(filtered.adoptions),
      changeType: 'positive' as const,
      icon: Heart,
      description: dateRange?.from
        ? `${filtered.adoptions} applications in period`
        : `${filtered.adoptions} total applications`,
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Total Donations',
      value: `₱${filtered.donations.toLocaleString()}`,
      changeType: 'positive' as const,
      icon: PhilippinePeso,
      description: dateRange?.from
        ? `From ${filtered.campaigns.length} campaigns in period`
        : `From ${filtered.campaigns.length} total campaigns`,
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'New Users',
      value: String(filtered.users),
      changeType: 'positive' as const,
      icon: Users,
      description: dateRange?.from ? 'Registered in period' : 'Total registered users',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
  ];

  const recentAdoptions = generateRecentAdoptions();
  const recentActivity = generateRecentActivity();
  const ongoingCampaigns = campaigns
    .filter((c) => c.status === 'ONGOING' || c.status === 'PENDING')
    .filter((c) => isDateInRange(c.created_at)) // Apply date filter
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
      supporters: new Set(c.all_donations?.map((d) => d.donor)).size || 0,
    }));

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-orange-25/50 to-orange-50/50 min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-2">
        <div className="flex flex-row sm:flex-col items-center space-x-2 flex-shrink-0">
          <Button
            id="pc-dash-generate-report"
            onClick={() => setReportModalOpen(true)}
            variant="default"
            size="sm"
            className="cursor-pointer gap-2 hover:bg-orange-600 bg-orange-500 text-white rounded-full"
          >
            <FileText className="h-4 w-4 text-white" />
            Generate Report
          </Button>
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
              <CardTitle
                className={`text-sm font-medium ${index === 0 ? 'text-gray-900' : 'text-gray-700'} truncate pr-2`}
              >
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.iconColor} flex-shrink-0`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {stat.value}
              </div>
              <div className="flex items-center text-xs mt-2">
                <span className="text-gray-600 truncate">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">Analytics</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
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
                <span className="truncate">User Growth </span>
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

          {/* User Role Analytics */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <Shield className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">User Distribution</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Breakdown by user roles and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <UserRoleAnalytics users={users} />
            </CardContent>
          </Card>

          {/* Enhanced Donation Analytics */}
          <Card className="lg:col-span-4 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <PhilippinePeso className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">Donation Analytics </span>
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
                        variant={
                          adoption.status === 'approved' || adoption.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          adoption.status === 'approved' || adoption.status === 'completed'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : adoption.status === 'rejected' || adoption.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                        }
                      >
                        {adoption.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {adoption.timeAgo}
                      </span>
                    </div>
                  </div>
                ))}
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
            <CardTitle className="flex items-center gap-2 text-gray-900 text-sm sm:text-base">
              <Activity className="h-4 w-4 text-orange-500 flex-shrink-0" />
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
            <PhilippinePeso className="h-5 w-5 text-orange-500 flex-shrink-0" />
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
                className="border-l-4 border-l-orange-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-25 to-white"
              >
                <CardContent className="p-2 sm:p-6">
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
        </CardContent>
      </Card>

      {/* Report Date Range Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Select a date range for the report, or leave blank to include all data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium mb-1">Date Range (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDateRange?.from ? (
                      reportDateRange.to ? (
                        <>
                          {format(reportDateRange.from, 'LLL dd, y')} -{' '}
                          {format(reportDateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(reportDateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={reportDateRange?.from}
                    selected={reportDateRange}
                    onSelect={(range) => setReportDateRange(range as DateRange | undefined)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {reportDateRange?.from && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setReportDateRange(undefined)}
                  className="w-full"
                >
                  Clear date range
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleGenerateReport(reportDateRange)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
