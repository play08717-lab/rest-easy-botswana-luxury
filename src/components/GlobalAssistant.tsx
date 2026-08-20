import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const GlobalAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Dumela! Welcome to Rest Easy Apartment. How can I assist you with your stay or journey in Rakops today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('global-assistant', {
        body: {
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.reply || 'Thank you for reaching out. Please contact us on WhatsApp at +267 71 621 866 for immediate help.',
        },
      ]);
    } catch (err) {
      console.error('Error invoking global-assistant function:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I am having trouble connecting right now. You can chat directly via WhatsApp (+267 71 621 866).',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button - Positioned fixed in bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl transition-all duration-300 flex items-center justify-center border border-amber-500/20"
          aria-label="Open Global Assistant"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        </Button>
      </div>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-800 z-[9999] overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="p-4 bg-zinc-800/80 border-b border-zinc-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-600/20 rounded-lg">
                <Bot className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Rest Easy Assistant</h3>
                <p className="text-xs text-zinc-400">Rakops & Safari Concierge</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-amber-600 text-white rounded-br-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700/50'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl px-3.5 py-2.5 border border-zinc-700/50 flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about rates, CKGR, or Rakops..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500 text-sm"
            />
            <Button onClick={handleSend} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
