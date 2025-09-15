import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ProductPayload {
  id?: string;
  uuid?: string;
  title?: string;
  name?: string;
  price?: number | string;
  image_urls?: string[];
  image_url?: string;
  url?: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  product?: ProductPayload | null;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your fashion assistant. How can I help you today? I can answer questions about our products, designs, materials, and styling tips!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("patola") || lowerMessage.includes("patan")) {
      return "Patola sarees from Patan are exquisite double ikat weavings from Gujarat, known for their geometric patterns and vibrant colors. They are woven with silk threads and are considered one of the finest textiles in India. Our new arrivals feature authentic Patola designs with traditional motifs.";
    }

    if (lowerMessage.includes("material") || lowerMessage.includes("fabric")) {
      return "We use premium materials including 100% silk, organic cotton, linen, and traditional handwoven fabrics. Each product description includes detailed material information and care instructions.";
    }

    if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return "Our designs range from $50 for accessories to $500+ for premium silk garments. We offer various price points to suit different budgets while maintaining quality craftsmanship.";
    }

    if (lowerMessage.includes("care") || lowerMessage.includes("wash")) {
      return "Care instructions vary by material. Silk items typically require dry cleaning or gentle hand washing, while cotton pieces can often be machine washed. Check each product's specific care instructions.";
    }

    if (lowerMessage.includes("size") || lowerMessage.includes("fit")) {
      return "We offer detailed size guides for each product. Most of our designs are available in XS to XXL. For custom designs, we can accommodate specific measurements.";
    }

    if (
      lowerMessage.includes("shipping") ||
      lowerMessage.includes("delivery")
    ) {
      return "We offer worldwide shipping with tracking. Standard delivery takes 5-7 business days, and express shipping is available for 2-3 days delivery.";
    }

    if (lowerMessage.includes("return") || lowerMessage.includes("exchange")) {
      return "We have a 30-day return policy for unworn items in original condition. Custom designs may have different return policies as they are made specifically for you.";
    }

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! Welcome to Atelier. I'm here to help you with any questions about our fashion collections, designs, or services. What would you like to know?";
    }

    return "I understand you're asking about our fashion collections. Our team specializes in traditional and contemporary designs, including beautiful Patola patterns from Patan. Would you like to know more about specific products, materials, or services?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Use apiRequest helper so Authorization header (token) is attached from localStorage
      try {
        const product: any = await apiRequest(`/products/search`, {
          method: "POST",
          body: JSON.stringify({ query, limit: 1 }),
        });

        if (
          product &&
          (product.id || product.uuid || product.title || product.name)
        ) {
          // Attach product as structured payload for richer rendering
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: `I found a product that matches your query: ${
              product.title || product.name || product.id || product.uuid
            }`,
            sender: "bot",
            timestamp: new Date(),
            product: {
              id: product.id,
              uuid: product.uuid,
              title: product.title || product.name,
              name: product.name,
              price: product.price ?? product.meta?.price,
              image_urls: product.image_urls,
              image_url: product.image_url,
              url: product.url,
            },
          };

          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
          return;
        }
      } catch (apiErr: any) {
        // If unauthorized, inform user to sign in; otherwise log and fall back
        if (apiErr && (apiErr.status === 401 || apiErr.status === 403)) {
          const authMsg: Message = {
            id: (Date.now() + 1).toString(),
            content:
              "Please sign in to use the assistant search. I can still answer general questions.",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, authMsg]);
          setIsTyping(false);
          return;
        }
        console.error("ChatBot: search api error", apiErr);
      }

      // Fallback to rule-based response when API didn't return a usable product
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(query),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallback]);
    } catch (err) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(query),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl md:max-w-xl lg:max-w-2xl h-[600px] md:h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-fashion-rose" />
            <span>Fashion Assistant</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div
                  className={`flex-shrink-0 rounded-full p-2 ${
                    message.sender === "user"
                      ? "bg-fashion-rose text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.sender === "user" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-fashion-rose text-white"
                      : "bg-muted"
                  }`}
                >
                  {message.product ? (
                    <div className="flex space-x-3 items-center">
                      <img
                        src={
                          (message.product.image_urls &&
                            message.product.image_urls[0]) ||
                          message.product.image_url ||
                          ""
                        }
                        alt={message.product.title || message.product.name}
                        className="w-20 h-20 object-cover rounded-md bg-white/10"
                      />
                      <div>
                        <div className="text-sm font-semibold">
                          {message.product.title ||
                            message.product.name ||
                            message.content}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Price: {message.product.price ?? "N/A"}
                        </div>
                        {message.product.id || message.product.uuid ? (
                          <a
                            href={
                              message.product.url ||
                              `#/products/${
                                message.product.id || message.product.uuid
                              }`
                            }
                            className="text-xs text-fashion-rose hover:underline block mt-1"
                          >
                            View product
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 rounded-full p-2 bg-muted text-muted-foreground">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 p-4 border-t">
          <Input
            placeholder="Ask about our products, materials, or styling..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-fashion-rose hover:bg-fashion-rose/90"
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
