
import React, { useState } from 'react';
import { useLogo } from '@/contexts/LogoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, RotateCcw, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const LogoReplacer: React.FC = () => {
  const { logoUrl, setLogoUrl, resetToOriginal } = useLogo();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('file', file);

      // For Lovable, we'll create a blob URL for immediate use
      const objectUrl = URL.createObjectURL(file);
      setLogoUrl(objectUrl);
      
      console.log('Logo replaced successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Logo Replacer</h1>
          <p className="text-gray-600">
            Replace the OctoPi Ink logo across the landing page, auth page, and dashboard.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Logo Display */}
          <Card>
            <CardHeader>
              <CardTitle>Current Logo</CardTitle>
              <CardDescription>
                This logo appears on all three pages with different sizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">Landing:</span>
                  <Logo size="h-8" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">Auth:</span>
                  <Logo size="h-6" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">Dashboard:</span>
                  <Logo size="h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Replace Logo</CardTitle>
              <CardDescription>
                Upload a new logo to replace it across all pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo-upload">Choose Logo File</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetToOriginal}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Original
                </Button>
              </div>

              {isUploading && (
                <p className="text-sm text-blue-600">Uploading...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Removal Instructions */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <X className="h-5 w-5" />
              How to Remove This Logo Replacer
            </CardTitle>
            <CardDescription className="text-orange-700">
              When you're done testing logos, follow these steps to remove this functionality:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Delete the file: <code className="bg-orange-200 px-1 rounded">src/pages/LogoReplacer.tsx</code></li>
              <li>Delete the file: <code className="bg-orange-200 px-1 rounded">src/contexts/LogoContext.tsx</code></li>
              <li>Delete the file: <code className="bg-orange-200 px-1 rounded">src/components/ui/Logo.tsx</code></li>
              <li>Remove the "Logo Replacer" link from <code className="bg-orange-200 px-1 rounded">src/pages/Index.tsx</code></li>
              <li>Remove the LogoReplacer route from <code className="bg-orange-200 px-1 rounded">src/App.tsx</code></li>
              <li>Remove the LogoProvider wrapper from <code className="bg-orange-200 px-1 rounded">src/App.tsx</code></li>
              <li>Restore the original img tags in the three pages (Index.tsx, AuthPage.tsx, TeacherDashboard.tsx)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoReplacer;
