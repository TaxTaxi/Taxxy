// src/app/tax-onboarding/page.tsx
import TaxOnboarding from '@/components/TaxOnboarding';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tax Expert Setup - Taxxy',
  description: 'Complete your tax profile for personalized advice and calculations',
};

export default function TaxOnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TaxOnboarding />
    </div>
  );
}