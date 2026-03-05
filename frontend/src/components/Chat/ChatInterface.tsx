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
          className={`px-5 py-3 rounded-[24px] text-[16px] font-medium leading-relaxed backdrop-blur-[12px] shadow-2xl border transition-all hover:scale-[1.02] ${
            isUser
              ? 'bg-snapchat-blue/40 border-white/20 text-white rounded-br-[4px]'
              : 'bg-white/10 border-white/10 text-white rounded-bl-[4px]'
          }`}
        >
          {msg.content}
        </div>
        
        {/* Hover timestamp */}
        <span className="absolute -top-6 left-0 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className={`mt-1 flex items-center space-x-1 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-60">
          {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isUser && <CheckCircle2 size={12} className="text-snapchat-blue" />}
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
  isCameraActive
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
        behavior: 'smooth'
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onSendMessage(input.trim());
    setInput('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, [input, onSendMessage]);

  const onEmojiClick = useCallback((emojiData: any) => {
    const cursor = inputRef.current?.selectionStart || input.length;
    const text = input.slice(0, cursor) + emojiData.emoji + input.slice(cursor);
    setInput(text);
    
    // Restore cursor position
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const newPos = cursor + emojiData.emoji.length;
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-avenir items-center overflow-hidden relative">
      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto px-4 pt-10 scroll-smooth min-h-0 scrollbar-hide"
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
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full w-fit border border-white/10 self-start"
              >
                <div className="flex space-x-1">
                  {[0, 0.15, 0.3].map((delay) => (
                    <motion.div
                      key={delay}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay }}
                      className="w-1.5 h-1.5 bg-snapchat-yellow rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Elysia is typing
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-4 pb-8 w-full max-w-[700px] relative z-10">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="bg-zinc-900 p-2 rounded-t-xl flex justify-between items-center">
                <span className="text-xs text-zinc-400 ml-2">Pick an emoji</span>
                <button 
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis={true}
                width={350}
                height={400}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-3 shadow-2xl transition-all focus-within:border-snapchat-blue/50 focus-within:bg-zinc-900/90">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-all ${showEmojiPicker ? 'text-snapchat-yellow bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Smile size={22} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Chat with Elysia..."}
              disabled={isListening}
              className="flex-1 bg-transparent border-none py-2 px-4 text-white placeholder:text-zinc-500 focus:outline-none font-medium text-[16px] disabled:opacity-50"
            />

            <div className="flex items-center space-x-1">
              <motion.button
                type="button"
                onClick={() => setIsListening(!isListening)}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-full transition-all ${
                  isListening 
                    ? 'text-red-500 bg-red-500/20 animate-pulse' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                    ? 'text-snapchat-yellow bg-white/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                    ? 'bg-snapchat-blue text-white shadow-lg shadow-snapchat-blue/25'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
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