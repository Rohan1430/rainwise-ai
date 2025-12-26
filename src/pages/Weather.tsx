import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CloudRain,
  Sun,
  Cloud,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Search,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  rainChance: number;
  description: string;
  harvestAdvice: string;
}

function WeatherContent() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [location, setLocation] = useState(profile?.location || "");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a city name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("chatbot", {
        body: {
          messages: [{ role: "user", content: `What is the current weather in ${location}?` }],
          userLocation: location,
        },
      });

      if (fnError) throw fnError;

      // Parse weather data from response
      if (data.weatherData) {
        const wd = data.weatherData;
        setWeather({
          location: location,
          temperature: wd.temperature || 0,
          condition: wd.condition || "Unknown",
          humidity: wd.humidity || 0,
          windSpeed: wd.windSpeed || 0,
          rainfall: wd.rainfall || 0,
          rainChance: wd.rainChance || 0,
          description: wd.description || "",
          harvestAdvice: data.message || "",
        });
      } else {
        // Fallback: show the AI response
        setWeather({
          location: location,
          temperature: 0,
          condition: "Unknown",
          humidity: 0,
          windSpeed: 0,
          rainfall: 0,
          rainChance: 0,
          description: "",
          harvestAdvice: data.message || "Unable to fetch weather data. Please try again.",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather data");
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="w-16 h-16 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-16 h-16 text-muted-foreground" />;
    if (c.includes("partly") || c.includes("few")) return <CloudSun className="w-16 h-16 text-yellow-500" />;
    return <Sun className="w-16 h-16 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Weather Insights
          </h1>
          <p className="text-muted-foreground">
            Real-time weather data and rainfall forecasts for your location
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter city name (e.g., Mumbai, Delhi)"
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
                />
              </div>
              <Button onClick={fetchWeather} disabled={loading} className="btn-animate">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Get Weather
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Weather Display */}
        {weather && (
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
            {/* Main Weather Card */}
            <Card className="md:col-span-2">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center">
                    {getWeatherIcon(weather.condition)}
                    <p className="text-lg font-medium text-foreground mt-2">
                      {weather.condition}
                    </p>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      {weather.location}
                    </h2>
                    <p className="text-5xl font-bold text-primary">
                      {weather.temperature}°C
                    </p>
                    <p className="text-muted-foreground mt-2">{weather.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  Humidity & Rain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Humidity</span>
                  <span className="text-xl font-semibold text-foreground">
                    {weather.humidity}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rain Chance</span>
                  <span className="text-xl font-semibold text-primary">
                    {weather.rainChance}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rainfall</span>
                  <span className="text-xl font-semibold text-foreground">
                    {weather.rainfall} mm
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-primary" />
                  Wind & Temperature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wind Speed</span>
                  <span className="text-xl font-semibold text-foreground">
                    {weather.windSpeed} km/h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="text-xl font-semibold text-foreground">
                    {weather.temperature}°C
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Harvest Advice */}
            <Card className="md:col-span-2 border-secondary/30 bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Droplets className="w-5 h-5" />
                  Rainwater Harvesting Advice
                </CardTitle>
                <CardDescription>
                  Based on current weather conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {weather.harvestAdvice}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!weather && !loading && !error && (
          <Card>
            <CardContent className="py-16 text-center">
              <CloudRain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Check Your Local Weather
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your city name above to get real-time weather data and
                personalized rainwater harvesting recommendations.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function Weather() {
  return (
    <ProtectedRoute>
      <WeatherContent />
    </ProtectedRoute>
  );
}
