import { PawPrint } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-2">
          <PawPrint
            className="h-8 w-8 text-orange-500 animate-bounce"
            style={{ animationDelay: '0s' }}
          />
          <PawPrint
            className="h-10 w-10 text-blue-500 animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
          <PawPrint
            className="h-8 w-8 text-orange-500 animate-bounce"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
        <p className="text-gray-600 text-lg font-medium">Loading Paws Connect...</p>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: '0.3s' }}
          ></div>
          <div
            className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"
            style={{ animationDelay: '0.6s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
