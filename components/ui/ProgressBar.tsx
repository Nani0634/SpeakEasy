interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  size?: "small" | "medium" | "large";
}

export default function ProgressBar({
  value,
  label,
  showPercentage = true,
  size = "medium",
}: ProgressBarProps) {
  // Keep the value between 0 and 100
  const percentage = Math.min(Math.max(value, 0), 100);

  const heightStyles = {
    small: "h-2",
    medium: "h-3",
    large: "h-4",
  };

  return (
    <div className="w-full">
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between">
          {label ? (
            <span className="text-sm font-medium text-slate-700">
              {label}
            </span>
          ) : (
            <span />
          )}

          {showPercentage && (
            <span className="text-sm font-semibold text-slate-900">
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 ${heightStyles[size]}`}
      >
        {/* Progress */}
        <div
          className={`h-full rounded-full bg-green-600 transition-all duration-500 ${heightStyles[size]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}