import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Loader2,
  CloudRain,
  Droplets,
  Leaf,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { icon: <CloudRain className="w-4 h-4" />, text: "What's the weather in Delhi?" },
  { icon: <Droplets className="w-4 h-4" />, text: "Best rainwater harvesting method for clay soil?" },
  { icon: <Leaf className="w-4 h-4" />, text: "How much water can I save with 100 sqm roof?" },
  { icon: <HelpCircle className="w-4 h-4" />, text: "Tips for maintaining a rainwater tank" },
];

function ChatbotContent() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome to **RainIQ Chat**! I'm your AI assistant for:\n\n- 🌤️ Real-time weather updates\n- 🌧️ Rainfall forecasts\n- 💧 Rainwater harvesting advice\n- 🌱 Water sustainability tips\n\nAsk me anything about weather or rainwater harvesting!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          message: userMessage.content,
          role: "user",
        });
      }

      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: {
          messages: [...messages, userMessage],
          userLocation: userLocation,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to get response.",
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

      // Remember location
      if (data.needsLocation) {
        const locationMatch = text.match(/(?:in|at|for)\s+([a-zA-Z\s]+)/i);
        if (locationMatch) {
          setUserLocation(locationMatch[1].trim());
        }
      }

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, assistantMessage]);

      if (user) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          message: assistantMessage.content,
          role: "assistant",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            AI Chatbot Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask questions about weather, rainfall, and rainwater harvesting
          </p>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudRain className="w-5 h-5 text-primary" />
              RainIQ Assistant
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Powered by live weather data
              </span>
            </CardTitle>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted border rounded-bl-sm"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className={`my-1 ${message.role === "user" ? "text-primary-foreground" : "text-foreground"}`}>
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside my-1 space-y-0.5">
                              {children}
                            </ul>
                          ),
                          strong: ({ children }) => (
                            <strong className={`font-semibold ${message.role === "user" ? "text-primary-foreground" : "text-primary"}`}>
                              {children}
                            </strong>
                          ),
                          table: ({ children }) => (
                            <table className="w-full text-xs border-collapse my-2">
                              {children}
                            </table>
                          ),
                          th: ({ children }) => (
                            <th className="border border-border bg-muted px-2 py-1 text-left font-medium">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-2 py-1">
                              {children}
                            </td>
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
                  <div className="bg-muted border rounded-2xl rounded-bl-sm p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend(prompt.text)}
                    className="text-xs"
                  >
                    {prompt.icon}
                    <span className="ml-2">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about weather or rainwater harvesting..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <ProtectedRoute>
      <ChatbotContent />
    </ProtectedRoute>
  );
}
