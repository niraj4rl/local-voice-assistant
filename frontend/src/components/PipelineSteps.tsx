import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'success' | 'error';
}

interface PipelineProps {
  steps: PipelineStep[];
}

export const PipelineSteps: React.FC<PipelineProps> = ({ steps }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
        return 'text-[#2F81F7]';
      default:
        return 'text-[#8B949E]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      case 'processing':
        return <Clock size={14} className="animate-spin" />;
      default:
        return <Clock size={14} className="opacity-30" />;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={getStatusColor(step.status)}>
              {getStatusIcon(step.status)}
            </div>
            <span className="text-xs text-[#8B949E] whitespace-nowrap">{step.label}</span>
          </div>

          {index < steps.length - 1 && (
            <div className="mx-1 h-px w-3 bg-[#30363D] flex-shrink-0"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
