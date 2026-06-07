import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User, Trash2 } from 'lucide-react';
import api from '../api/axios';

const SUGGESTIONS = [
  'What is my biggest expense?',
  'How much did I spend this month?',
  'Give me a budgeting tip',
  'Which category should I reduce?',
];

export default function AIChat() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState([{
    role: 'assistant',
    content: "Hi! I'm your finance assistant. I can answer questions about your expenses and help you manage your budget. What would you like to know?",
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    else if (msgs.length > 1 && msgs[msgs.length - 1].role === 'assistant') setUnread(u => u + 1);
  }, [msgs]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = msgs.map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', { message: msg, history });
      setMsgs(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMsgs(prev => [...prev, { role: 'assistant', content: errMsg, isError: true }]);
    } finally { setLoading(false); }
  };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const clear = () => setMsgs([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-[72px] right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] bg-white dark:bg-[#161b27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-dropdown flex flex-col anim-scale-in"
          style={{ height: 500, maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Finance Assistant</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Powered by Gemini 2.5</p>
            </div>
            <button onClick={clear} title="Clear chat" className="btn-ghost p-1.5 rounded-lg">
              <Trash2 size={13} />
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost p-1.5 rounded-lg">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  {m.role === 'user' ? <User size={11} /> : <Sparkles size={11} />}
                </div>
                <div className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : m.isError
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-tl-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={11} className="text-gray-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {msgs.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 resize-none transition-colors"
              placeholder="Ask about your finances…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center flex-shrink-0 transition-colors self-end">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-12 h-12 bg-[#0f172a] dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-[#0f172a] rounded-xl shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95">
        {open ? <X size={18} /> : <MessageSquare size={18} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
