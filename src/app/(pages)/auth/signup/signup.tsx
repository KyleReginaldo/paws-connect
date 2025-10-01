'use client';

import { AuthStatus, useAuth } from '@/app/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, Quote } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  phone_number: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  phone_number?: string;
}

const Signup = () => {
  const { onSignup, status, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone_number: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-$$$$]{10,}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      onSignup(
        formData.email,
        formData.password,
        formData.username,
        2,
        '+63' + formData.phone_number,
        'PENDING',
      );
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 bg-[url('/pet_bg.png')] bg-cover bg-repeat">
        <Card className="w-full max-w-md bg-[#ffffff] shadow-lg border border-green-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Welcome!
            </CardTitle>
            <CardDescription className="text-center">
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
              <p className="text-sm text-green-800">
                <strong>Email:</strong> {user.email}
              </p>
            </div>
            <Button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              className="w-full bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const isLoading = status === AuthStatus.authenticating;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 bg-[url('/pet_bg.png')] bg-cover bg-repeat relative">
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
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Fill in your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={errors.username ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div
                className={cn(
                  'flex items-center rounded-md border border-input has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring',
                  isLoading && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="bg-transparent pl-3 pr-1 select-none text-[14px] text-gray-500">
                  +63
                </span>
                <Input
                  id="phone_number"
                  type="tel"
                  prefix="+63"
                  maxLength={10}
                  placeholder="9930162099"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className={errors.phone_number ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
              </div>

              {errors.phone_number && <p className="text-sm text-red-500">{errors.phone_number}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {status === AuthStatus.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Something went wrong during signup. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => (window.location.href = '/?view=signin')}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
