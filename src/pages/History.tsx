import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Droplet, Trash2, MessageCircle, Building2, Mountain, Layers, Activity, LogIn, LogOutIcon, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserActivity {
  id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Prediction {
  id: string;
  location: string;
  roof_area: number;
  soil_type: string;
  slope: string;
  annual_harvest_potential: number;
  monthly_average: number;
  recommended_structure: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  message: string;
  role: string;
  created_at: string;
}

function HistoryContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const [predictionsResult, messagesResult, activityResult] = await Promise.all([
        supabase.from("predictions").select("*").order("created_at", { ascending: false }),
        supabase.from("chat_messages").select("*").order("created_at", { ascending: false }),
        supabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      if (predictionsResult.error) throw predictionsResult.error;
      if (messagesResult.error) throw messagesResult.error;

      setPredictions(predictionsResult.data || []);
      setChatMessages(messagesResult.data || []);
      setUserActivity((activityResult.data as UserActivity[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("predictions").delete().eq("id", id);

      if (error) throw error;

      setPredictions(predictions.filter((p) => p.id !== id));
      toast({
        title: "Success",
        description: "Prediction deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete prediction",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">History</h1>
          <p className="text-muted-foreground">
            View your rainwater harvesting analyses and chatbot conversations
          </p>
        </div>

        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
            <TabsTrigger value="predictions">
              <Droplet className="w-4 h-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="chatbot">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chatbot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Droplet className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No predictions yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start by analyzing your first building for rainwater harvesting potential
              </p>
              <Button onClick={() => navigate("/")}>Create First Analysis</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <MapPin className="w-6 h-6 text-primary" />
                        Area: {prediction.location}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        Searched on: {new Date(prediction.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prediction.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Input Data You Entered:
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Roof:</span>
                        <span className="font-medium">{prediction.roof_area} m²</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Soil:</span>
                        <span className="font-medium capitalize">{prediction.soil_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mountain className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Slope:</span>
                        <span className="font-medium capitalize">{prediction.slope}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{prediction.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Water Harvesting Potential</p>
                      <p className="text-2xl font-bold text-primary">
                        {prediction.annual_harvest_potential?.toLocaleString()} L
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">per year</p>
                    </div>
                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Recommended System</p>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        {prediction.recommended_structure}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="chatbot">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : chatMessages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No chatbot conversations yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Start chatting with the AI assistant to get help with rainwater harvesting
                  </p>
                  <Button onClick={() => navigate("/")}>Start Chatting</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Chatbot Conversation History</CardTitle>
                  <CardDescription>
                    Questions you asked and responses from the AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted border'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold uppercase">
                                {msg.role === 'user' ? 'You' : 'AI Assistant'}
                              </span>
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userActivity.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No activity recorded</h3>
                  <p className="text-muted-foreground text-center">
                    Your login history and actions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Your login history, predictions, and other activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {userActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className={`p-2 rounded-full ${
                            activity.activity_type === 'login' ? 'bg-green-100 text-green-600' :
                            activity.activity_type === 'logout' ? 'bg-orange-100 text-orange-600' :
                            activity.activity_type === 'prediction' ? 'bg-blue-100 text-blue-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {activity.activity_type === 'login' && <LogIn className="w-4 h-4" />}
                            {activity.activity_type === 'logout' && <LogOutIcon className="w-4 h-4" />}
                            {activity.activity_type === 'prediction' && <ClipboardList className="w-4 h-4" />}
                            {!['login', 'logout', 'prediction'].includes(activity.activity_type) && (
                              <Activity className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">
                              {activity.activity_type === 'login' && 'Logged in'}
                              {activity.activity_type === 'logout' && 'Logged out'}
                              {activity.activity_type === 'prediction' && 'Made a prediction'}
                              {!['login', 'logout', 'prediction'].includes(activity.activity_type) && activity.activity_type}
                            </p>
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.activity_type === 'prediction' && activity.metadata.location && (
                                  <>Location: {String(activity.metadata.location)}</>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Wrap with ProtectedRoute
const History = () => (
  <ProtectedRoute>
    <HistoryContent />
  </ProtectedRoute>
);

export default History;
