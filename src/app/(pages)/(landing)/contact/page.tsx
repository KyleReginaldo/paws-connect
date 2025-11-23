'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone } from 'lucide-react';
import { useState } from 'react';

const ContactPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'pawsconnecttof@gmail.com',
          subject: `${contactForm.subject} - From ${contactForm.name}`,
          text: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${contactForm.name}</p>
            <p><strong>Email:</strong> ${contactForm.email}</p>
            <p><strong>Subject:</strong> ${contactForm.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${contactForm.message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br">
      <div
        className="
      absolute inset-0 -z-10 -top-10
      -skew-y-6 -translate-y-6 scale-105
      bg-[linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)]
      bg-[length:48px_48px]
      [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]
    "
      />
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Get in Touch</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about adoption, fundraising, or how you can help? We&apos;re here to
            assist you. Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Message sent successfully! We&apos;ll get back to you soon.
                    </p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">
                      ✗ Failed to send message. Please try again or email us directly.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  size={'sm'}
                  disabled={
                    isSubmitting ||
                    !contactForm.email ||
                    !contactForm.name ||
                    !contactForm.subject ||
                    !contactForm.message
                  }
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-6 text-base"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
                <CardDescription>
                  Get in touch with us through any of these channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Mail className="text-black" size={16} />
                    <div className="flex flex-col">
                      <p className="text-gray-900 font-medium">pawsconnecttof@gmail.com</p>
                      <p className="text-sm text-gray-500 mt-1">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Phone className=" text-black" size={16} />
                    <div className="flex flex-col">
                      <p className="text-gray-900 font-medium">Available via email</p>
                      <p className="text-sm text-gray-500 mt-1">Monday - Sunday, 9AM - 5PM PST</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href="/faq"
                    className="block text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    → Frequently Asked Questions
                  </a>
                  <a
                    href="/about"
                    className="block text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    → About Paws Connect
                  </a>
                  <a
                    href="/download/app"
                    className="block text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    → Download Our App
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
