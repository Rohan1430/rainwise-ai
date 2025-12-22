import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileData, HARVESTING_METHODS } from "@/hooks/useProfile";
import { ProfileAvatar } from "./ProfileAvatar";
import { MapPin, Droplets, Home, CloudRain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileSummaryCardProps {
  profile: ProfileData | null;
  showEditButton?: boolean;
}

/**
 * ProfileSummaryCard - Displays a summary of user's profile and rainwater potential
 * Used on the dashboard to show quick stats
 */
export function ProfileSummaryCard({ profile, showEditButton = true }: ProfileSummaryCardProps) {
  const navigate = useNavigate();

  // Calculate estimated harvestable rainwater based on profile data
  const estimatedHarvest = useMemo(() => {
    if (!profile?.roof_area) return null;
    
    // Basic calculation: roof_area * average annual rainfall (800mm) * runoff coefficient (0.8)
    // This is a simplified estimate - actual predictions use AI
    const avgRainfallMm = 800;
    const runoffCoefficient = 0.8;
    const annualLiters = profile.roof_area * avgRainfallMm * runoffCoefficient;
    return Math.round(annualLiters);
  }, [profile?.roof_area]);

  // Get storage recommendation
  const storageRecommendation = useMemo(() => {
    if (!estimatedHarvest) return null;
    if (!profile?.tank_capacity) {
      return {
        status: "unknown",
        message: "Set your tank capacity to get recommendations",
      };
    }

    const monthlyAvg = estimatedHarvest / 12;
    const tankCapacity = profile.tank_capacity;

    if (tankCapacity >= monthlyAvg * 2) {
      return {
        status: "excellent",
        message: "Your tank can store 2+ months of harvest",
      };
    } else if (tankCapacity >= monthlyAvg) {
      return {
        status: "good",
        message: "Your tank can store 1 month of harvest",
      };
    } else {
      return {
        status: "upgrade",
        message: `Consider upgrading to ${Math.round(monthlyAvg * 1.5).toLocaleString()}L capacity`,
      };
    }
  }, [estimatedHarvest, profile?.tank_capacity]);

  // Get harvesting method label
  const harvestingMethodLabel = useMemo(() => {
    if (!profile?.harvesting_method) return null;
    const method = HARVESTING_METHODS.find((m) => m.value === profile.harvesting_method);
    return method?.label || profile.harvesting_method;
  }, [profile?.harvesting_method]);

  if (!profile) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">Complete your profile to see personalized insights</p>
          <Button onClick={() => navigate("/profile")}>
            Complete Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            name={profile.full_name}
            email={profile.email}
            size="lg"
          />
          <div className="flex-1">
            <CardTitle className="text-xl">
              {profile.full_name || profile.email?.split("@")[0] || "User"}
            </CardTitle>
            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {profile.location}
              </p>
            )}
          </div>
          {showEditButton && (
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location & Roof */}
          <div className="space-y-3">
            {profile.roof_area && (
              <div className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Roof Area:</span>
                <span className="font-medium">{profile.roof_area} m²</span>
              </div>
            )}
            {profile.tank_capacity && (
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-muted-foreground">Tank:</span>
                <span className="font-medium">{profile.tank_capacity.toLocaleString()}L</span>
              </div>
            )}
            {harvestingMethodLabel && (
              <div className="flex items-center gap-2 text-sm">
                <CloudRain className="w-4 h-4 text-cyan-500" />
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium">{harvestingMethodLabel}</span>
              </div>
            )}
          </div>

          {/* Estimated Harvest */}
          {estimatedHarvest && (
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Est. Annual Harvest
              </p>
              <p className="text-2xl font-bold text-primary">
                {(estimatedHarvest / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground">liters/year</p>
            </div>
          )}

          {/* Storage Recommendation */}
          {storageRecommendation && (
            <div
              className={`rounded-lg p-4 text-center ${
                storageRecommendation.status === "excellent"
                  ? "bg-green-500/10"
                  : storageRecommendation.status === "good"
                  ? "bg-blue-500/10"
                  : storageRecommendation.status === "upgrade"
                  ? "bg-amber-500/10"
                  : "bg-muted"
              }`}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Storage Status
              </p>
              <p
                className={`text-sm font-medium ${
                  storageRecommendation.status === "excellent"
                    ? "text-green-600"
                    : storageRecommendation.status === "good"
                    ? "text-blue-600"
                    : storageRecommendation.status === "upgrade"
                    ? "text-amber-600"
                    : "text-muted-foreground"
                }`}
              >
                {storageRecommendation.message}
              </p>
            </div>
          )}
        </div>

        {/* Show prompt to complete profile if missing key data */}
        {(!profile.roof_area || !profile.location) && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Add your roof area and location for personalized predictions
            </p>
            <Button variant="link" size="sm" onClick={() => navigate("/profile")}>
              Complete Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
