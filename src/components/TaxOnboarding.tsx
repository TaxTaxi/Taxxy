// src/components/TaxOnboarding.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, User, Building2, Home, Car, Calculator, PiggyBank, FileText } from 'lucide-react';

interface TaxProfile {
  // Basic Info
  filing_status: string;
  state: string;
  dependents: number;
  age: number;
  spouse_age?: number;
  
  // Business Info
  business_type: string;
  business_name: string;
  has_employees: boolean;
  
  // Home Office
  has_home_office: boolean;
  home_office_percentage?: number;
  home_office_square_feet?: number;
  total_home_square_feet?: number;
  
  // Vehicle
  uses_vehicle_for_business: boolean;
  business_miles_percentage?: number;
  tracks_actual_expenses: boolean;
  
  // Previous Year
  previous_year_agi?: number;
  previous_year_tax_owed?: number;
  previous_year_refund?: number;
  
  // Deductions
  itemizes_deductions: boolean;
  has_mortgage: boolean;
  mortgage_interest?: number;
  property_taxes?: number;
  charitable_contributions_annual?: number;
  has_student_loans: boolean;
  
  // Health & Retirement
  health_insurance_type: string;
  has_hsa: boolean;
  has_401k: boolean;
  has_ira: boolean;
  has_roth_ira: boolean;
  
  // Quarterly
  makes_quarterly_payments: boolean;
  quarterly_payment_amount?: number;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

const TaxOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TaxProfile>({
    filing_status: '',
    state: '',
    dependents: 0,
    age: 0,
    business_type: '',
    business_name: '',
    has_employees: false,
    has_home_office: false,
    uses_vehicle_for_business: false,
    tracks_actual_expenses: false,
    itemizes_deductions: false,
    has_mortgage: false,
    has_student_loans: false,
    health_insurance_type: '',
    has_hsa: false,
    has_401k: false,
    has_ira: false,
    has_roth_ira: false,
    makes_quarterly_payments: false,
  });

  const steps = [
    {
      title: "Personal Information",
      icon: User,
      description: "Let's start with your basic tax situation"
    },
    {
      title: "Business Details", 
      icon: Building2,
      description: "Tell us about your business or freelance work"
    },
    {
      title: "Home Office",
      icon: Home,
      description: "Do you work from home? This could save you money!"
    },
    {
      title: "Vehicle Usage",
      icon: Car,
      description: "Business vehicle expenses are often overlooked"
    },
    {
      title: "Previous Year",
      icon: Calculator,
      description: "Your 2023 tax information helps us estimate better"
    },
    {
      title: "Deductions & Savings",
      icon: PiggyBank,
      description: "Let's find every deduction you're eligible for"
    },
    {
      title: "Review & Complete",
      icon: FileText,
      description: "Almost done! Let's review your tax profile"
    }
  ];

  const updateProfile = (field: keyof TaxProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tax-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        // Redirect to enhanced tax report
        window.location.href = '/tax-report?onboarded=true';
      } else {
        alert('Failed to save tax profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving tax profile:', error);
      alert('Failed to save tax profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your filing status?
              </label>
              <select
                value={profile.filing_status}
                onChange={(e) => updateProfile('filing_status', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select filing status...</option>
                <option value="single">Single</option>
                <option value="married_joint">Married Filing Jointly</option>
                <option value="married_separate">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
                <option value="qualifying_widow">Qualifying Widow(er)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What state do you live in?
              </label>
              <select
                value={profile.state}
                onChange={(e) => updateProfile('state', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state...</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your age
                </label>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => updateProfile('age', parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="18"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of dependents
                </label>
                <input
                  type="number"
                  value={profile.dependents}
                  onChange={(e) => updateProfile('dependents', parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="20"
                />
              </div>
            </div>

            {profile.filing_status.includes('married') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spouse's age
                </label>
                <input
                  type="number"
                  value={profile.spouse_age || ''}
                  onChange={(e) => updateProfile('spouse_age', parseInt(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="18"
                  max="120"
                />
              </div>
            )}
          </div>
        );

      case 1: // Business Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of business do you have?
              </label>
              <select
                value={profile.business_type}
                onChange={(e) => updateProfile('business_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select business type...</option>
                <option value="sole_proprietorship">Sole Proprietorship (Freelancer)</option>
                <option value="llc">LLC</option>
                <option value="s_corp">S Corporation</option>
                <option value="c_corp">C Corporation</option>
                <option value="partnership">Partnership</option>
                <option value="not_applicable">I don't have a business</option>
              </select>
            </div>

            {profile.business_type && profile.business_type !== 'not_applicable' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business name (optional)
                  </label>
                  <input
                    type="text"
                    value={profile.business_name}
                    onChange={(e) => updateProfile('business_name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={profile.has_employees}
                      onChange={(e) => updateProfile('has_employees', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I have employees (not including yourself)
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>
        );

      case 2: // Home Office
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.has_home_office}
                  onChange={(e) => updateProfile('has_home_office', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  I use part of my home exclusively for business
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                The space must be used ONLY for business to qualify
              </p>
            </div>

            {profile.has_home_office && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Home office square feet
                    </label>
                    <input
                      type="number"
                      value={profile.home_office_square_feet || ''}
                      onChange={(e) => updateProfile('home_office_square_feet', parseInt(e.target.value) || undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total home square feet
                    </label>
                    <input
                      type="number"
                      value={profile.total_home_square_feet || ''}
                      onChange={(e) => updateProfile('total_home_square_feet', parseInt(e.target.value) || undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="2000"
                    />
                  </div>
                </div>

                {profile.home_office_square_feet && profile.total_home_square_feet && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Home office percentage:</strong> {Math.round((profile.home_office_square_feet / profile.total_home_square_feet) * 100)}%
                      <br />
                      <strong>Potential annual deduction:</strong> ~${Math.round((profile.home_office_square_feet / profile.total_home_square_feet) * 15000).toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 3: // Vehicle Usage
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.uses_vehicle_for_business}
                  onChange={(e) => updateProfile('uses_vehicle_for_business', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  I use my vehicle for business purposes
                </span>
              </label>
            </div>

            {profile.uses_vehicle_for_business && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What percentage of your driving is for business?
                  </label>
                  <input
                    type="number"
                    value={profile.business_miles_percentage || ''}
                    onChange={(e) => updateProfile('business_miles_percentage', parseFloat(e.target.value) || undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    placeholder="25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter as percentage (e.g., 25 for 25%)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    How do you want to track vehicle expenses?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="vehicle_method"
                        checked={!profile.tracks_actual_expenses}
                        onChange={() => updateProfile('tracks_actual_expenses', false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Standard mileage rate</strong> (simpler - $0.655/mile in 2023)
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="vehicle_method"
                        checked={profile.tracks_actual_expenses}
                        onChange={() => updateProfile('tracks_actual_expenses', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Actual expenses</strong> (gas, maintenance, insurance, etc.)
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 4: // Previous Year
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Your 2023 tax information helps us provide more accurate estimates and recommendations.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2023 Adjusted Gross Income (AGI)
              </label>
              <input
                type="number"
                value={profile.previous_year_agi || ''}
                onChange={(e) => updateProfile('previous_year_agi', parseFloat(e.target.value) || undefined)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="75000"
              />
              <p className="text-xs text-gray-500 mt-1">Find this on line 11 of your 2023 Form 1040</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax owed (if any)
                </label>
                <input
                  type="number"
                  value={profile.previous_year_tax_owed || ''}
                  onChange={(e) => updateProfile('previous_year_tax_owed', parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund received
                </label>
                <input
                  type="number"
                  value={profile.previous_year_refund || ''}
                  onChange={(e) => updateProfile('previous_year_refund', parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2500"
                />
              </div>
            </div>
          </div>
        );

      case 5: // Deductions & Savings
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deductions</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.has_mortgage}
                    onChange={(e) => updateProfile('has_mortgage', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">I have a mortgage</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.has_student_loans}
                    onChange={(e) => updateProfile('has_student_loans', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">I pay student loan interest</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Retirement & Health</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.has_401k}
                    onChange={(e) => updateProfile('has_401k', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">I contribute to a 401(k)</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.has_ira}
                    onChange={(e) => updateProfile('has_ira', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">I contribute to a traditional IRA</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profile.has_hsa}
                    onChange={(e) => updateProfile('has_hsa', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">I have a Health Savings Account (HSA)</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Taxes</h3>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.makes_quarterly_payments}
                  onChange={(e) => updateProfile('makes_quarterly_payments', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">I make quarterly estimated tax payments</span>
              </label>

              {profile.makes_quarterly_payments && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quarterly payment amount
                  </label>
                  <input
                    type="number"
                    value={profile.quarterly_payment_amount || ''}
                    onChange={(e) => updateProfile('quarterly_payment_amount', parseFloat(e.target.value) || undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2500"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Review
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                🎉 Tax Profile Complete!
              </h3>
              <p className="text-green-800">
                You've provided all the information our AI Tax Expert needs to give you personalized, 
                accurate tax advice and calculations.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✅ AI will analyze your complete financial profile</li>
                <li>✅ Calculate accurate tax estimates for your situation</li>
                <li>✅ Identify deductions you might be missing</li>
                <li>✅ Provide personalized tax strategies</li>
                <li>✅ Generate professional tax reports</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Pro tip:</strong> Keep tracking your transactions throughout the year. 
                Our AI will get smarter about your specific situation and find even more ways to save!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return profile.filing_status && profile.state && profile.age > 0;
      case 1:
        return profile.business_type;
      case 2:
        return true; // Home office is optional
      case 3:
        return true; // Vehicle is optional
      case 4:
        return true; // Previous year is optional
      case 5:
        return true; // Deductions are optional
      case 6:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🤖 AI Tax Expert Onboarding
          </h1>
          <p className="text-gray-600">
            Let's create your personalized tax profile for accurate calculations and advice
          </p>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={submitProfile}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!isStepComplete()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxOnboarding;