
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthForm from './AuthForm';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/5c508699-4155-42ef-a977-c436f4734ca4.png" 
              alt="OctoPi Ink Logo" 
              className="h-20 w-auto"
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl">
            Welcome to OctoPi Ink
          </CardTitle>
          <CardDescription>
            Sign in to your teacher account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Authentication Form */}
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
