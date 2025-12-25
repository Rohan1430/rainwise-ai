import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  description: string;
  rainfall: number;
  windSpeed: number;
  feelsLike: number;
  visibility: number;
  pressure: number;
  cloudiness: number;
  rainChance: number;
}

// Weather-related keywords for intent detection
const weatherKeywords = [
  'weather', 'temperature', 'temp', 'rain', 'rainfall', 'raining', 'rainy',
  'humidity', 'humid', 'forecast', 'climate', 'hot', 'cold', 'warm', 'cool',
  'sunny', 'cloudy', 'storm', 'wind', 'windy', 'harvest today', 'can i harvest',
  'should i harvest', 'good day for', 'today', 'tomorrow', 'air quality',
  'मौसम', 'बारिश', 'तापमान' // Hindi support
];

function detectWeatherIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return weatherKeywords.some(keyword => lowerMessage.includes(keyword));
}

function extractLocation(message: string): string | null {
  // Common patterns for location mentions
  const patterns = [
    /(?:in|at|for|near)\s+([a-zA-Z\s]+?)(?:\s*[,.]|\s+today|\s+tomorrow|$)/i,
    /(?:weather|temperature|rain(?:fall)?)\s+(?:in|at|for)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:weather|temperature|rain)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common non-location words
      const nonLocations = ['today', 'tomorrow', 'now', 'current', 'the', 'my', 'your'];
      if (!nonLocations.includes(location.toLowerCase()) && location.length > 2) {
        return location;
      }
    }
  }
  return null;
}

async function fetchWeatherData(location: string): Promise<WeatherData | null> {
  const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
  
  if (!apiKey) {
    console.error('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    // Fetch current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      console.error('Weather API error:', weatherResponse.status, await weatherResponse.text());
      return null;
    }
    
    const weatherData = await weatherResponse.json();
    
    // Calculate rain chance based on clouds and humidity
    const cloudiness = weatherData.clouds?.all || 0;
    const humidity = weatherData.main?.humidity || 0;
    const rainChance = Math.min(100, Math.round((cloudiness * 0.5) + (humidity * 0.3) + (weatherData.rain ? 20 : 0)));
    
    return {
      temperature: Math.round(weatherData.main?.temp || 0),
      humidity: weatherData.main?.humidity || 0,
      condition: weatherData.weather?.[0]?.main || 'Unknown',
      description: weatherData.weather?.[0]?.description || 'No description available',
      rainfall: weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0,
      windSpeed: Math.round(weatherData.wind?.speed || 0),
      feelsLike: Math.round(weatherData.main?.feels_like || 0),
      visibility: Math.round((weatherData.visibility || 0) / 1000),
      pressure: weatherData.main?.pressure || 0,
      cloudiness: cloudiness,
      rainChance: rainChance,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function generateHarvestingAdvice(weather: WeatherData): string {
  const advice: string[] = [];
  
  if (weather.rainChance >= 70 || weather.rainfall > 0) {
    advice.push("✅ **Excellent for harvesting!** High probability of rainfall makes today ideal for rooftop rainwater collection.");
  } else if (weather.rainChance >= 40) {
    advice.push("⚠️ **Moderate harvesting potential.** There's a fair chance of rain. Keep your collection system ready.");
  } else {
    advice.push("❌ **Low harvesting potential today.** Unlikely to rain, but ensure your system is maintained for future rainfall.");
  }
  
  if (weather.humidity > 70) {
    advice.push("High humidity indicates moisture in the air, which often precedes rainfall.");
  }
  
  if (weather.cloudiness > 60) {
    advice.push("Heavy cloud cover suggests possible precipitation.");
  }
  
  return advice.join(" ");
}

function formatWeatherResponse(weather: WeatherData, location: string): string {
  const harvestAdvice = generateHarvestingAdvice(weather);
  
  return `
## 🌤️ Current Weather in ${location}

| Metric | Value |
|--------|-------|
| 🌡️ Temperature | ${weather.temperature}°C (feels like ${weather.feelsLike}°C) |
| 💧 Humidity | ${weather.humidity}% |
| ☁️ Condition | ${weather.condition} - ${weather.description} |
| 🌧️ Rainfall (last hour) | ${weather.rainfall} mm |
| 🌬️ Wind Speed | ${weather.windSpeed} m/s |
| 👁️ Visibility | ${weather.visibility} km |
| ☁️ Cloud Cover | ${weather.cloudiness}% |
| 🌧️ Rain Probability | ${weather.rainChance}% |

### 💧 Rainwater Harvesting Advice
${harvestAdvice}
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userLocation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const isWeatherIntent = detectWeatherIntent(lastMessage);
    
    let weatherContext = '';
    let extractedLocation = extractLocation(lastMessage) || userLocation;
    
    if (isWeatherIntent) {
      if (extractedLocation) {
        console.log(`Fetching weather for: ${extractedLocation}`);
        const weatherData = await fetchWeatherData(extractedLocation);
        
        if (weatherData) {
          weatherContext = formatWeatherResponse(weatherData, extractedLocation);
          console.log('Weather data fetched successfully');
        } else {
          weatherContext = `⚠️ I couldn't fetch weather data for "${extractedLocation}". Please check the location name and try again.`;
        }
      } else {
        // Ask for location if not provided
        return new Response(
          JSON.stringify({ 
            message: "🌍 I'd be happy to help with weather information! Could you please tell me your city or location? For example, you can say 'weather in Mumbai' or 'temperature in Delhi'.",
            needsLocation: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const systemPrompt = `You are RainIQ Assistant, an expert AI for rainwater harvesting, water sustainability, and weather analysis. Your knowledge domains:

1. **Weather & Climate**: Temperature, rainfall, humidity, forecasts, seasonal patterns
2. **Rainwater Harvesting**: Collection methods, storage, filtration, system design
3. **Water Quality**: pH levels, contamination, purification methods
4. **Groundwater Recharge**: Percolation pits, recharge wells, trenches
5. **Sustainability**: Water conservation, eco-friendly practices

CRITICAL RULES:
- ONLY answer questions within the RainIQ domain (weather, water, harvesting, sustainability)
- If asked about unrelated topics, politely redirect to your domain expertise
- NEVER guess or make up weather data - use only the real-time data provided
- Be conversational, helpful, and provide actionable advice
- Use simple language that everyone can understand
- When weather data is provided, incorporate it naturally into your response

${weatherContext ? `\n\n**REAL-TIME WEATHER DATA (USE THIS IN YOUR RESPONSE):**\n${weatherContext}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
