'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDashboardData, { type ChartDataPoint, type User } from '@/hooks/useDashboardData';
import {
  Activity,
  ArrowUpRight,
  CalendarIcon,
  Dog,
  DollarSign,
  Heart,
  Loader2,
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

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-orange-25/50 to-orange-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
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
          <Popover open={pickerOpen} onOpenChange={(open) => setPickerOpen(open)}>
            <PopoverTrigger asChild>
              <Button
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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
              Enhanced Analytics
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comprehensive insights with weekly, monthly, and annual breakdowns
            </p>
          </div>
          <Tabs
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
                <span className="truncate">
                  User Growth & New Registrations ({analyticsPeriod})
                </span>
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
                <span className="truncate">Staff Role Distribution</span>
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
      <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
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
