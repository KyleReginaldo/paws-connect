'use client';
import { useFundraising } from '@/app/context/FundraisingContext';
import { usePets } from '@/app/context/PetsContext';
import { useUsers } from '@/app/context/UsersContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { User } from '@/config/models/users';
import { Fundraising } from '@/config/types/fundraising';
import { Pet } from '@/config/types/pet';
import {
  Activity,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Dog,
  DollarSign,
  Heart,
  PawPrint,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import router from 'next/router';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
// Charts
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';

// Chart Configurations
const chartConfig = {
  users: {
    label: 'Users',
  },
  donations: {
    label: 'Donations',
  },
  pets: {
    label: 'Pets',
  },
  activity: {
    label: 'Activity',
  },
} satisfies ChartConfig;

// Analytics Components
function UserGrowthChart() {
  const data = [
    { month: 'Jan', users: 12 },
    { month: 'Feb', users: 19 },
    { month: 'Mar', users: 24 },
    { month: 'Apr', users: 31 },
    { month: 'May', users: 42 },
    { month: 'Jun', users: 56 },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[200px]">
      <LineChart data={data}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis hide />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={{ stroke: 'hsl(var(--border))' }}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke="hsl(var(--foreground))"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function UserRoleChart({ users }: { users: User[] | null }) {
  if (!users) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const roleData = [
    { name: 'Admins', value: users.filter((u) => u.role === 1).length },
    { name: 'Staff', value: users.filter((u) => u.role === 2).length },
    { name: 'Users', value: users.filter((u) => u.role === 3).length },
  ];

  return (
    <div className="space-y-3">
      {roleData.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{item.name}</span>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonationTrendsChart() {
  const monthlyData = [
    { month: 'Jan', donations: 2400 },
    { month: 'Feb', donations: 1398 },
    { month: 'Mar', donations: 9800 },
    { month: 'Apr', donations: 3908 },
    { month: 'May', donations: 4800 },
    { month: 'Jun', donations: 3800 },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[200px]">
      <BarChart data={monthlyData}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis hide />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={{ fill: 'hsl(var(--muted)/10)' }}
        />
        <Bar dataKey="donations" fill="hsl(var(--muted-foreground))" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}

function PetStatusChart({ pets }: { pets: Pet[] | null }) {
  if (!pets) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const statusData = [
    { name: 'Available', value: pets.filter((p) => p.request_status === 'available').length },
    { name: 'Adopted', value: pets.filter((p) => p.request_status === 'adopted').length },
    { name: 'Pending', value: pets.filter((p) => p.request_status === 'pending').length },
    { name: 'Medical Care', value: pets.filter((p) => p.request_status === 'medical').length },
  ];

  return (
    <div className="space-y-3">
      {statusData.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{item.name}</span>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
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
    <ChartContainer config={chartConfig} className="h-[200px]">
      <BarChart data={activityData}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis hide />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={{ fill: 'hsl(var(--muted)/10)' }}
        />
        <Bar dataKey="total" fill="hsl(var(--muted-foreground))" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}

const Page = () => {
  const { pets } = usePets();
  const { campaigns, stats: fundraisingStats } = useFundraising();
  const { users } = useUsers();

  type Adoption = {
    id: number | string;
    petName: string;
    petType: string;
    adopter: string;
    timeAgo: string;
    status: string;
    image: string;
  };

  const [recentAdoptions, setRecentAdoptions] = useState<Adoption[] | null>(null);
  const [adoptionsLoading, setAdoptionsLoading] = useState(false);
  const [adoptionsError, setAdoptionsError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    let mounted = true;
    const fetchAdoptions = async () => {
      setAdoptionsLoading(true);
      try {
        // build optional query params for date range
        const params: Record<string, string> = {};
        if (dateRange?.from) params.from = new Date(dateRange.from).toISOString();
        if (dateRange?.to) params.to = new Date(dateRange.to).toISOString();
        const url = new URL('/api/v1/adoption', window.location.origin);
        Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch adoptions');
        const json = (await response.json()) as { data?: Array<Record<string, unknown>> };
        if (!mounted) return;
        const data = Array.isArray(json.data) ? json.data.slice(0, 5) : [];
        const parsed = data.map((d: Record<string, unknown>) => {
          const id = (d['id'] as number) ?? String(Math.random()).slice(2, 8);
          const petName = (d['pet_name'] as string) || (d['pet'] as string) || 'Unknown';
          const petType = (d['pet_type'] as string) || 'N/A';
          const adopter = (d['user_name'] as string) || (d['user'] as string) || 'Anonymous';
          const createdAt = (d['created_at'] as string) || new Date().toISOString();
          const status = (d['status'] as string) || 'pending';
          const image = (d['photo'] as string) || '/corgi.jpg';
          return {
            id,
            petName,
            petType,
            adopter,
            timeAgo: new Date(createdAt).toLocaleString(),
            status,
            image,
          } as Adoption;
        });
        setRecentAdoptions(parsed);
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setAdoptionsError(msg || 'Failed to load adoptions');
      } finally {
        setAdoptionsLoading(false);
      }
    };
    fetchAdoptions();
    return () => {
      mounted = false;
    };
  }, [dateRange]);

  // Build stats using available contexts
  const stats = [
    {
      title: 'Total Pets',
      value: pets ? String(pets.length) : '—',
      change: '+0% ',
      changeType: 'neutral' as const,
      icon: Dog,
      description: 'Available for adoption',
    },
    {
      title: 'Adoptions',
      value: fundraisingStats ? String(fundraisingStats.total_campaigns || 0) : '—',
      change: '+0% ',
      changeType: 'neutral' as const,
      icon: Heart,
      description: 'This month',
    },
    {
      title: 'Total Donations',
      value: fundraisingStats ? `₱${(fundraisingStats.total_raised || 0).toLocaleString()}` : '—',
      change: '+0% ',
      changeType: 'neutral' as const,
      icon: DollarSign,
      description: 'Raised this month',
    },
    {
      title: 'Active Users',
      value: users ? String(users.length) : '—',
      change: '+0% ',
      changeType: 'neutral' as const,
      icon: Users,
      description: 'Registered users',
    },
  ];

  const ongoingCampaigns =
    campaigns?.map((c: Fundraising) => ({
      id: c.id,
      title: c.title ?? '',
      description: c.description ?? '',
      target: c.target_amount ?? 0,
      raised: c.raised_amount ?? 0,
      daysLeft: 0,
      supporters: 0,
    })) || [];

  // Local RecentActivity component
  function RecentActivity() {
    const [items, setItems] = useState<
      Array<{
        id: string;
        type: 'user' | 'adoption' | 'donation';
        title: string;
        subtitle?: string;
        time: string;
      }>
    >([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let mounted = true;
      const fetchItems = async () => {
        try {
          setLoading(true);
          const [donRes, adoptRes, usersRes] = await Promise.all([
            fetch('/api/v1/donations?limit=5'),
            fetch('/api/v1/adoption'),
            fetch('/api/v1/users'),
          ]);

          const donJson = donRes.ok ? await donRes.json() : { data: [] };
          const adoptJson = adoptRes.ok ? await adoptRes.json() : { data: [] };
          const usersJson = usersRes.ok ? await usersRes.json() : { data: [] };

          const donations = Array.isArray(donJson.data) ? donJson.data : [];
          const adoptions = Array.isArray(adoptJson.data) ? adoptJson.data : [];
          const newUsers = Array.isArray(usersJson.data) ? usersJson.data : [];

          const out: Array<{
            id: string;
            type: 'user' | 'adoption' | 'donation';
            title: string;
            subtitle?: string;
            time: string;
          }> = [];

          donations.forEach((d: Record<string, unknown>, idx: number) => {
            out.push({
              id: `don_${idx}_${d.created_at}`,
              type: 'donation',
              title: 'New donation received',
              subtitle: `₱${Number(d.amount || 0).toLocaleString()}${
                d.message ? ` — ${d.message}` : ''
              }`,
              time: String(d.created_at || new Date().toISOString()),
            });
          });

          adoptions.slice(0, 5).forEach((a: Record<string, unknown>, idx: number) => {
            out.push({
              id: `adopt_${idx}_${a.created_at}`,
              type: 'adoption',
              title: a.status === 'completed' ? 'Adoption completed' : 'Adoption application',
              subtitle: String(a.pet_name || a.pet || 'Unknown'),
              time: String(a.created_at || new Date().toISOString()),
            });
          });

          newUsers.slice(0, 5).forEach((u: Record<string, unknown>, idx: number) => {
            out.push({
              id: `user_${idx}_${u.created_at}`,
              type: 'user',
              title: 'New user registered',
              subtitle: String(u.username || u.email || 'New user'),
              time: String(u.created_at || new Date().toISOString()),
            });
          });

          // Sort by time desc
          out.sort((a, b) => (a.time < b.time ? 1 : -1));

          if (!mounted) return;
          setItems(out.slice(0, 6));
        } catch (err) {
          console.error('Failed to fetch recent activity', err);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchItems();
      return () => {
        mounted = false;
      };
    }, []);

    if (loading) return <div className="text-sm text-muted-foreground">Loading activity…</div>;
    if (!items.length)
      return <div className="text-sm text-muted-foreground">No recent activity found.</div>;

    return (
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-start space-x-4">
            <div
              className={`p-2 rounded-full ${
                it.type === 'user'
                  ? 'bg-blue-100'
                  : it.type === 'adoption'
                    ? 'bg-green-100'
                    : 'bg-orange-100'
              }`}
            >
              {it.type === 'user' ? (
                <Users className="h-4 w-4 text-blue-600" />
              ) : it.type === 'adoption' ? (
                <Heart className="h-4 w-4 text-green-600" />
              ) : (
                <DollarSign className="h-4 w-4 text-orange-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{it.title}</p>
              {it.subtitle && <p className="text-xs text-muted-foreground">{it.subtitle}</p>}
              <p className="text-xs text-muted-foreground">{new Date(it.time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with Paws Connect today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover open={pickerOpen} onOpenChange={(open) => setPickerOpen(open)}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(
                        dateRange.to,
                      ).toLocaleDateString()}`
                    : `${new Date(dateRange.from).toLocaleDateString()}`
                  : 'Today'}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">{stat.change}</span>
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Analytics Overview</h3>
          <p className="text-muted-foreground">Detailed insights into your platform performance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Registration Trend</CardTitle>
              <CardDescription>Monthly user registrations over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <UserGrowthChart />
            </CardContent>
          </Card>

          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown by user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleChart users={users} />
            </CardContent>
          </Card>

          {/* Donation Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Donation Trends</CardTitle>
              <CardDescription>Monthly donation amounts and campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <DonationTrendsChart />
            </CardContent>
          </Card>

          {/* Pet Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Pet Status</CardTitle>
              <CardDescription>Current status of all pets</CardDescription>
            </CardHeader>
            <CardContent>
              <PetStatusChart pets={pets} />
            </CardContent>
          </Card>

          {/* Activity Heatmap */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Daily activity across different platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Adoptions */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Recent Adoption Applications
            </CardTitle>
            <CardDescription>Latest adoption requests and their current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adoptionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading recent adoptions…</p>
            ) : adoptionsError ? (
              <p className="text-sm text-red-600">{adoptionsError}</p>
            ) : recentAdoptions && recentAdoptions.length > 0 ? (
              recentAdoptions.map((adoption) => (
                <div key={adoption.id} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={adoption.image} alt={adoption.petName} />
                      <AvatarFallback>{adoption.petName?.[0] ?? 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {adoption.petName} • {adoption.petType}
                      </p>
                      <p className="text-sm text-muted-foreground">Adopter: {adoption.adopter}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={adoption.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        adoption.status === 'completed' ? 'bg-green-100 text-green-800' : ''
                      }
                    >
                      {adoption.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{adoption.timeAgo}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <Image
                    src="/empty_pet.png"
                    alt="No recent adoptions"
                    width={96}
                    height={96}
                    className="w-24 h-24"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  No recent adoption applications found.
                </p>
              </div>
            )}
            <Button variant="outline" className="w-full">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              View All Applications
            </Button>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RecentActivity />
          </CardContent>
        </Card>
      </div>

      {/* Donation Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Active Fundraising Campaigns
          </CardTitle>
          <CardDescription>Current donation drives and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {ongoingCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>₱{campaign.raised.toLocaleString()}</span>
                        <span>₱{campaign.target.toLocaleString()}</span>
                      </div>
                      <Progress value={(campaign.raised / campaign.target) * 100} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{campaign.supporters} supporters</span>
                        <span>{campaign.daysLeft} days left</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                router.push('/admin/donations');
              }}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              View All Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
