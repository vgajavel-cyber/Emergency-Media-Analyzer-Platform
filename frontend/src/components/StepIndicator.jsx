import React from "react";

const steps = [
  { num: 1, label: "Report Start" },
  { num: 2, label: "Track" },
  { num: 3, label: "Login" },
  { num: 4, label: "Generated" },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center w-full py-5 px-2">
      {steps.map((step, idx) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
              style={{
                background:
                  step.num < currentStep
                    ? "#22c55e"
                    : step.num === currentStep
                    ? "#E63946"
                    : "#e5e7eb",
                color: step.num <= currentStep ? "#fff" : "#9ca3af",
                boxShadow:
                  step.num === currentStep
                    ? "0 0 0 4px rgba(230,57,70,0.15)"
                    : "none",
              }}
            >
              {step.num < currentStep ? "✓" : step.num}
            </div>
            <span
              className="text-xs mt-1 font-semibold hidden sm:block"
              style={{
                color:
                  step.num === currentStep
                    ? "#E63946"
                    : step.num < currentStep
                    ? "#22c55e"
                    : "#9ca3af",
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-1 transition-all duration-500 rounded-full"
              style={{
                background: step.num < currentStep ? "#22c55e" : "#e5e7eb",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}