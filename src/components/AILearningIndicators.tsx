// src/components/AILearningIndicators.tsx - Shows learning status
import React from 'react';
import { Brain, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface AILearningIndicatorsProps {
  confidence: number;
  learnedFrom?: number;
  correctionInfluence?: number;
  showDetails?: boolean;
}

export const AILearningBadge: React.FC<AILearningIndicatorsProps> = ({ 
  confidence, 
  learnedFrom = 0, 
  correctionInfluence = 0,
  showDetails = false 
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const hasLearning = learnedFrom > 0 || correctionInfluence > 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Confidence Badge */}
      <span className={`px-2 py-1 rounded-full border font-medium ${getConfidenceColor(confidence)}`}>
        {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
      </span>

      {/* Learning Indicator */}
      {hasLearning && (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
          <Brain className="w-3 h-3" />
          {learnedFrom > 0 ? `Learned from ${learnedFrom}` : 'Enhanced'}
        </span>
      )}

      {/* Detailed Learning Info */}
      {showDetails && hasLearning && (
        <div className="text-xs text-gray-500">
          {correctionInfluence > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{Math.round(correctionInfluence * 100)}% confidence boost
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Learning Progress Component for Dashboard
export const LearningProgress: React.FC<{ 
  totalCorrections: number;
  recentImprovements: number;
}> = ({ totalCorrections, recentImprovements }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Learning Status
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Corrections Made</span>
          <span className="font-semibold text-gray-800">{totalCorrections}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Recent Improvements</span>
          <span className="font-semibold text-green-600">+{recentImprovements}</span>
        </div>

        <div className="pt-2 border-t">
          {totalCorrections === 0 ? (
            <p className="text-xs text-gray-500 italic">
              Start correcting AI classifications to help it learn your preferences
            </p>
          ) : totalCorrections < 5 ? (
            <p className="text-xs text-blue-600">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              AI is learning from your feedback
            </p>
          ) : (
            <p className="text-xs text-green-600">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              AI has learned your patterns well
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Transaction Row with Learning Indicators
export const EnhancedTransactionRow: React.FC<{
  transaction: any;
  onCorrection?: (id: string, purpose: string, reason?: string) => void;
}> = ({ transaction, onCorrection }) => {
  const [showCorrectionForm, setShowCorrectionForm] = React.useState(false);
  const [newPurpose, setNewPurpose] = React.useState(transaction.purpose || 'personal');
  const [newReason, setNewReason] = React.useState(transaction.writeOff?.reason || '');

  const handleCorrection = () => {
    if (onCorrection) {
      onCorrection(transaction.id, newPurpose, newReason);
      setShowCorrectionForm(false);
    }
  };

  const needsReview = !transaction.reviewed && transaction.confidence < 70;

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      {/* Main Transaction Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span>{new Date(transaction.date).toLocaleDateString()}</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {transaction.category || "Unassigned"}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              transaction.purpose === "business" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
            }`}>
              {transaction.purpose}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${
            transaction.amount >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {transaction.amount >= 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
          </div>
        </div>
      </div>

      {/* AI Learning Indicators */}
      <div className="flex items-center justify-between">
        <AILearningBadge 
          confidence={transaction.confidence / 100}
          learnedFrom={transaction.learnedFrom}
          correctionInfluence={transaction.correctionInfluence}
        />
        
        <div className="flex items-center gap-2">
          {needsReview && (
            <span className="flex items-center gap-1 text-orange-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              Needs Review
            </span>
          )}
          
          {!showCorrectionForm ? (
            <button
              onClick={() => setShowCorrectionForm(true)}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Correct AI
            </button>
          ) : (
            <button
              onClick={() => setShowCorrectionForm(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Correction Form */}
      {showCorrectionForm && (
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
              <select
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Write-off Reason</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g., Office supplies"
                className="w-full text-xs p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={handleCorrection}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Save Correction
            </button>
          </div>
        </div>
      )}

      {/* Write-off Indicator */}
      {transaction.writeOff?.isWriteOff && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          Write-off: {transaction.writeOff.reason}
        </div>
      )}
    </div>
  );
};