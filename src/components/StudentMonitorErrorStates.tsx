
import React from 'react';

export const InvalidSessionError: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Session</h1>
      <p className="text-gray-600">No session ID provided in the URL.</p>
    </div>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading session...</p>
    </div>
  </div>
);

export const SessionNotFoundError: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h1>
      <p className="text-gray-600">The requested session could not be found.</p>
    </div>
  </div>
);
