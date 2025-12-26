import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CloudRain,
  Droplets,
  MessageCircle,
  History,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
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

const quickActions = [
  {
    title: "Check Weather",
    description: "Get real-time weather and rainfall data",
    icon: <CloudRain className="w-6 h-6" />,
    path: "/weather",
    color: "primary",
  },
  {
    title: "Get Recommendations",
    description: "AI-powered harvesting analysis",
    icon: <Droplets className="w-6 h-6" />,
    path: "/harvesting",
    color: "secondary",
  },
  {
    title: "Chat with AI",
    description: "Ask questions about water conservation",
    icon: <MessageCircle className="w-6 h-6" />,
    path: "/chatbot",
    color: "primary",
  },
  {
    title: "View History",
    description: "See your past predictions and chats",
    icon: <History className="w-6 h-6" />,
    path: "/history",
    color: "secondary",
  },
];

function DashboardContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
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

      {/* Hero Section */}
      <Hero />

      {/* Profile Summary */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 mb-8 relative z-10">
        <ProfileSummaryCard profile={profile} />
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Card
              key={idx}
              className="card-hover cursor-pointer group"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    action.color === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {action.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  {action.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Analysis Form */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Analysis
            </CardTitle>
            <CardDescription>
              Get instant rainwater harvesting recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InputForm onSubmit={handleFormSubmit} initialData={getInitialFormData()} />
          </CardContent>
        </Card>
      </section>

      {/* Results */}
      {formData && (isLoading || prediction) && (
        <div id="results">
          <Results data={formData} prediction={prediction} isLoading={isLoading} />
        </div>
      )}

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
