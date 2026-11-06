import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { SafetyNotice } from '../components/SafetyNotice';
import { cn } from '../lib/utils';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  related_medicines?: string[];
  timestamp: string;
}

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AssistantPage: React.FC = () => {
  const { user, language } = useAuth();
  const t = translations[language];

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      sender: 'assistant',
      text:
        language === 'te'
          ? `నమస్కారం ${user?.full_name || ''}! నేను మీ కేర్‌నెస్ట్ ఆరోగ్య సహాయకుడిని. మీ మందుల షెడ్యూల్, రాబోయే మోతాదుల గురించి నన్ను అడగండి.`
          : `Hello ${user?.full_name || 'there'}. I am CareNest, your medication companion. Ask me about your medicines, today's timings, or your reminders.`,
      timestamp: clock(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReadout, setVoiceReadout] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'te' ? 'te-IN' : 'en-US';
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (_) {
        /* abort can throw when the session already ended */
      }
    };
  }, [language]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  const speak = (text: string) => {
    if (!voiceReadout || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechSupported(false);
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    setListening(true);
    recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-US';
    recognitionRef.current.start();
  };

  const send = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || thinking) return;
    setInput('');

    setMessages(prev => [...prev, { sender: 'user', text, timestamp: clock() }]);
    setThinking(true);

    try {
      const res = await api.assistant.ask(text, language);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          source: res.source,
          related_medicines: res.related_medicines,
          timestamp: clock(),
        },
      ]);
      speak(res.answer);
    } catch (_) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text:
            language === 'te'
              ? 'క్షమించండి, మీ ప్రశ్నకు సమాధానం ఇవ్వలేకపోయాను. దయచేసి మళ్ళీ ప్రయత్నించండి.'
              : 'I could not reach your records just now. Please try that question again.',
          timestamp: clock(),
        },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const prompts = [t.quickPrompt1, t.quickPrompt2, t.quickPrompt3, t.quickPrompt4];

  return (
    <div className="mx-auto flex h-[calc(100dvh-168px)] max-w-[860px] flex-col gap-5 lg:h-[calc(100dvh-190px)]">
      <PageHeader
        eyebrow="Ask"
        title={t.askTitle}
        lede={t.askSubtitle}
        actions={
          <Button
            variant={voiceReadout ? 'mint' : 'secondary'}
            size="sm"
            onClick={() => {
              setVoiceReadout(v => !v);
              if (voiceReadout) window.speechSynthesis?.cancel();
            }}
            aria-pressed={voiceReadout}
          >
            {voiceReadout ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Read answers aloud
          </Button>
        }
      />

      <SafetyNotice
        heading="Answers come from your own prescription records"
        body={
          language === 'te'
            ? 'కేర్‌నెస్ట్ మీ ప్రిస్క్రిప్షన్ రికార్డుల నుండి మాత్రమే సమాధానం ఇస్తుంది. కొత్త మందులు లేదా మోతాదు మార్పుల గురించి ఇది సలహా ఇవ్వదు.'
            : 'CareNest only answers from the prescriptions you have saved. It will not suggest new medicines or change a dose — ask your doctor for that.'
        }
      />

      {/* Transcript */}
      <div className="cn-panel min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <ul className="space-y-5">
          {messages.map((msg, index) => (
            <li key={index} className={cn('flex gap-3', msg.sender === 'user' && 'justify-end')}>
              {msg.sender === 'assistant' && (
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-paper-cool">
                  <Bot className="h-4 w-4" />
                </span>
              )}

              <div
                className={cn(
                  'max-w-[85%] rounded-panel px-4 py-3 sm:max-w-[78%]',
                  msg.sender === 'user'
                    ? 'rounded-br-md border border-teal/25 bg-teal-wash'
                    : 'rounded-bl-md border border-line bg-paper'
                )}
              >
                <p className="whitespace-pre-line text-body leading-relaxed text-ink">{msg.text}</p>

                {msg.related_medicines && msg.related_medicines.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {msg.related_medicines.map(med => (
                      <li key={med} className="cn-chip">
                        {med}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 text-right text-micro tabular text-ink-faint">
                  {msg.source ? `${msg.source} · ` : ''}
                  {msg.timestamp}
                </p>
              </div>
            </li>
          ))}

          {thinking && (
            <li className="flex gap-3">
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-paper-cool">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </span>
              <p className="rounded-panel rounded-bl-md border border-line bg-paper px-4 py-3 text-body text-ink-mute">
                Looking through your medication records…
              </p>
            </li>
          )}
          <div ref={endRef} />
        </ul>
      </div>

      {/* Starter questions */}
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {prompts.map(prompt => (
          <motion.li key={prompt} whileHover={{ y: -1 }} className="shrink-0">
            <button
              onClick={() => send(prompt)}
              disabled={thinking}
              className="rounded-pill border border-line bg-paper-cool px-3.5 py-2 text-micro font-semibold text-ink-soft transition-colors hover:border-teal/45 hover:bg-teal-wash hover:text-teal-deep disabled:opacity-50 cursor-pointer"
            >
              {prompt}
            </button>
          </motion.li>
        ))}
      </ul>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
        className="cn-panel flex items-center gap-2 p-2 shadow-raised"
      >
        <button
          type="button"
          onClick={toggleListening}
          disabled={!speechSupported}
          aria-label={listening ? t.stopVoice : t.startVoice}
          aria-pressed={listening}
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-control transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
            listening ? 'animate-pulse bg-coral text-white' : 'bg-teal-wash text-teal-deep hover:bg-mint'
          )}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? t.listening : speechSupported ? t.askPlaceholder : t.askPlaceholder}
          aria-label={t.askPlaceholder}
          className="min-w-0 flex-1 bg-transparent px-2 text-lead text-ink outline-none placeholder:text-ink-faint"
        />

        <Button type="submit" size="lg" disabled={!input.trim() || thinking} aria-label="Send question">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t.sendQuestion}</span>
        </Button>
      </form>

      {!speechSupported && (
        <p className="text-micro text-ink-faint">
          Voice input is not available in this browser — type your question instead.
        </p>
      )}
    </div>
  );
};
