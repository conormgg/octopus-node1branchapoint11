
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthForm from './AuthForm';
import Logo from '@/components/ui/Logo';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="h-20" />
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
