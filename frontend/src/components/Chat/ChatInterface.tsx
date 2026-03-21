import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Camera, Mic, Smile, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

interface Message {
  role: 'user' | 'elysia';
  content: string;
  timestamp?: string;
  id?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isSpeaking: boolean;
  onVoiceInput: (blob: Blob) => void;
  toggleCamera: () => void;
  isCameraActive: boolean;
}

const ChatMessage = memo(({ msg, index }: { msg: Message; index: number }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`flex flex-col max-w-[85%] ${isUser ? 'items-end self-end' : 'items-start self-start'}`}
    >
      <div className="relative group">
        <div
          className={`px-5 py-3 rounded-[24px] text-[16px] font-medium leading-relaxed backdrop-blur-[12px] shadow-lg border transition-all hover:scale-[1.02] ${
            isUser
              ? 'bg-white/70 border-white/80 text-[#1e2b3c] rounded-br-[4px]'
              : 'bg-white/40 border-white/60 text-[#1e2b3c] rounded-bl-[4px]'
          }`}
        >
          {msg.content}
        </div>

        {/* Hover timestamp */}
        <span className="absolute -top-6 left-0 text-[10px] text-sky-600/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className={`mt-1 flex items-center space-x-1 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <span className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest">
          {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isUser && <CheckCircle2 size={12} className="text-sky-500" />}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isTyping,
  isListening,
  setIsListening,
  isSpeaking,
  onVoiceInput,
  toggleCamera,
  isCameraActive,
}) => {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      onSendMessage(input.trim());
      setInput('');
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    },
    [input, onSendMessage]
  );

  const onEmojiClick = useCallback(
    (emojiData: any) => {
      const cursor = inputRef.current?.selectionStart || input.length;
      const text = input.slice(0, cursor) + emojiData.emoji + input.slice(cursor);
      setInput(text);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const newPos = cursor + emojiData.emoji.length;
        inputRef.current?.setSelectionRange(newPos, newPos);
      });
    },
    [input]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-avenir items-center overflow-hidden relative pointer-events-none">
      {/* Message Area */}
      <div
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto px-4 pt-10 scroll-smooth min-h-0 scrollbar-hide pointer-events-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="max-w-[700px] mx-auto flex flex-col space-y-4 pb-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id || i} msg={msg} index={i} />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-white/40 backdrop-blur-xl px-4 py-2 rounded-full w-fit border border-white/60 self-start shadow-sm"
              >
                <div className="flex space-x-1">
                  {[0, 0.15, 0.3].map((delay) => (
                    <motion.div
                      key={delay}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay }}
                      className="w-1.5 h-1.5 bg-sky-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-sky-600/70 uppercase tracking-widest">
                  Elysia is typing
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 pb-8 w-full max-w-[700px] relative z-10 pointer-events-auto">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-full mb-2 left-0 z-50 shadow-xl rounded-xl overflow-hidden border border-white/70"
            >
              <div className="bg-white/80 backdrop-blur-md p-2 rounded-t-xl flex justify-between items-center border-b border-white/50">
                <span className="text-xs text-sky-600 ml-2">Pick an emoji</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 hover:bg-white/30 rounded"
                >
                  <X size={16} className="text-sky-600" />
                </button>
              </div>
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.LIGHT}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis={true}
                width={350}
                height={400}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-white/40 backdrop-blur-xl border border-white/70 rounded-full px-4 py-3 shadow-lg transition-all focus-within:border-sky-300 focus-within:bg-white/50">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-all ${
                showEmojiPicker
                  ? 'text-sky-500 bg-white/30'
                  : 'text-sky-600/60 hover:text-sky-600 hover:bg-white/20'
              }`}
            >
              <Smile size={22} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Chat with Elysia...'}
              disabled={isListening}
              className="flex-1 bg-transparent border-none py-2 px-4 text-[#1e2b3c] placeholder:text-sky-600/40 focus:outline-none font-medium text-[16px] disabled:opacity-50"
            />

            <div className="flex items-center space-x-1">
              <motion.button
                type="button"
                onClick={() => setIsListening(!isListening)}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-full transition-all ${
                  isListening
                    ? 'text-red-500 bg-red-200/50'
                    : 'text-sky-600/60 hover:text-sky-600 hover:bg-white/20'
                }`}
              >
                <Mic size={20} />
              </motion.button>

              <motion.button
                type="button"
                onClick={toggleCamera}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-full transition-all ${
                  isCameraActive
                    ? 'text-sky-500 bg-white/30'
                    : 'text-sky-600/60 hover:text-sky-600 hover:bg-white/20'
                }`}
              >
                <Camera size={20} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.05 }}
                type="submit"
                disabled={!input.trim() || isListening}
                className={`p-3 rounded-full ml-1 transition-all ${
                  input.trim() && !isListening
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-300/50'
                    : 'bg-white/30 text-sky-600/30 cursor-not-allowed'
                }`}
              >
                <Send size={18} fill="currentColor" />
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(ChatInterface);