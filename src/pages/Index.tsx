import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [formData, setFormData] = useState<FormData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
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