import React from 'react';

const LoadingSpinner = ({ size = 'md', text, showBackground = false }) => {
  const spinnerSize = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const SpinnerContent = () => (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${
          spinnerSize[size] || spinnerSize.md
        } mb-3`}
      ></div>
      {text && (
        <p className={`text-gray-600 font-medium ${textSize[size] || textSize.md}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (showBackground) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <SpinnerContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <SpinnerContent />
    </div>
  );
};

export default LoadingSpinner;