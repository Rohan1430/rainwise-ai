import { useState } from "react";
import Hero from "@/components/Hero";
import InputForm from "@/components/InputForm";
import Results from "@/components/Results";

interface FormData {
  location: string;
  roofArea: string;
  soilType: string;
  slope: string;
}

const Index = () => {
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleFormSubmit = (data: FormData) => {
    setFormData(data);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <InputForm onSubmit={handleFormSubmit} />
      {formData && (
        <div id="results">
          <Results data={formData} />
        </div>
      )}
    </div>
  );
};

export default Index;