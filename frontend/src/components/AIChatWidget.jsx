import React, { useState } from 'react';
import { Bot, ExternalLink, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

export default function AIChatWidget({ selectedZoneId }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim() || !selectedZoneId) return;
    setLoading(true);
    apiService.askAssistant(selectedZoneId, message.trim())
      .then((result) => setReply(result.answer))
      .catch((error) => setReply(error.message))
      .finally(() => {
        setLoading(false);
        setMessage('');
      });
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(360px,calc(100vw-2rem))] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-600"><Bot className="w-4 h-4" /></div>
              <div><p className="text-xs font-bold">URBANAi Assistant</p><p className="text-[10px] text-slate-400">Grounded local analyst</p></div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close AI assistant" className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">Ask about the current hazard profile for {selectedZoneId || 'the selected ward'}.</div>
            {loading && <div className="text-xs text-slate-500 animate-pulse">Analyzing ward evidence...</div>}
            {reply && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-700">{reply}</div>}
            <Link to="/ai-chat" onClick={() => setOpen(false)} className="flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700">Open full assistant <ExternalLink className="w-3.5 h-3.5" /></Link>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about this workspace" className="min-w-0 flex-1 text-xs px-3 py-2 border border-slate-200 rounded-md outline-none focus:border-blue-500" />
              <button type="submit" aria-label="Send message" className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Send className="w-3.5 h-3.5" /></button>
            </form>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label={open ? 'Close AI assistant' : 'Open AI assistant'} className="group flex items-center gap-2 rounded-full bg-blue-600 text-white p-3 sm:pl-3 sm:pr-4 sm:py-3 shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all">
        <Bot className="w-5 h-5" /><span className="hidden sm:inline text-xs font-bold">AI Assistant</span>
      </button>
    </div>
  );
}
