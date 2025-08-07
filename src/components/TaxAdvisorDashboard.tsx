// src/components/TaxAdvisorDashboard.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calculator, TrendingUp, FileText, MessageCircle, DollarSign, Building2, Car, Home } from 'lucide-react';

interface TaxProfile {
  filing_status: string;
  state: string;
  age: number;
  dependents: number;
  business_type?: string;
  business_name?: string;
  has_employees: boolean;
  has_home_office?: boolean;
  home_office_square_feet?: number;
  total_home_square_feet?: number;
  uses_vehicle_for_business?: boolean;
  business_miles_percentage?: number;
  has_mortgage: boolean;
  has_student_loans: boolean;
  charitable_contributions_annual?: number;
  health_insurance_type?: string;
  has_401k?: boolean;
  has_ira?: boolean; // 🔧 ADDED
  previous_year_agi?: number;
  previous_year_tax_owed?: number;
}

interface AIAdvice {
  type: string;
  title: string;
  content: string;
  savings?: number;
  confidence: number;
}

export default function TaxAdvisorDashboard() {
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [advice, setAdvice] = useState<AIAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadTaxProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      generatePersonalizedAdviceWithProfile();
    }
  }, [profile]);

  async function loadTaxProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      console.log('✅ Profile loaded:', data); // Debug log
    } else {
      console.log('❌ No profile found:', error);
    }
    setLoading(false);
  }

  // 🆕 Generate advice using ACTUAL profile data instead of calling AI
  async function generatePersonalizedAdviceWithProfile() {
    if (!profile) return;

    const adviceList: AIAdvice[] = [];

    // 🏠 Home Office Advice
    if (profile.has_home_office && profile.home_office_square_feet) {
      const homeOfficeDeduction = Math.min(profile.home_office_square_feet * 5, 1500);
      const homeOfficePercent = profile.total_home_square_feet 
        ? Math.round((profile.home_office_square_feet / profile.total_home_square_feet) * 100)
        : 0;

      adviceList.push({
        type: 'home_office',
        title: 'Home Office Deduction',
        content: `Based on your ${profile.business_type} business "${profile.business_name}" and your ${profile.home_office_square_feet} sq ft home office (${homeOfficePercent}% of your ${profile.total_home_square_feet} sq ft home), you qualify for a $${homeOfficeDeduction.toLocaleString()} annual deduction using the simplified method. This saves you approximately $${Math.round(homeOfficeDeduction * 0.24).toLocaleString()} in taxes at the 24% bracket.`,
        confidence: 0.95
      });
    }

    // 💼 Business Structure Advice
    if (profile.business_type && profile.business_type !== 'not_applicable') {
      adviceList.push({
        type: 'business',
        title: 'Business Structure Optimization',
        content: `As a ${profile.business_type} owner${profile.has_employees ? ' with employees' : ''} filing ${profile.filing_status} in ${profile.state}, you can deduct all legitimate business expenses. With your previous year AGI of $${profile.previous_year_agi?.toLocaleString()}, consider maximizing retirement contributions and business deductions to reduce taxable income.`,
        confidence: 0.88
      });
    }

    // 📊 Quarterly Payments
    if (profile.previous_year_agi && profile.previous_year_agi > 50000) {
      const estimatedQuarterly = Math.round((profile.previous_year_agi * 0.25) / 4);
      adviceList.push({
        type: 'quarterly',
        title: 'Quarterly Estimated Payments',
        content: `Based on your previous year AGI of $${profile.previous_year_agi.toLocaleString()}, you should make quarterly estimated tax payments of approximately $${estimatedQuarterly.toLocaleString()} each quarter (due Jan 15, Apr 15, Jun 15, Sep 15). This prevents underpayment penalties and spreads your tax burden throughout the year.`,
        confidence: 0.92
      });
    }

    // 💰 Retirement & Charitable
    if (profile.has_401k || profile.has_ira || profile.charitable_contributions_annual) {
      let content = '';
      if (profile.charitable_contributions_annual) {
        content += `Your ${profile.charitable_contributions_annual.toLocaleString()} in annual charitable contributions provides significant tax benefits. `;
      }
      if (profile.has_401k) {
        content += `Maximize your 401(k) contributions to reduce taxable income. `;
      }
      if (profile.has_ira) {
        content += `Consider additional IRA contributions for further tax advantages.`;
      }

      adviceList.push({
        type: 'deductions',
        title: 'Deduction Optimization',
        content: content.trim(),
        confidence: 0.90
      });
    }

    setAdvice(adviceList);
  }

  async function askTaxQuestion() {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    
    // 🆕 Instead of calling AI, generate personalized response using profile
    if (!profile) {
      setChatResponse('Complete your tax profile first to get personalized advice!');
      setChatLoading(false);
      return;
    }

    // 🆕 Generate response based on actual profile data
    let personalizedResponse = '';
    
    if (chatMessage.toLowerCase().includes('quarterly')) {
      const quarterlyAmount = profile.previous_year_agi ? Math.round((profile.previous_year_agi * 0.25) / 4) : 0;
      personalizedResponse = `Based on your ${profile.business_type} business "${profile.business_name}" and previous year AGI of $${profile.previous_year_agi?.toLocaleString()}, you should make quarterly payments of approximately $${quarterlyAmount.toLocaleString()} each quarter.`;
    } else if (chatMessage.toLowerCase().includes('deduction')) {
      const homeOfficeDeduction = profile.has_home_office && profile.home_office_square_feet 
        ? Math.min(profile.home_office_square_feet * 5, 1500) 
        : 0;
      personalizedResponse = `Your main deductions include: ${homeOfficeDeduction > 0 ? `$${homeOfficeDeduction} home office deduction from your ${profile.home_office_square_feet} sq ft office, ` : ''}${profile.charitable_contributions_annual ? `$${profile.charitable_contributions_annual.toLocaleString()} charitable contributions, ` : ''}and all legitimate business expenses for your ${profile.business_type}.`;
    } else if (chatMessage.toLowerCase().includes('business')) {
      personalizedResponse = `Your ${profile.business_type} "${profile.business_name}"${profile.has_employees ? ' with employees' : ''} allows you to deduct all legitimate business expenses. As a ${profile.filing_status} filer in ${profile.state}, track all business costs including office supplies, software, travel, and professional development.`;
    } else {
      // General response using their actual profile
      personalizedResponse = `Based on your specific tax profile - ${profile.business_type} business "${profile.business_name}", ${profile.filing_status} filing status in ${profile.state}, ${profile.home_office_square_feet ? `${profile.home_office_square_feet} sq ft home office` : 'no home office'}, and $${profile.previous_year_agi?.toLocaleString()} previous year income - I can provide specific advice. What aspect of your taxes would you like to optimize?`;
    }

    setChatResponse(personalizedResponse);
    setChatMessage('');
    setChatLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Tax Profile</h2>
          <p className="text-xl text-gray-600 mb-8">
            Get personalized AI tax advice by completing your profile first.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
            <h3 className="font-semibold text-lg mb-4">You'll unlock:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li>• Personalized quarterly payment calculations</li>
              <li>• Business expense optimization</li>
              <li>• Home office deduction analysis</li>
              <li>• State-specific tax strategies</li>
              <li>• Real-time transaction categorization</li>
            </ul>
            <button 
              onClick={() => window.location.href = '/tax-onboarding'}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Complete Tax Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculateHomeOfficeDeduction = () => {
    if (!profile.has_home_office || !profile.home_office_square_feet) return 0;
    return Math.min(profile.home_office_square_feet * 5, 1500);
  };

  const calculateVehicleDeduction = () => {
    if (!profile.uses_vehicle_for_business || !profile.business_miles_percentage) return 0;
    const estimatedBusinessMiles = 12000 * (profile.business_miles_percentage / 100);
    return estimatedBusinessMiles * 0.655;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Profile Summary */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your AI Tax Advisor</h1>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{profile.business_type} "{profile.business_name}"</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-green-600" />
                <span>{profile.has_home_office && profile.home_office_square_feet ? `${profile.home_office_square_feet} sq ft office` : 'No home office'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-orange-600" />
                <span>{profile.uses_vehicle_for_business ? `${profile.business_miles_percentage}% business` : 'No business vehicle'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span>{profile.state} • {profile.filing_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Deduction Calculator - NOW WITH REAL DATA */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/50">
            <div className="flex items-center gap-3 mb-3">
              <Home className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold">Home Office</h3>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${calculateHomeOfficeDeduction().toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              {profile.has_home_office && profile.home_office_square_feet ? `${profile.home_office_square_feet} sq ft × $5 (simplified method)` : 'Complete profile to calculate'}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/50">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold">Vehicle Deduction</h3>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              ${Math.round(calculateVehicleDeduction()).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              {profile.uses_vehicle_for_business ? `${profile.business_miles_percentage}% × estimated miles` : 'No vehicle usage set'}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/50">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold">Potential Savings</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              ${Math.round((calculateHomeOfficeDeduction() + calculateVehicleDeduction()) * 0.24).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              Estimated tax savings (24% bracket)
            </p>
          </div>
        </div>

        {/* AI Advice Grid - NOW PERSONALIZED */}
        {advice.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {advice.map((item, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.confidence > 0.8 ? 'bg-green-500' : 
                      item.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      {Math.round(item.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Chat Interface - NOW TRULY PERSONALIZED */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/50">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-lg">Ask Your AI Tax Advisor</h3>
          </div>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask about your specific business, deductions, or tax situation..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && askTaxQuestion()}
            />
            <button
              onClick={askTaxQuestion}
              disabled={chatLoading || !chatMessage.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {chatLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {chatResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="prose prose-sm max-w-none">
                  <p>{chatResponse}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => {
                setChatMessage('What quarterly payments should I make?');
                askTaxQuestion();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              Quarterly Payments?
            </button>
            <button 
              onClick={() => {
                setChatMessage('What deductions am I missing?');
                askTaxQuestion();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              Missing Deductions?
            </button>
            <button 
              onClick={() => {
                setChatMessage('How do I optimize my business expenses?');
                askTaxQuestion();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              Optimize Business?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}