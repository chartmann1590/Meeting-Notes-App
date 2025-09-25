import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, XCircle, Brain, Mic, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ServiceStatus {
  connected: boolean;
  currentModel?: string;
  availableModels?: string[];
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
          <div className="space-y-3">
            <p className="text-sm text-green-600 font-medium">
              ✅ Service is running and accessible
            </p>
            
            {/* Current Model */}
            {status.currentModel && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Currently Using:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {status.currentModel}
                  </span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              </div>
            )}
            
            {/* Available Models */}
            {status.availableModels && status.availableModels.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Available Models ({status.availableModels.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {status.availableModels.map((model, index) => (
                    <span
                      key={index}
                      className={`font-mono text-xs px-2 py-1 rounded ${
                        model === status.currentModel
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* No models available */}
            {status.availableModels && status.availableModels.length === 0 && (
              <div className="space-y-1">
                <p className="text-sm text-amber-600 font-medium">⚠️ No models found</p>
                <p className="text-xs text-slate-500">
                  Pull models using: <code className="bg-slate-100 px-1 rounded">ollama pull &lt;model-name&gt;</code>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">
              ❌ Service is not accessible
            </p>
            
            {/* Show configured model even when disconnected */}
            {status.currentModel && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Configured Model:</p>
                <span className="font-mono bg-red-50 text-red-700 px-2 py-1 rounded text-sm">
                  {status.currentModel}
                </span>
              </div>
            )}
            
            {status.error && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Error Details:</p>
                <p className="text-sm text-slate-600">
                  <span className="font-mono bg-red-50 px-2 py-1 rounded text-red-700">{status.error}</span>
                </p>
              </div>
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

      {/* Model Information */}
      {servicesStatus && (servicesStatus.ollama.connected || servicesStatus.whisper.connected) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Model Information
            </CardTitle>
            <CardDescription>
              Detailed information about available and configured models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ollama Models */}
            {servicesStatus.ollama.connected && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  Ollama LLM Models
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Model:</span>
                    <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {servicesStatus.ollama.currentModel || 'Not configured'}
                    </span>
                  </div>
                  {servicesStatus.ollama.availableModels && servicesStatus.ollama.availableModels.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Available Models:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {servicesStatus.ollama.availableModels.map((model, index) => (
                          <span
                            key={index}
                            className={`font-mono text-xs px-2 py-1 rounded ${
                              model === servicesStatus.ollama.currentModel
                                ? 'bg-blue-200 text-blue-900 border border-blue-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Whisper Models */}
            {servicesStatus.whisper.connected && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-600" />
                  Whisper Transcription Models
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Model:</span>
                    <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {servicesStatus.whisper.currentModel || 'Not configured'}
                    </span>
                  </div>
                  {servicesStatus.whisper.availableModels && servicesStatus.whisper.availableModels.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Available Models:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {servicesStatus.whisper.availableModels.map((model, index) => (
                          <span
                            key={index}
                            className={`font-mono text-xs px-2 py-1 rounded ${
                              model === servicesStatus.whisper.currentModel
                                ? 'bg-green-200 text-green-900 border border-green-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Management Tips */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">💡 Model Management Tips</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use <code className="bg-blue-100 px-1 rounded">ollama list</code> to see all installed models</li>
                <li>• Use <code className="bg-blue-100 px-1 rounded">ollama pull &lt;model-name&gt;</code> to install new models</li>
                <li>• Use <code className="bg-blue-100 px-1 rounded">ollama rm &lt;model-name&gt;</code> to remove unused models</li>
                <li>• Model names are case-sensitive and must match exactly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-4">
              <p className="font-medium">Some services are not connected. Here's how to fix this:</p>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">1. Start Ollama Service:</p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-sm">ollama serve</code>
                </div>
                
                <div>
                  <p className="font-medium text-sm">2. Install Required Models:</p>
                  <div className="space-y-1 ml-4">
                    <p className="text-sm">For AI Summaries:</p>
                    <code className="bg-yellow-100 px-2 py-1 rounded text-sm">ollama pull llama3.2:3b</code>
                    <p className="text-sm">For Transcription:</p>
                    <code className="bg-yellow-100 px-2 py-1 rounded text-sm">ollama pull whisper</code>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm">3. Verify Installation:</p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-sm">ollama list</code>
                </div>
                
                <div>
                  <p className="font-medium text-sm">4. Check Service Access:</p>
                  <p className="text-sm">Ensure Ollama is accessible at <code className="bg-yellow-100 px-1 rounded">http://localhost:11434</code></p>
                </div>
                
                <div>
                  <p className="font-medium text-sm">5. Restart Application:</p>
                  <p className="text-sm">After setting up services, refresh this page or restart the application</p>
                </div>
              </div>
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