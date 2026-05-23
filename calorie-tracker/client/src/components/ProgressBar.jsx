import React from 'react';

const ProgressBar = ({ value, max, label, unit = 'g', colorScheme = 'auto', showValues = true }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  let colorClass;
  if (colorScheme === 'auto') {
    if (pct < 75) colorClass = 'bg-green-500';
    else if (pct < 95) colorClass = 'bg-yellow-400';
    else colorClass = 'bg-red-500';
  } else if (colorScheme === 'protein') {
    colorClass = 'bg-blue-500';
  } else if (colorScheme === 'carbs') {
    colorClass = 'bg-yellow-500';
  } else if (colorScheme === 'fat') {
    colorClass = 'bg-orange-500';
  } else {
    colorClass = colorScheme;
  }

  return (
    <div className="w-full">
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showValues && (
            <span className="text-sm text-gray-500">
              {Math.round(value)}{unit} / {Math.round(max)}{unit}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
