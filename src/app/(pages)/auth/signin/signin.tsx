'use client';

import { AuthStatus, useAuth } from '@/app/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Quote } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
const Signin = () => {
  const { onLogin, status } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

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
      await onLogin(email, password).then((success) => {
        if (success) {
          window.location.href = '/dashboard';

          // Login successful, further actions can be handled here if needed
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      setForgotPasswordError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordMessage(data.message);
        setForgotPasswordEmail('');
      } else {
        setForgotPasswordError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordError('An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const isLoading = status === AuthStatus.authenticating;

  // Show success message if user is logged in
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 bg-[url('/pet_bg.webp')] bg-cover bg-repeat relative">
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
          <CardTitle className="text-2xl font-bold text-center">
            {showForgotPassword ? 'Reset Password' : 'Sign In'}
          </CardTitle>
          <CardDescription className="text-center">
            {showForgotPassword
              ? 'Enter your email to receive a password reset link'
              : 'Enter your email and password to access admin and staff account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForgotPassword ? (
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

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-orange-600"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email Address</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className={forgotPasswordError ? 'border-red-500' : ''}
                  disabled={forgotPasswordLoading}
                />
                {forgotPasswordError && (
                  <p className="text-sm text-red-500">{forgotPasswordError}</p>
                )}
              </div>

              {forgotPasswordMessage && (
                <Alert>
                  <AlertDescription className="text-green-700">
                    {forgotPasswordMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-white"
                disabled={forgotPasswordLoading || !forgotPasswordEmail}
              >
                {forgotPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordError('');
                    setForgotPasswordMessage('');
                  }}
                  className="text-sm text-gray-600 hover:text-orange-600"
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signin;
