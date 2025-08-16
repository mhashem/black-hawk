import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-project-diagram text-white text-2xl"></i>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              ServiceHub
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Monitor your Spring Boot microservices in real-time
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  Real-time health monitoring
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  Service status tracking
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  Kafka Streams monitoring
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  Role-based access control
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/api/login'}
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In to Get Started
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 mt-4">
                Sign in with your Replit account to access the dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}