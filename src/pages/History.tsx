import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, MapPin, Droplet, Trash2, User, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const History = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        fetchPredictions();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPredictions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load prediction history",
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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" onClick={() => navigate("/")}>
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
        <Button variant="outline" onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          Profile
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Prediction History</h1>
          <p className="text-muted-foreground">
            View and manage your past searches - Areas you've analyzed for rainwater harvesting
          </p>
        </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Roof Area</p>
                      <p className="font-semibold">{prediction.roof_area} sq. meters</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Soil Type</p>
                      <p className="font-semibold capitalize">{prediction.soil_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Potential</p>
                      <p className="font-semibold text-primary">
                        {prediction.annual_harvest_potential?.toLocaleString()} liters
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommended Structure</p>
                      <p className="font-semibold">{prediction.recommended_structure}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
