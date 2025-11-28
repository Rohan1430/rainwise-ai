import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setIsLoading(true);
    setPrediction(null);

    try {
      console.log('Calling AI prediction function...');
      const { data: result, error } = await supabase.functions.invoke('predict-harvesting', {
        body: data
      });

      if (error) {
        console.error('Prediction error:', error);
        toast({
          title: "Prediction Failed",
          description: error.message || "Failed to generate AI predictions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (result.error) {
        console.error('AI error:', result.error);
        toast({
          title: "AI Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log('Prediction received:', result);
      setPrediction(result);
      
      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed your building data!",
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Unexpected error:', error);
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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <Hero />
      <InputForm onSubmit={handleFormSubmit} />
      {(formData && (isLoading || prediction)) && (
        <div id="results">
          <Results data={formData} prediction={prediction} isLoading={isLoading} />
        </div>
      )}
      <Chatbot />
    </div>
  );
};

export default Index;