import React, { useState } from 'react';
import { ArrowUp, Bot, Compass, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

const suggestions = ['Summarize the highest current risks', 'Which zones need attention first?', 'Show me the latest data coverage'];

export default function AIChat({ selectedZoneId }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = (value = message) => {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setMessage('');
    setLoading(true);
    apiService.askAssistant(selectedZoneId, text)
      .then((result) => setMessages((current) => [...current, { role: 'assistant', text: result.answer, evidence: result.evidence }]))
      .catch((error) => setMessages((current) => [...current, { role: 'assistant', text: error.message }]))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-2">AI workspace</p><h2 className="text-2xl font-bold text-slate-900">AI Urban Analyst</h2><p className="text-sm text-slate-500 mt-2">Chat freely or generate evidence-backed analysis for {selectedZoneId}.</p></div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><Sparkles className="w-3.5 h-3.5" /> Grounded local analyst</div>
      </div>
      <div className="min-h-[520px] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Bot className="w-5 h-5" /></div><div><p className="text-sm font-bold text-slate-800">URBANAi Assistant</p><p className="text-xs text-slate-400">Answers grounded in the selected ward and local model</p></div></div>
          <div className="flex-1 p-5 space-y-3 overflow-y-auto">
          <div className="max-w-lg bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-600 leading-relaxed">Ask about current hazards, model factors, data confidence, or intervention priorities for {selectedZoneId}.</div>
          {messages.map((item, index) => <div key={index} className={item.role === 'user' ? 'ml-auto max-w-lg bg-blue-600 text-white rounded-lg p-3 text-sm' : 'max-w-lg bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-700'}><p>{item.text}</p>{item.evidence && <div className="mt-2 text-[10px] opacity-75">{item.evidence.join(' | ')}</div>}</div>)}
          {loading && <div className="max-w-lg bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 animate-pulse">Analyzing ward evidence...</div>}
          {!messages.length && <div className="grid sm:grid-cols-3 gap-2 pt-4">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} className="text-left p-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"><Compass className="w-3.5 h-3.5 text-blue-600 mb-2" />{suggestion}</button>)}</div>}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="p-4 border-t border-slate-100 flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question about city risk..." className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" /><button type="submit" aria-label="Send message" className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><ArrowUp className="w-4 h-4" /></button></form>
      </div>
    </div>
  );
}
