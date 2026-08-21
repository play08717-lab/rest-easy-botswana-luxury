import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askAssistant } from '@/lib/assistant.functions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: Message = {
  role: 'assistant',
  content:
    'Dumela! Welcome to Rest Easy Apartment. Ask me about our rates, check-in times, or getting to the Central Kalahari.',
};

export const GlobalAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askAssistant);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await ask({ data: { messages: updatedMessages } });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            result.reply ??
            result.error ??
            'Please contact us on WhatsApp at +267 71 621 866 for immediate help.',
        },
      ]);
    } catch (err) {
      console.error('Assistant request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I am having trouble connecting right now. You can chat directly via WhatsApp (+267 71 621 866).',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9998]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gold text-dark hover:bg-gold-light shadow-xl transition-all duration-300 flex items-center justify-center"
          aria-label={isOpen ? 'Close concierge chat' : 'Open concierge chat'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 bg-dark text-paper rounded-xl shadow-2xl border border-gold/25 z-[9998] overflow-hidden flex flex-col h-[70vh] max-h-[480px]">
          <div className="p-4 border-b border-gold/20 flex justify-between items-center bg-paper/[0.03]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gold/15 rounded-lg">
                <Bot className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-display text-sm">Rest Easy Concierge</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-paper/50">Rakops &amp; Kalahari</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-paper/60 hover:text-paper"
              aria-label="Close concierge chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gold text-dark rounded-br-none'
                      : 'bg-paper/[0.06] text-paper/90 rounded-bl-none border border-gold/15'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-paper/[0.06] rounded-2xl px-3.5 py-2.5 border border-gold/15 flex items-center gap-2 text-paper/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gold/20 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about rates, CKGR, or Rakops…"
              className="bg-paper/[0.06] border-gold/20 text-paper placeholder:text-paper/40 focus-visible:ring-gold text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gold text-dark hover:bg-gold-light"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
