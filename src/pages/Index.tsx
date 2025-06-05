
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, Shield, Monitor } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/5c508699-4155-42ef-a977-c436f4734ca4.png" 
              alt="OctoPi Ink Logo" 
              className="h-32 w-auto"
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create interactive whiteboard sessions for your classroom. 
            Real-time collaboration between teachers and up to 8 students with OctoPi Ink.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">Teacher Login</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Multi-User Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Support for 1 teacher and up to 8 students in real-time collaborative sessions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Real-Time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Instant synchronization of drawings, annotations, and interactions across all devices.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Secure Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Unique session URLs and name-based authentication ensure only authorized students can join.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Monitor className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Split Screen View</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Teachers can view their main board and monitor all student boards simultaneously.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">How OctoPi Ink Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Session</h3>
              <p className="text-gray-600">
                Teachers create a new session, add student names, and get a unique sharing URL.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Students Join</h3>
              <p className="text-gray-600">
                Students use the URL to join, enter their name, and access their personal whiteboard.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
              <p className="text-gray-600">
                Real-time drawing, annotations, and interactions between teacher and students.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Teaching with OctoPi Ink?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of educators using our collaborative whiteboard platform.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">Create Teacher Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
