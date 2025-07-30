import React from "react";

const MessageSkeleton = () => {
  return (
    <div className="flex animate-pulse space-x-2 mb-3">
      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      <div className="flex flex-col space-y-2">
        <div className="w-40 h-3 bg-gray-300 rounded"></div>
        <div className="w-32 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
