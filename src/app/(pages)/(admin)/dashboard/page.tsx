'use client';
import { supabase } from '@/app/supabase/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Session } from '@supabase/supabase-js';
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Dog,
  DollarSign,
  Heart,
  PawPrint,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

  // Mock data - replace with real data from your APIs
  const stats = [
    {
      title: 'Total Pets',
      value: '127',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Dog,
      description: 'Available for adoption',
    },
    {
      title: 'Successful Adoptions',
      value: '89',
      change: '+23%',
      changeType: 'positive' as const,
      icon: Heart,
      description: 'This month',
    },
    {
      title: 'Total Donations',
      value: '₱245,678',
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Raised this month',
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+5%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Registered users',
    },
  ];

  const recentAdoptions = [
    {
      id: 1,
      petName: 'Luna',
      petType: 'Dog',
      adopter: 'Kyle Reginaldo',
      timeAgo: '2 hours ago',
      status: 'completed',
      image: '/corgi.jpg',
    },
    {
      id: 2,
      petName: 'Max',
      petType: 'Cat',
      adopter: 'Aljhon Balmes',
      timeAgo: '5 hours ago',
      status: 'pending',
      image: '/corgi.jpg',
    },
    {
      id: 3,
      petName: 'Bella',
      petType: 'Dog',
      adopter: 'Patrick Allen',
      timeAgo: '1 day ago',
      status: 'completed',
      image: '/corgi.jpg',
    },
  ];

  const ongoingCampaigns = [
    {
      id: 1,
      title: 'Medical Fund for Luna',
      description: 'Surgery and medication needed',
      target: 25000,
      raised: 18500,
      daysLeft: 12,
      supporters: 45,
    },
    {
      id: 2,
      title: 'Shelter Renovation',
      description: 'Improving living conditions',
      target: 50000,
      raised: 32000,
      daysLeft: 25,
      supporters: 78,
    },
    {
      id: 3,
      title: 'Vaccination Drive',
      description: 'Free vaccines for street animals',
      target: 15000,
      raised: 8900,
      daysLeft: 18,
      supporters: 23,
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with Paws Connect today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
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
            {recentAdoptions.map((adoption) => (
              <div key={adoption.id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={adoption.image} alt={adoption.petName} />
                    <AvatarFallback>{adoption.petName[0]}</AvatarFallback>
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
                    className={adoption.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {adoption.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{adoption.timeAgo}</span>
                </div>
              </div>
            ))}
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
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New volunteer registered</p>
                <p className="text-xs text-muted-foreground">Maria Santos joined as a volunteer</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Heart className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Adoption completed</p>
                <p className="text-xs text-muted-foreground">Buddy found a new home</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New donation received</p>
                <p className="text-xs text-muted-foreground">₱5,000 for medical fund</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
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
            <Button variant="outline" className="w-full">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              View All Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
