
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DemoModeSection from './DemoModeSection';
import AuthForm from './AuthForm';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Welcome to Collaborative Whiteboard
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your teacher account or try the demo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Mode Section */}
          <DemoModeSection />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Authentication Form */}
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
