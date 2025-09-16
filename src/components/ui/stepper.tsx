import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("w-full px-4 py-6", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all duration-300",
                    {
                      "bg-primary text-primary-foreground border-primary": isCompleted,
                      "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20": isActive,
                      "bg-muted text-muted-foreground border-muted-foreground/30": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                
                {/* Step Text */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      {
                        "text-primary": isActive || isCompleted,
                        "text-muted-foreground": isUpcoming,
                      }
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-300",
                    {
                      "bg-primary": stepNumber < currentStep,
                      "bg-muted": stepNumber >= currentStep,
                    }
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};