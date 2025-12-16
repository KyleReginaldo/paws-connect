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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDashboardData, { type ChartDataPoint, type User } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Activity,
  ArrowUpRight,
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
import Link from 'next/link';
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
      const filteredCampaigns = filterByDateRange(fundraisingCampaigns);

      // Use filtered data for calculations
      const reportPets = filteredPets.length > 0 ? filteredPets : pets;
      const reportAdoptions = filteredAdoptions.length > 0 ? filteredAdoptions : adoptions;
      const reportUsers = filteredUsers.length > 0 ? filteredUsers : allUsers;
      const reportDonations = filteredDonations.length > 0 ? filteredDonations : donations;
      const reportCampaigns =
        filteredCampaigns.length > 0 ? filteredCampaigns : fundraisingCampaigns;

      // Create PDF document
      const doc = new jsPDF();

      // Define colors - Black and White
      const primaryColor: [number, number, number] = [0, 0, 0];
      const secondaryColor: [number, number, number] = [128, 128, 128];
      const textColor: [number, number, number] = [0, 0, 0];
      const lightBg: [number, number, number] = [245, 245, 245];

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
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PawsConnect Analytics Report', 20, 30);

      // Date range info
      const dateRangeText = selectedDateRange?.from
        ? `Period: ${format(selectedDateRange.from, 'MMM dd, yyyy')}${selectedDateRange.to ? ` - ${format(selectedDateRange.to, 'MMM dd, yyyy')}` : ''}`
        : 'Period: All Time';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(dateRangeText, 20, 40);

      // Thin divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 48, 190, 48);

      // Metrics grid
      const totalPets = reportPets.length;
      const totalUsers = reportUsers.length;
      const totalDonations = reportDonations.reduce(
        (sum: number, d: { amount?: number }) => sum + (d.amount || 0),
        0,
      );
      const totalAdoptions = reportAdoptions.length;

      // Metric boxes
      const metricY = 70;
      const metrics = [
        { label: 'TOTAL PETS', value: totalPets.toString() },
        { label: 'ADOPTIONS', value: totalAdoptions.toString() },
        { label: 'NEW USERS', value: totalUsers.toString() },
        { label: 'FUNDS RAISED', value: `${totalDonations.toLocaleString()}` },
      ];

      metrics.forEach((metric, index) => {
        const xPos = 20 + (index % 2) * 90;
        const yPos = metricY + Math.floor(index / 2) * 40;

        // Metric value
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(metric.value, xPos, yPos);

        // Metric label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(metric.label, xPos, yPos + 7);
      });

      // Footer with generation info
      const coverFooterY = 270;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, coverFooterY, 190, coverFooterY);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      const genDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const genTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`Generated on ${genDate} at ${genTime}`, 20, coverFooterY + 6);

      // ===========================================
      // PAGE 2: EXECUTIVE DASHBOARD
      // ===========================================
      doc.addPage();
      addPageHeader('Executive Dashboard', 2);

      const successfulAdoptions = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'APPROVED' || a.status === 'COMPLETED',
      ).length;
      const pendingAdoptions = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'PENDING',
      ).length;
      const adoptionRate =
        totalAdoptions > 0 ? ((successfulAdoptions / totalAdoptions) * 100).toFixed(1) : '0';
      const activeCampaigns = reportCampaigns.filter(
        (c: { status?: string }) => c.status === 'ONGOING',
      ).length;

      // Calculate available pets within date range (approved but not adopted)
      const allAvailablePets = reportPets.filter(
        (p: { request_status?: string }) => p.request_status === 'approved',
      ).length;

      // Calculate adopted pets in the date range by checking adoption records
      const adoptedPetsInRange = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'APPROVED' || a.status === 'COMPLETED',
      ).length;

      // Calculate verified users in date range
      const verifiedUsersInRange = reportUsers.filter(
        (u: { status?: string }) => u.status === 'FULLY_VERIFIED',
      ).length;

      const executiveSummary = [
        ['Metric', 'Value', 'Status'],
        [
          'Total Pets',
          totalPets.toString(),
          allAvailablePets + ' Available',
          'adoption-application',
        ],
        [
          'Adoption Applications',
          totalAdoptions.toString(),
          pendingAdoptions + ' Pending',
          'adoption-application',
        ],
        ['Adopted Pets', adoptedPetsInRange.toString(), adoptionRate + '% Success Rate'],
        [
          'Total Registered Users',
          totalUsers.toString(),
          verifiedUsersInRange + ' Verified',
          'user-growth',
        ],
        ['Active Campaigns', activeCampaigns.toString(), reportCampaigns.length + ' Total'],
        [
          'Total Funds Raised',
          totalDonations.toLocaleString(),
          reportDonations.length + ' Donations',
        ],
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
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 10,
          textColor: textColor,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: lightBg,
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, fontSize: 9 },
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
      doc.text('Adopted in Range', 165, 53, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(totalPets.toString(), 42.5, 65, { align: 'center' });
      doc.text(allAvailablePets.toString(), 102.5, 65, { align: 'center' });
      doc.text(adoptedPetsInRange.toString(), 165, 65, { align: 'center' });

      // Pet breakdown by type (from reportPets)
      const dogs = reportPets.filter(
        (p: { type?: string }) => p.type?.toLowerCase() === 'dog',
      ).length;
      const cats = reportPets.filter(
        (p: { type?: string }) => p.type?.toLowerCase() === 'cat',
      ).length;
      const others = reportPets.filter(
        (p: { type?: string }) => p.type && !['dog', 'cat'].includes(p.type.toLowerCase()),
      ).length;

      const petBreakdown = [
        ['Category', 'Count', 'Percentage'],
        [
          'Dogs',
          dogs.toString(),
          totalPets > 0 ? ((dogs / totalPets) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Cats',
          cats.toString(),
          totalPets > 0 ? ((cats / totalPets) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Others',
          others.toString(),
          totalPets > 0 ? ((others / totalPets) * 100).toFixed(1) + '%' : '0%',
        ],
      ];

      autoTable(doc, {
        head: [petBreakdown[0]],
        body: petBreakdown.slice(1),
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 10, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 60, fontStyle: 'bold' },
          2: { cellWidth: 60 },
        },
        margin: { left: 15, right: 15 },
      });

      // Pet by size (from reportPets)
      const petBySize = [
        ['Size', 'Count', 'Status Distribution'],
        [
          'Small',
          reportPets.filter((p: { size?: string }) => p.size === 'small').length.toString(),
          reportPets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'small' && p.request_status === 'approved',
          ).length + ' approved',
        ],
        [
          'Medium',
          reportPets.filter((p: { size?: string }) => p.size === 'medium').length.toString(),
          reportPets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'medium' && p.request_status === 'approved',
          ).length + ' approved',
        ],
        [
          'Large',
          reportPets.filter((p: { size?: string }) => p.size === 'large').length.toString(),
          reportPets.filter(
            (p: { size?: string; request_status?: string }) =>
              p.size === 'large' && p.request_status === 'approved',
          ).length + ' approved',
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
          halign: 'center',
        },
        bodyStyles: { fontSize: 9, halign: 'center' },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 40 },
          2: { cellWidth: 90, fontSize: 8 },
        },
        margin: { left: 15, right: 15 },
      });

      // Health status summary (from reportPets)
      const vaccinated = reportPets.filter(
        (p: { is_vaccinated?: boolean }) => p.is_vaccinated,
      ).length;
      const spayedNeutered = reportPets.filter(
        (p: { is_spayed_or_neutured?: boolean }) => p.is_spayed_or_neutured,
      ).length;

      const healthData = [
        ['Health Metric', 'Count', 'Percentage'],
        [
          'Vaccinated Pets',
          vaccinated.toString(),
          totalPets > 0 ? ((vaccinated / totalPets) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Spayed/Neutered',
          spayedNeutered.toString(),
          totalPets > 0 ? ((spayedNeutered / totalPets) * 100).toFixed(1) + '%' : '0%',
        ],
      ];

      autoTable(doc, {
        head: [healthData[0]],
        body: healthData.slice(1),
        startY:
          (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 9, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 60 },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 4: ADOPTION ANALYTICS
      // ===========================================
      doc.addPage();
      addPageHeader('Adoption Analytics', 4);

      // Adoption status breakdown (from reportAdoptions)
      const approvedAdoptionsInRange = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'APPROVED',
      ).length;
      const completedAdoptionsInRange = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'COMPLETED',
      ).length;
      const rejectedAdoptionsInRange = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'REJECTED',
      ).length;
      const pendingAdoptionsInRange = reportAdoptions.filter(
        (a: { status?: string }) => a.status === 'PENDING',
      ).length;

      const adoptionStatus = [
        ['Status', 'Count', 'Percentage'],
        [
          'Approved',
          approvedAdoptionsInRange.toString(),
          totalAdoptions > 0
            ? ((approvedAdoptionsInRange / totalAdoptions) * 100).toFixed(1) + '%'
            : '0%',
        ],
        [
          'Completed',
          completedAdoptionsInRange.toString(),
          totalAdoptions > 0
            ? ((completedAdoptionsInRange / totalAdoptions) * 100).toFixed(1) + '%'
            : '0%',
        ],
        [
          'Pending',
          pendingAdoptionsInRange.toString(),
          totalAdoptions > 0
            ? ((pendingAdoptionsInRange / totalAdoptions) * 100).toFixed(1) + '%'
            : '0%',
        ],
        [
          'Rejected',
          rejectedAdoptionsInRange.toString(),
          totalAdoptions > 0
            ? ((rejectedAdoptionsInRange / totalAdoptions) * 100).toFixed(1) + '%'
            : '0%',
        ],
        ['Total Applications', totalAdoptions.toString(), '100%'],
      ];

      autoTable(doc, {
        head: [adoptionStatus[0]],
        body: adoptionStatus.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 10, halign: 'center' },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60 },
        },
        margin: { left: 15, right: 15 },
      });

      // Recent adoptions table (from reportAdoptions)
      const recentAdoptions = reportAdoptions
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
          halign: 'center',
        },
        bodyStyles: { fontSize: 8, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
          5: { cellWidth: 30, fontSize: 7 },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 5: FUNDRAISING & DONATIONS
      // ===========================================
      doc.addPage();
      addPageHeader('Fundraising & Donations Analytics', 5);

      // Campaign summary (using reportCampaigns and reportDonations)
      const completedCampaigns = reportCampaigns.filter(
        (c: { status?: string }) => c.status === 'COMPLETED',
      ).length;
      const pendingCampaigns = reportCampaigns.filter(
        (c: { status?: string }) => c.status === 'PENDING',
      ).length;
      const totalTarget = reportCampaigns.reduce(
        (sum: number, c: { target_amount?: number }) => sum + (c.target_amount || 0),
        0,
      );
      const totalRaised = reportCampaigns.reduce(
        (sum: number, c: { raised_amount?: number }) => sum + (c.raised_amount || 0),
        0,
      );
      const overallProgress =
        totalTarget > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : '0';

      const campaignSummary = [
        ['Metric', 'Value', 'Details'],
        ['Total Campaigns', reportCampaigns.length.toString(), activeCampaigns + ' Active'],
        ['Completed Campaigns', completedCampaigns.toString(), pendingCampaigns + ' Pending'],
        ['Total Target Amount', totalTarget.toLocaleString(), 'Combined goal'],
        ['Total Raised', totalRaised.toLocaleString(), overallProgress + '% of target'],
        [
          'Total Donations',
          reportDonations.length.toString(),
          'From ' +
            new Set(reportDonations.map((d: { donor?: number }) => d.donor)).size +
            ' donors',
          'donation-analytics',
        ],
        [
          'Average Donation',
          reportDonations.length > 0 ? (totalRaised / reportDonations.length).toFixed(2) : '0',
          'Per transaction',
        ],
      ];

      autoTable(doc, {
        head: [campaignSummary[0]],
        body: campaignSummary.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 9, halign: 'center' },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60, fontSize: 8 },
        },
        margin: { left: 15, right: 15 },
      });

      // Top campaigns (using reportCampaigns)
      const topCampaigns = reportCampaigns
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
          const donationCount = reportDonations.filter(
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
          halign: 'center',
        },
        bodyStyles: { fontSize: 7, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 60 },
          2: { cellWidth: 22, fontSize: 6 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
        },
        margin: { left: 15, right: 15 },
      });

      // ===========================================
      // PAGE 6: USER ANALYTICS
      // ===========================================
      doc.addPage();
      addPageHeader('User Analytics', 6);

      // User status breakdown (using reportUsers)
      const fullyVerified = reportUsers.filter(
        (u: { status?: string }) => u.status === 'FULLY_VERIFIED',
      ).length;
      const semiVerified = reportUsers.filter(
        (u: { status?: string }) => u.status === 'SEMI_VERIFIED',
      ).length;
      const pendingUsersInRange = reportUsers.filter(
        (u: { status?: string }) => u.status === 'PENDING',
      ).length;
      const admins = reportUsers.filter((u: { role?: number }) => u.role === 1).length;
      const customers = reportUsers.filter((u: { role?: number }) => u.role === 3).length;

      const userStats = [
        ['Category', 'Count', 'Percentage'],
        ['Total Users', totalUsers.toString(), '100%'],
        [
          'Fully Verified',
          fullyVerified.toString(),
          totalUsers > 0 ? ((fullyVerified / totalUsers) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Semi Verified',
          semiVerified.toString(),
          totalUsers > 0 ? ((semiVerified / totalUsers) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Pending Verification',
          pendingUsersInRange.toString(),
          totalUsers > 0 ? ((pendingUsersInRange / totalUsers) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Administrators',
          admins.toString(),
          totalUsers > 0 ? ((admins / totalUsers) * 100).toFixed(1) + '%' : '0%',
        ],
        [
          'Regular Users',
          customers.toString(),
          totalUsers > 0 ? ((customers / totalUsers) * 100).toFixed(1) + '%' : '0%',
        ],
      ];

      autoTable(doc, {
        head: [userStats[0]],
        body: userStats.slice(1),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 10, halign: 'center' },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 40, fontStyle: 'bold', textColor: primaryColor },
          2: { cellWidth: 60 },
        },
        margin: { left: 15, right: 15 },
      });

      // Recent users in date range (using reportUsers)
      const recentUsers = reportUsers
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
          halign: 'center',
        },
        bodyStyles: { fontSize: 7, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 35 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, fontSize: 6 },
          5: { cellWidth: 20 },
        },
        margin: { left: 15, right: 15 },
      });

      // Report footer on Page 6
      const footerY =
        (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(15, footerY, 195, footerY);

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('PawsConnect Dashboard System', 15, footerY + 8);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        15,
        footerY + 14,
      );

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `paws-connect-report-${timestamp}.pdf`;

      // Save the PDF file
      doc.save(filename);

      success(
        'Report Generated',
        `Report with ${doc.getNumberOfPages()} pages has been downloaded successfully`,
        6000,
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
      link: 'manage-pet',
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
      link: '#adoption-application',
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
      link: '#donation-analytics',
    },
    {
      title: 'All Users',
      value: String(filtered.users),
      changeType: 'positive' as const,
      icon: Users,
      description: dateRange?.from ? 'Registered in period' : 'Total registered users',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
      link: '#user-growth',
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
      <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-2">
        <div className="flex flex-row sm:flex-col items-start space-x-2 flex-shrink-0">
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
          <Link href={stat.link}>
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
          </Link>
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
          <Card
            id="user-growth"
            className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm"
          >
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
          <Card
            id="donation-analytics"
            className="lg:col-span-4 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm"
          >
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
        <Card
          id="adoption-application"
          className="col-span-1 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm"
        >
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
        <DialogContent className="sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Select a date range for the report, or leave blank to include all data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  defaultMonth={reportDateRange?.from}
                  selected={reportDateRange}
                  onSelect={(range) => setReportDateRange(range as DateRange | undefined)}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                  toDate={new Date()}
                  className="rounded-md border"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-4">
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
