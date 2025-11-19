import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, roofArea, soilType, slope } = await req.json();
    console.log('Received prediction request:', { location, roofArea, soilType, slope });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create detailed prompt for AI prediction
    const prompt = `You are an expert in rainwater harvesting and groundwater recharge systems. Analyze the following building parameters and provide detailed predictions and recommendations.

Building Details:
- Location: ${location}
- Roof Area: ${roofArea} square meters
- Soil Type: ${soilType}
- Land Slope: ${slope} degrees

Based on these parameters, provide a JSON response with the following structure:
{
  "annualHarvestPotential": <number in liters>,
  "monthlyAverage": <number in liters>,
  "rechargeEfficiency": <percentage 0-100>,
  "recommendedStructure": "<structure name>",
  "structureDescription": "<brief description>",
  "benefits": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],
  "implementationNotes": ["<note 1>", "<note 2>", "<note 3>"],
  "estimatedCost": "<cost range in INR>",
  "paybackPeriod": "<estimated payback period>",
  "environmentalImpact": "<description of environmental benefits>"
}

Consider:
1. Average rainfall patterns in ${location}
2. Soil infiltration rates for ${soilType} soil
3. Runoff coefficient based on ${slope} slope
4. Most suitable recharge structure (percolation pit, recharge well, recharge trench, storage tank, etc.)
5. Realistic cost estimates for implementation
6. Water conservation potential and environmental impact

Provide accurate, data-driven predictions based on hydrological principles.`;

    console.log('Calling Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert environmental engineer specializing in rainwater harvesting and groundwater recharge. Provide accurate, scientific predictions based on hydrological data and local conditions. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), 
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI prediction:', aiResponse);

    // Parse the JSON response from AI
    let prediction;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', aiResponse);
      throw new Error("Failed to parse AI prediction");
    }

    return new Response(
      JSON.stringify(prediction),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in predict-harvesting function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while generating predictions' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});