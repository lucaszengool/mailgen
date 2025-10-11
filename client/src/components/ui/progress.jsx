import React from 'react';

const Progress = ({ value = 0, max = 100, className = '' }) => {
  const percentage = Math.min(Math.max(value, 0), max);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
        style={{ width: `${(percentage / max) * 100}%` }}
      />
    </div>
  );
};

export { Progress };