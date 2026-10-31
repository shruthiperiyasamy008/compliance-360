import React, { useState } from 'react';
import { apiFetch } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  evidence?: string[];
  recommendation?: string;
  links?: Array<{ title: string; url: string }>;
  limitations?: string;
  timestamp: string;
}

interface AdminAIChatboxProps {
  contextAppId?: number;
  contextAppCode?: string;
}

export const AdminAIChatbox: React.FC<AdminAIChatboxProps> = ({ contextAppId, contextAppCode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: contextAppCode
        ? `Hello, Officer. I am grounded in the official AICTE database and ready to analyze Application ${contextAppCode}. You can ask about its risk factors, delays, blockers, or recommended next actions.`
        : 'Welcome to the AICTE Pipeline AI Assistant. I provide real-time, database-backed insights into overdue applications, unassigned cases, EVC scheduling, and risk evaluations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = contextAppCode
    ? [
        `Why is ${contextAppCode} at risk?`,
        `What factors contribute to ${contextAppCode}'s score?`,
        `What action should be taken next for ${contextAppCode}?`,
        `Compare ${contextAppCode}'s current and previous risk.`,
      ]
    : [
        'Which applications are overdue?',
        'Which applications have high risk scores?',
        'Which tasks are waiting for assignment?',
        'Which EVC scheduling tasks require attention?',
        'Which compliance obligations are overdue?',
      ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          query: q,
          context_app_id: contextAppId,
        }),
      });

      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.answer,
        evidence: res.evidence,
        recommendation: res.recommendation,
        links: res.links,
        limitations: res.limitations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error querying database: ${err.message || 'Request failed'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-3.5 bg-[#263B50] text-white flex justify-between items-center rounded-t-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#8B3A3A] flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>AICTE Decision Intelligence Assistant</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#48745A] font-semibold text-white">
                DATABASE CONNECTED
              </span>
            </div>
            <div className="text-[10px] text-[#D6C5AE]">
              {contextAppCode ? `Context: ${contextAppCode}` : 'Council-wide Pipeline Scope'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-[#D6C5AE] hover:text-white flex items-center gap-1"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-2 bg-[#FAF7F2] border-b border-[#D6C5AE] flex gap-1.5 overflow-x-auto text-[11px]">
        {suggestedQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="px-2.5 py-1 bg-[#FFFEFC] border border-[#D6C5AE] rounded-xs hover:bg-[#E8DED0] text-[#40372F] font-medium whitespace-nowrap transition cursor-pointer"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#8B3A3A] text-white'
                  : 'bg-[#FAF7F2] border border-[#D6C5AE] text-[#40372F]'
              }`}
            >
              <div className="font-medium">{m.text}</div>

              {/* Grounded Evidence Box */}
              {m.evidence && m.evidence.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#D6C5AE]/60 space-y-1 text-[11px]">
                  <span className="font-bold text-[#263B50] uppercase tracking-wider block">
                    Verified Database Evidence:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {m.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation Box */}
              {m.recommendation && (
                <div className="mt-2 p-2 bg-[#48745A]/10 border border-[#48745A] rounded-xs text-[11px] text-[#48745A]">
                  <strong>Recommended Next Action:</strong> {m.recommendation}
                </div>
              )}

              {/* Clickable links */}
              {m.links && m.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {m.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      className="inline-flex items-center gap-1 font-semibold text-[#8B3A3A] hover:underline"
                    >
                      <span>{link.title}</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}

              {/* Limitation disclaimer */}
              {m.limitations && (
                <div className="mt-1.5 text-[10px] text-[#A89580] italic">
                  Note: {m.limitations}
                </div>
              )}
            </div>
            <span className="text-[10px] text-[#A89580] mt-0.5 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-2.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm text-xs text-[#A89580] w-max">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-[#8B3A3A]" />
            <span>Querying verified pipeline database records...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-[#FFFEFC] border-t border-[#D6C5AE] flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={contextAppCode ? `Ask about ${contextAppCode} risk, factors, or SLA...` : "Ask about overdue cases, EVC scheduling, unassigned tasks..."}
          className="flex-1 px-3 py-2 border border-[#D6C5AE] rounded-sm text-xs bg-[#FAF7F2] text-[#40372F] focus:outline-none focus:ring-1 focus:ring-[#8B3A3A]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

