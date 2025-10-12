'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function DashboardTour() {
  const pathname = usePathname();
  const { user, markOnboarded } = useAuth();

  useEffect(() => {
    // Only run on /dashboard for logged-in users who are not onboarded yet
    if (pathname !== '/dashboard' || !user || user.onboarded) return;

    // Lazy import driver.js so we don't ship it to non-dashboard pages
    let driverCleanup: (() => void) | null = null;
    (async () => {
      const [{ driver }] = await Promise.all([
        import('driver.js'),
        import('driver.js/dist/driver.css'),
      ]);

      const storageKey = `pc_onboarded_${user.id}`;
      const localDone = typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1';
      if (localDone) return;

      const d = driver({
        showProgress: true,
        allowClose: true,
        stagePadding: 6,
        animate: true,
        overlayOpacity: 0.4,
        popoverClass: 'pc-driver-popover',
      });

      // Define steps pointing to stable selectors we will add to dashboard page
      d.setSteps([
        {
          element: '#pc-dash-generate-report',
          popover: {
            title: 'Generate a report',
            description: 'Click here to export a comprehensive dashboard PDF with key metrics.',
            side: 'bottom',
          },
          // Circle focus around the button
          highlightClass: 'pc-driver-circle',
        },
        {
          element: '#pc-dash-date-filter',
          popover: {
            title: 'Filter by date',
            description: 'Use the date picker to refine analytics by time range.',
            side: 'bottom',
          },
        },
        {
          element: '#pc-dash-analytics-tabs',
          popover: {
            title: 'Switch analytics period',
            description: 'Toggle between weekly, monthly, and annual insights.',
            side: 'bottom',
          },
        },
        {
          element: '#pc-dash-stats-grid',
          popover: {
            title: 'At-a-glance stats',
            description: 'These tiles summarize totals for pets, adoptions, donations, and users.',
            side: 'top',
          },
        },
        {
          element: '#pc-dash-campaigns',
          popover: {
            title: 'Active campaigns',
            description: 'Track fundraising progress, supporters, and days left.',
            side: 'top',
          },
        },
      ]);

      d.drive();

      const onDestroyed = () => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, '1');
          }
        } finally {
          void markOnboarded();
        }
      };
      d.on('destroyed', onDestroyed);
      driverCleanup = () => {
        d.off('destroyed', onDestroyed);
        d.destroy();
      };
    })();

    return () => {
      if (driverCleanup) driverCleanup();
    };
  }, [pathname, user, markOnboarded]);

  return null;
}
