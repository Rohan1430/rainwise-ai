import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";
import { Button } from "@/components/ui/button";
import { LogOut, History, User } from "lucide-react";
import Hero from "@/components/Hero";
import InputForm from "@/components/InputForm";
import Results from "@/components/Results";
import Chatbot from "@/components/Chatbot";

interface FormData {
  location: string;
  roofArea: string;
  soilType: string;
  slope: string;
}

interface PredictionData {
  annualHarvestPotential: number;
  monthlyAverage: number;
  rechargeEfficiency: number;
  recommendedStructure: string;
  structureDescription: string;
  benefits: string[];
  implementationNotes: string[];
  estimatedCost?: string;
  paybackPeriod?: string;
  environmentalImpact?: string;
}

function DashboardContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, trackActivity } = useAuth();
  const { profile } = useProfile();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill form data from profile if available
  const getInitialFormData = (): Partial<FormData> => {
    if (!profile) return {};
    return {
      location: profile.location || "",
      roofArea: profile.roof_area?.toString() || "",
    };
  };

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setIsLoading(true);
    setPrediction(null);

    try {
      console.log("Calling AI prediction function...");
      const { data: result, error } = await supabase.functions.invoke(
        "predict-harvesting",
        {
          body: data,
        }
      );

      if (error) {
        console.error("Prediction error:", error);
        toast({
          title: "Prediction Failed",
          description:
            error.message || "Failed to generate AI predictions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (result.error) {
        console.error("AI error:", result.error);
        toast({
          title: "AI Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log("Prediction received:", result);
      setPrediction(result);

      // Save prediction to database
      if (user) {
        await supabase.from("predictions").insert({
          user_id: user.id,
          location: data.location,
          roof_area: parseFloat(data.roofArea),
          soil_type: data.soilType,
          slope: data.slope,
          annual_harvest_potential: result.annualHarvestPotential,
          monthly_average: result.monthlyAverage,
          recharge_efficiency: result.rechargeEfficiency,
          recommended_structure: result.recommendedStructure,
          structure_description: result.structureDescription,
          benefits: result.benefits,
          implementation_notes: result.implementationNotes,
          estimated_cost: result.estimatedCost,
          payback_period: result.paybackPeriod,
          environmental_impact: result.environmentalImpact,
        });
        
        // Track prediction activity
        await trackActivity("prediction", {
          location: data.location,
          roof_area: parseFloat(data.roofArea),
          annual_harvest: result.annualHarvestPotential,
        });
      }

      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed your building data!",
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">RainIQ</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/history")}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Profile Summary Card */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 mb-8 relative z-10">
        <ProfileSummaryCard profile={profile} />
      </section>

      {/* Input Form - pass initial data from profile */}
      <InputForm onSubmit={handleFormSubmit} initialData={getInitialFormData()} />

      {/* Results Section */}
      {formData && (isLoading || prediction) && (
        <div id="results">
          <Results data={formData} prediction={prediction} isLoading={isLoading} />
        </div>
      )}

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}

// Wrap with ProtectedRoute
const Index = () => (
  <ProtectedRoute>
    <DashboardContent />
  </ProtectedRoute>
);

export default Index;
