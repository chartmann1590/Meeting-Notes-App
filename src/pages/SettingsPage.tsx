import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, XCircle, Brain, Mic, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ServiceStatus {
  connected: boolean;
  model?: string;
  error?: string;
}

interface ServicesStatus {
  ollama: ServiceStatus;
  whisper: ServiceStatus;
  timestamp: string;
}

export function SettingsPage() {
  const [servicesStatus, setServicesStatus] = useState<ServicesStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkServicesStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking services status...');
      const response = await fetch('/api/services/status');
      const result = await response.json();
      
      if (result.success) {
        setServicesStatus(result.data);
        console.log('✅ Services status updated:', result.data);
      } else {
        throw new Error(result.error || 'Failed to check services status');
      }
    } catch (error) {
      console.error('❌ Failed to check services status:', error);
      toast.error('Failed to check services status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServicesStatus();
  }, []);

  const ServiceStatusCard = ({ 
    title, 
    icon, 
    status, 
    description 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    status: ServiceStatus; 
    description: string;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge 
            variant={status.connected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {status.connected ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status.connected ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600 font-medium">
              ✅ Service is running and accessible
            </p>
            {status.model && (
              <p className="text-sm text-slate-600">
                Model: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{status.model}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">
              ❌ Service is not accessible
            </p>
            {status.error && (
              <p className="text-sm text-slate-600">
                Error: <span className="font-mono bg-red-50 px-2 py-1 rounded text-red-700">{status.error}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-600">Manage your application preferences and check service status.</p>
      </div>

      {/* AI Services Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Services Status
              </CardTitle>
              <CardDescription>
                Check the connection status of Ollama and Whisper services
              </CardDescription>
            </div>
            <Button 
              onClick={checkServicesStatus} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {servicesStatus ? (
            <>
              <ServiceStatusCard
                title="Ollama LLM Service"
                icon={<Brain className="w-5 h-5 text-blue-600" />}
                status={servicesStatus.ollama}
                description="Generates AI summaries from meeting transcripts"
              />
              <ServiceStatusCard
                title="Whisper Transcription Service"
                icon={<Mic className="w-5 h-5 text-green-600" />}
                status={servicesStatus.whisper}
                description="Converts audio to text for live transcription"
              />
              <div className="text-xs text-slate-500 pt-2 border-t">
                Last checked: {new Date(servicesStatus.timestamp).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading service status...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      {servicesStatus && (!servicesStatus.ollama.connected || !servicesStatus.whisper.connected) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <div className="space-y-3">
              <p className="font-medium">Some services are not connected. Here's how to fix this:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Make sure Ollama is installed and running: <code className="bg-yellow-100 px-1 rounded">ollama serve</code></li>
                <li>Pull the required models: <code className="bg-yellow-100 px-1 rounded">ollama pull llama3.2:3b</code> and <code className="bg-yellow-100 px-1 rounded">ollama pull whisper</code></li>
                <li>Check that Ollama is accessible at <code className="bg-yellow-100 px-1 rounded">http://localhost:11434</code></li>
                <li>Restart the application after setting up the services</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-medium">Toggle Theme</span>
            <ThemeToggle className="relative top-0 right-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}