import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Bot } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Props {
  city: string;
  context?: {
    co2_emissions?: number;
    aqi?: number;
    green_score?: number;
    electricity_demand?: number;
  };
}

const SUGGESTED = [
  "How can this city reduce CO₂ by 30%?",
  "What are the best policies for improving AQI?",
  "Which lever has the highest impact?",
  "What does a green score of 80 mean?",
];

export function AIPolicyAssistant({ city, context }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.simulationLLM.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    },
  });

  const handleSend = (content: string) => {
    const updated: Message[] = [...messages, { role: "user", content }];
    setMessages(updated);
    chatMutation.mutate({
      city,
      messages: updated.filter((m) => m.role !== "system"),
      context,
    });
  };

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-indigo-600" /> AI Policy Assistant
        </CardTitle>
        <p className="text-xs text-slate-500">Ask anything about climate policy for {city}</p>
      </CardHeader>
      <CardContent className="p-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={chatMutation.isPending}
          placeholder={`Ask about ${city}'s climate policies...`}
          height="380px"
          emptyStateMessage={`Ask me anything about sustainability in ${city}`}
          suggestedPrompts={SUGGESTED}
        />
      </CardContent>
    </Card>
  );
}
