import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Bot, Loader2, CalendarCheck, MapPin, MessageCircle } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: Message = {
  role: 'assistant',
  content:
    'Dumela! Welcome to Rest Easy Apartment. Ask me about our rates, check-in times, or getting to the Central Kalahari.',
};

const STORAGE_KEY = 'restEasy.concierge.messages';

const WHATSAPP_URL =
  'https://wa.me/26771621866?text=' +
  encodeURIComponent('Dumela! I would like to enquire about staying at Rest Easy Apartment.');

const QUICK_REPLIES: {
  label: string;
  prompt: string;
  icon: React.ElementType;
  href?: string;
  external?: boolean;
}[] = [
  {
    label: 'Check availability',
    prompt: 'Which apartments are available, and what are the nightly rates in BWP?',
    icon: CalendarCheck,
    href: '/book',
  },
  {
    label: 'Get directions',
    prompt: 'How do I get to Plot 2903, Rakops, and how far is the Central Kalahari?',
    icon: MapPin,
    href: '/nearby',
  },
  {
    label: 'WhatsApp enquiry',
    prompt: 'I would like to book — can you tell me how to confirm a reservation?',
    icon: MessageCircle,
    href: WHATSAPP_URL,
    external: true,
  },
];

export const GlobalAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [streaming, setStreaming] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);
  const { navigate } = useRouter();

  // Restore this session's conversation.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming, isLoading, isOpen]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setStreaming('');

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            full.trim() ||
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
      setStreaming('');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[9998]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gold text-dark hover:bg-gold-light shadow-xl transition-all duration-300 flex items-center justify-center"
          aria-label={isOpen ? 'Close concierge chat' : 'Open concierge chat'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-44 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 bg-dark text-paper rounded-xl shadow-2xl border border-gold/25 z-[9998] overflow-hidden flex flex-col h-[70vh] max-h-[520px]">
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
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-paper/[0.06] text-paper/90 rounded-2xl rounded-bl-none border border-gold/15 px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed">
                  {streaming}
                  <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-gold/70 animate-pulse" />
                </div>
              </div>
            )}
            {isLoading && !streaming && (
              <div className="flex justify-start">
                <div className="bg-paper/[0.06] rounded-2xl px-3.5 py-2.5 border border-gold/15 flex items-center gap-2 text-paper/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-gold/20 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map(({ label, prompt, icon: Icon, href, external }) => (
              <button
                key={label}
                onClick={() => {
                  void send(prompt);
                  if (href) {
                    if (external) window.open(href, '_blank', 'noopener,noreferrer');
                    else void navigate({ to: href });
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-paper/[0.04] px-3 py-1.5 text-[11px] tracking-wide text-paper/80 hover:bg-gold/15 hover:text-paper disabled:opacity-50 transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-gold" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3 pt-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask about rates, CKGR, or Rakops…"
              className="bg-paper/[0.06] border-gold/20 text-paper placeholder:text-paper/40 focus-visible:ring-gold text-sm"
            />
            <Button
              onClick={() => send(input)}
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
