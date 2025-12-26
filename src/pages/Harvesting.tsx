import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import InputForm from "@/components/InputForm";
import Results from "@/components/Results";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Droplets, Leaf, TrendingUp, Info } from "lucide-react";

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

function HarvestingContent() {
  const { toast } = useToast();
  const { user, trackActivity } = useAuth();
  const { profile } = useProfile();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const { data: result, error } = await supabase.functions.invoke(
        "predict-harvesting",
        { body: data }
      );

      if (error) {
        toast({
          title: "Prediction Failed",
          description: error.message || "Failed to generate AI predictions.",
          variant: "destructive",
        });
        return;
      }

      if (result.error) {
        toast({
          title: "AI Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setPrediction(result);

      // Save to database
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

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Rainwater Harvesting Recommendations
          </h1>
          <p className="text-muted-foreground">
            Get AI-powered analysis for your building's rainwater harvesting potential
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Water Savings</h3>
                <p className="text-sm text-muted-foreground">
                  Calculate potential annual water harvest based on your roof area
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Eco Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Understand your environmental contribution with CO₂ metrics
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Cost Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get estimated costs and payback period calculations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <InputForm onSubmit={handleFormSubmit} initialData={getInitialFormData()} />

        {/* Results */}
        {formData && (isLoading || prediction) && (
          <div id="results">
            <Results data={formData} prediction={prediction} isLoading={isLoading} />
          </div>
        )}

        {/* Empty State Info */}
        {!formData && !prediction && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
              <CardDescription>
                Our AI analyzes multiple factors to provide accurate recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Input Factors</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Location & local rainfall patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Roof area and catchment surface
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Soil type for groundwater recharge
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Ground slope for water flow
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">AI Recommendations</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Optimal harvesting structure
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Annual harvest potential in liters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Implementation guidelines
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Cost and payback estimates
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function Harvesting() {
  return (
    <ProtectedRoute>
      <HarvestingContent />
    </ProtectedRoute>
  );
}
