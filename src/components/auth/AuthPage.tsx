
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DemoModeSection from './DemoModeSection';
import AuthForm from './AuthForm';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/48e6b925-cc0f-4179-a7c9-2a393e857ac4.png" 
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
