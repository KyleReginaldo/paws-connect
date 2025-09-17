'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  ArrowUpRight,
  CalendarIcon,
  Dog,
  DollarSign,
  Heart,
  PawPrint,
  Shield,
  TrendingUp,
  User,
  UserCheck,
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

const mockPets = [
  {
    id: 1,
    name: 'Buddy',
    type: 'Dog',
    request_status: 'available',
    breed: 'Aspin',
    date_added: '2024-01-15',
  },
  {
    id: 2,
    name: 'Whiskers',
    type: 'Cat',
    request_status: 'adopted',
    breed: 'Persian',
    date_added: '2024-01-20',
  },
  {
    id: 3,
    name: 'Max',
    type: 'Dog',
    request_status: 'pending',
    breed: 'Aspin',
    date_added: '2024-02-01',
  },
  {
    id: 4,
    name: 'Luna',
    type: 'Cat',
    request_status: 'medical',
    breed: 'Siamese',
    date_added: '2024-02-10',
  },
  {
    id: 5,
    name: 'Charlie',
    type: 'Dog',
    request_status: 'available',
    breed: 'Aspin',
    date_added: '2024-02-15',
  },
  {
    id: 6,
    name: 'Bella',
    type: 'Dog',
    request_status: 'adopted',
    breed: 'Aspin',
    date_added: '2024-03-01',
  },
  {
    id: 7,
    name: 'Milo',
    type: 'Cat',
    request_status: 'available',
    breed: 'Maine Coon',
    date_added: '2024-03-05',
  },
  {
    id: 8,
    name: 'Rocky',
    type: 'Dog',
    request_status: 'adopted',
    breed: 'Aspin',
    date_added: '2024-03-10',
  },
];

const mockUsers = [
  { id: 1, name: 'John Doe', role: 'admin', date_joined: '2024-01-01' },
  { id: 2, name: 'Jane Smith', role: 'staff', date_joined: '2024-01-15' },
  { id: 3, name: 'Bob Johnson', role: 'user', date_joined: '2024-02-01' },
  { id: 4, name: 'Alice Brown', role: 'user', date_joined: '2024-02-15' },
  { id: 5, name: 'Dr. Wilson', role: 'staff', date_joined: '2024-03-01' },
  { id: 6, name: 'Sarah Connor', role: 'staff', date_joined: '2024-03-10' },
];

const mockCampaigns = [
  {
    id: 1,
    title: 'Emergency Medical Fund',
    description: 'Help cover medical expenses for rescued pets',
    target_amount: 50000,
    raised_amount: 32000,
  },
  {
    id: 2,
    title: 'New Shelter Construction',
    description: 'Building a new facility to house more animals',
    target_amount: 200000,
    raised_amount: 85000,
  },
  {
    id: 3,
    title: 'Food & Supplies Drive',
    description: 'Monthly food and supply needs for all animals',
    target_amount: 25000,
    raised_amount: 18500,
  },
];

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

function EnhancedUserGrowthChart({ period }: { period: string }) {
  const weeklyData = [
    { period: 'Week 1', users: 3, newUsers: 3 },
    { period: 'Week 2', users: 5, newUsers: 2 },
    { period: 'Week 3', users: 8, newUsers: 3 },
    { period: 'Week 4', users: 12, newUsers: 4 },
  ];

  const monthlyData = [
    { period: 'Jan', users: 12, newUsers: 12 },
    { period: 'Feb', users: 19, newUsers: 7 },
    { period: 'Mar', users: 24, newUsers: 5 },
    { period: 'Apr', users: 31, newUsers: 7 },
    { period: 'May', users: 42, newUsers: 11 },
    { period: 'Jun', users: 56, newUsers: 14 },
  ];

  const annualData = [
    { period: '2022', users: 145, newUsers: 145 },
    { period: '2023', users: 298, newUsers: 153 },
    { period: '2024', users: 456, newUsers: 158 },
  ];

  const data = period === 'weekly' ? weeklyData : period === 'monthly' ? monthlyData : annualData;

  return (
    <div className="w-full overflow-hidden">
      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
        <AreaChart data={data}>
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

function EnhancedDonationTrendsChart({ period }: { period: string }) {
  const weeklyData = [
    { period: 'Week 1', donations: 1200, campaigns: 2 },
    { period: 'Week 2', donations: 2400, campaigns: 3 },
    { period: 'Week 3', donations: 1800, campaigns: 2 },
    { period: 'Week 4', donations: 3200, campaigns: 4 },
  ];

  const monthlyData = [
    { period: 'Jan', donations: 2400, campaigns: 3 },
    { period: 'Feb', donations: 1398, campaigns: 2 },
    { period: 'Mar', donations: 9800, campaigns: 5 },
    { period: 'Apr', donations: 3908, campaigns: 4 },
    { period: 'May', donations: 4800, campaigns: 3 },
    { period: 'Jun', donations: 3800, campaigns: 4 },
  ];

  const annualData = [
    { period: '2022', donations: 45000, campaigns: 12 },
    { period: '2023', donations: 67000, campaigns: 18 },
    { period: '2024', donations: 89000, campaigns: 24 },
  ];

  const data = period === 'weekly' ? weeklyData : period === 'monthly' ? monthlyData : annualData;

  return (
    <div className="w-full overflow-hidden">
      <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
        <BarChart data={data}>
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

function EnhancedPetAnalytics({ period }: { period: string; pets: typeof mockPets }) {
  const weeklyData = [
    { period: 'Week 1', dogs: 2, cats: 1, total: 3 },
    { period: 'Week 2', dogs: 1, cats: 2, total: 3 },
    { period: 'Week 3', dogs: 3, cats: 1, total: 4 },
    { period: 'Week 4', dogs: 2, cats: 2, total: 4 },
  ];

  const monthlyData = [
    { period: 'Jan', dogs: 2, cats: 0, total: 2 },
    { period: 'Feb', dogs: 2, cats: 1, total: 3 },
    { period: 'Mar', dogs: 2, cats: 1, total: 3 },
    { period: 'Apr', dogs: 0, cats: 0, total: 0 },
    { period: 'May', dogs: 0, cats: 0, total: 0 },
    { period: 'Jun', dogs: 0, cats: 0, total: 0 },
  ];

  const annualData = [
    { period: '2022', dogs: 45, cats: 32, total: 77 },
    { period: '2023', dogs: 67, cats: 43, total: 110 },
    { period: '2024', dogs: 5, cats: 3, total: 8 },
  ];

  const data = period === 'weekly' ? weeklyData : period === 'monthly' ? monthlyData : annualData;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      <div className="w-full overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
          <AreaChart data={data}>
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

function ActivityChart() {
  const activityData = [
    { day: 'Mon', total: 24 },
    { day: 'Tue', total: 23 },
    { day: 'Wed', total: 27 },
    { day: 'Thu', total: 32 },
    { day: 'Fri', total: 33 },
    { day: 'Sat', total: 57 },
    { day: 'Sun', total: 48 },
  ];

  return (
    <div className="w-full overflow-hidden">
      <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
        <BarChart data={activityData}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFCC80" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#FFCC80" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'hsl(var(--muted)/10)' }}
          />
          <Bar dataKey="total" fill="url(#activityGradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function StaffRoleAnalytics({ users }: { users: typeof mockUsers }) {
  const staffData = [
    {
      role: 'Admin',
      count: users.filter((u) => u.role === 'admin').length,
      color: '#FFA726',
      icon: Shield,
      responsibilities: 'System management, user oversight',
    },
    {
      role: 'Staff',
      count: users.filter((u) => u.role === 'staff').length,
      color: '#FFB74D',
      icon: UserCheck,
      responsibilities: 'Pet care, adoption coordination',
    },
    {
      role: 'Users',
      count: users.filter((u) => u.role === 'user').length,
      color: '#FFCC80',
      icon: User,
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

function RecentActivity() {
  const items = [
    {
      id: '1',
      type: 'adoption' as const,
      title: 'Adoption completed',
      subtitle: 'Buddy - Aspin',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'donation' as const,
      title: 'New donation received',
      subtitle: '₱5,000 — For medical expenses',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'user' as const,
      title: 'New user registered',
      subtitle: 'alex.martinez@email.com',
      time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'adoption' as const,
      title: 'Adoption application',
      subtitle: 'Luna - Mixed Cat',
      time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((it) => (
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
  const pets = mockPets;
  const campaigns = mockCampaigns;
  const users = mockUsers;

  type Adoption = {
    id: number | string;
    petName: string;
    petType: string;
    adopter: string;
    timeAgo: string;
    status: string;
    image: string;
  };

  const [recentAdoptions] = useState<Adoption[]>([
    {
      id: 1,
      petName: 'Buddy',
      petType: 'Aspin',
      adopter: 'Sarah Johnson',
      timeAgo: '2 hours ago',
      status: 'completed',
      image: '/golden-retriever.png',
    },
    {
      id: 2,
      petName: 'Whiskers',
      petType: 'Persian Cat',
      adopter: 'Mike Chen',
      timeAgo: '5 hours ago',
      status: 'pending',
      image: '/fluffy-persian-cat.png',
    },
    {
      id: 3,
      petName: 'Luna',
      petType: 'Mixed Cat',
      adopter: 'Emma Davis',
      timeAgo: '1 day ago',
      status: 'completed',
      image: '/majestic-husky.png',
    },
  ]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');

  const stats = [
    {
      title: 'Total Pets',
      value: String(pets.length),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Dog,
      description: 'Available for adoption',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Adoptions',
      value: String(pets.filter((p) => p.request_status === 'adopted').length),
      change: '+23%',
      changeType: 'positive' as const,
      icon: Heart,
      description: 'This month',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Total Donations',
      value: `₱${campaigns.reduce((sum, c) => sum + c.raised_amount, 0).toLocaleString()}`,
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Raised this month',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Active Users',
      value: String(users.length),
      change: '+5%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Registered users',
      gradient: 'from-orange-25 to-orange-50',
      iconColor: 'text-orange-500',
    },
  ];

  const ongoingCampaigns = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    target: c.target_amount,
    raised: c.raised_amount,
    daysLeft: Math.floor(Math.random() * 30) + 1,
    supporters: Math.floor(Math.random() * 100) + 10,
  }));

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6 bg-gradient-to-br from-orange-25/50 to-orange-50/50 min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent break-words">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg break-words">
            Welcome back! Here&apos;s what&apos;s happening with your pet adoption platform today.
          </p>
        </div>
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
        {stats.map((stat, index) => (
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
                <EnhancedUserGrowthChart period={analyticsPeriod} />
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
                <EnhancedDonationTrendsChart period={analyticsPeriod} />
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
              <EnhancedPetAnalytics period={analyticsPeriod} pets={pets} />
            </CardContent>
          </Card>

          {/* Activity Heatmap */}
          <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                <Activity className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="truncate">Platform Activity Overview</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Daily activity across different platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="w-full min-h-0">
                <ActivityChart />
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
          <CardContent className="space-y-4 overflow-hidden">
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
            <RecentActivity />
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
