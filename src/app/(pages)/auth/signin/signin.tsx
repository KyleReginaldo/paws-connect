'use client';

import { AuthStatus, useAuth } from '@/app/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Quote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
const Signin = () => {
  const router = useRouter();
  const { onLogin, status } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: 'I found my best friend through PawsConnect! The app made it so easy to browse pets and connect with shelters.',
      author: 'Sarah M.',
      role: 'Happy Pet Owner',
    },
    {
      text: 'The donation feature is amazing! I can support multiple shelters and see exactly how my contributions help animals.',
      author: 'Mike J.',
      role: 'Animal Lover',
    },
    {
      text: "PawsConnect's community features helped me connect with other pet owners in my area. Love this app!",
      author: 'Emily R.',
      role: 'Dog Mom',
    },
    {
      text: 'The pet profiles are so detailed and the search filters helped me find the perfect match for our family.',
      author: 'James K.',
      role: 'Cat Dad',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onLogin(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const isLoading = status === AuthStatus.authenticating;

  // Show success message if user is logged in
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 bg-[url('/pet_bg.png')] bg-cover bg-repeat relative">
      {/* Floating Testimonials - Desktop Only */}
      <div className="hidden lg:block absolute top-20 left-10 max-w-xs">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Quote className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 italic mb-2">
                  {testimonials[currentTestimonial].text}
                </p>
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">
                    {testimonials[currentTestimonial].author}
                  </p>
                  <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block absolute bottom-20 right-10 max-w-xs">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Quote className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 italic mb-2">
                  {testimonials[(currentTestimonial + 2) % testimonials.length].text}
                </p>
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">
                    {testimonials[(currentTestimonial + 2) % testimonials.length].author}
                  </p>
                  <p className="text-gray-600">
                    {testimonials[(currentTestimonial + 2) % testimonials.length].role}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-md bg-[#ffffff] shadow-lg border border-orange-500 relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access admin and staff account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            {status === AuthStatus.error && (
              <Alert variant="destructive">
                <AlertDescription>Invalid email or password. Please try again.</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-white"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot your password?
            </a>
          </div>

          <div className="mt-2 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a
              className="text-blue-600 hover:underline cursor-pointer"
              onClick={() => {
                router.push('signup');
              }}
            >
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signin;
