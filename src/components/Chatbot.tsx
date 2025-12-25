import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, CloudRain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your **RainIQ Assistant**. I can help you with:\n\n- 🌤️ Real-time weather updates\n- 🌧️ Rainfall forecasts\n- 💧 Rainwater harvesting advice\n- 🌱 Water sustainability tips\n\nJust ask me about the weather in your city or any water-related questions!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          message: userMessage.content,
          role: 'user'
        });
      }

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          messages: [...messages, userMessage],
          userLocation: userLocation
        }
      });

      if (error) {
        console.error('Chatbot error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to get response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // If the chatbot needs location, remember it for future queries
      if (data.needsLocation) {
        // Extract location from subsequent user messages
        const locationMatch = input.match(/(?:in|at|for)\s+([a-zA-Z\s]+)/i);
        if (locationMatch) {
          setUserLocation(locationMatch[1].trim());
        }
      }

      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          message: assistantMessage.content,
          role: 'assistant'
        });
      }

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-rain-500 to-eco-500 hover:from-rain-600 hover:to-eco-600"
          size="icon"
        >
          <CloudRain className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[520px] flex flex-col shadow-2xl z-50 overflow-hidden border-rain-200 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-rain-600 to-rain-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-heading">RainIQ Assistant</h3>
                <p className="text-xs text-rain-100">Live weather & harvesting advice</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-rain-50/50 to-background">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-rain-500 to-rain-600 text-white rounded-br-sm'
                      : 'bg-white border border-rain-100 shadow-sm rounded-bl-sm'
                  }`}
                >
                  <div className="text-sm prose prose-sm max-w-none prose-headings:text-rain-700 prose-headings:font-heading prose-strong:text-rain-700 prose-table:text-xs">
                    <ReactMarkdown
                      components={{
                        table: ({ children }) => (
                          <table className="w-full text-xs border-collapse my-2">
                            {children}
                          </table>
                        ),
                        th: ({ children }) => (
                          <th className="border border-rain-200 bg-rain-50 px-2 py-1 text-left font-medium">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-rain-100 px-2 py-1">
                            {children}
                          </td>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-semibold text-rain-700 mt-2 mb-1">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-semibold text-rain-600 mt-2 mb-1">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className={`${message.role === 'user' ? 'text-white' : 'text-foreground'} my-1`}>
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside my-1 space-y-0.5">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className={`${message.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                            {children}
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className={`font-semibold ${message.role === 'user' ? 'text-white' : 'text-rain-700'}`}>
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-rain-100 shadow-sm rounded-2xl rounded-bl-sm p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-rain-500" />
                    <span className="text-sm text-muted-foreground">Fetching data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-rain-100 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about weather, rainfall..."
                disabled={isLoading}
                className="flex-1 rounded-full border-rain-200 focus:border-rain-400 focus:ring-rain-400"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="rounded-full bg-rain-500 hover:bg-rain-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by live weather data • RainIQ
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
