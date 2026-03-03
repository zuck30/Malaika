import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Mic, Smile, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

interface Message {
  role: 'user' | 'elysia';
  content: string;
  timestamp?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    // Multiple attempts to ensure scrolling works after animations
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const getTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onEmojiClick = (emojiData: any) => {
    const cursor = inputRef.current?.selectionStart || 0;
    const text = input.slice(0, cursor) + emojiData.emoji + input.slice(cursor);
    setInput(text);
    setShowEmojiPicker(false);

    // Maintain focus after injection
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursor = cursor + emojiData.emoji.length;
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const renderContent = (content: string) => {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const parts = content.split(emojiRegex);

    return parts.map((part, index) => {
      if (emojiRegex.test(part)) {
        return (
          <motion.span
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-block mx-0.5 text-[1.2em]"
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-avenir items-center overflow-hidden">
      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto px-4 pt-10 scroll-smooth min-h-0"
      >
        <div className="max-w-[700px] mx-auto flex flex-col space-y-6 pb-12">
          <AnimatePresence mode='popLayout' initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
              >
                <div className="relative group">
                  <div
                    className={`px-5 py-3 rounded-[24px] text-[16px] font-medium leading-relaxed backdrop-blur-[12px] shadow-2xl border transition-all ${
                      msg.role === 'user'
                        ? 'bg-snapchat-blue/40 border-white/20 text-white rounded-br-[4px]'
                        : 'bg-white/10 border-white/10 text-white rounded-bl-[4px]'
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>

                <div className={`mt-2 flex items-center space-x-2 transition-opacity duration-300 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-60">
                    {msg.timestamp || getTimestamp()}
                  </span>
                  {msg.role === 'user' && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 size={10} className="text-snapchat-blue" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full w-fit border border-white/10"
            >
              <div className="flex space-x-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-1.5 h-1.5 bg-snapchat-yellow rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-snapchat-yellow rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-snapchat-yellow rounded-full"
                />
              </div>
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Elysia is thinking</span>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Snapchat Floating Input Bar */}
      <div className="p-6 pb-10 w-full max-w-[700px] relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-full mb-4 left-0 z-50"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full px-3 py-1 flex-1 shadow-2xl transition-all focus-within:border-white/20">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 transition-colors ${showEmojiPicker ? 'text-snapchat-yellow' : 'text-white/70 hover:text-white'}`}
            >
              <Smile size={24} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat with Elysia..."
              className="flex-1 bg-transparent border-none py-4 px-3 text-white placeholder:text-zinc-500 focus:outline-none font-medium text-[16px]"
            />

            <div className="flex items-center space-x-2 pr-1">
              <button
                type="button"
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-500/20 animate-pulse' : 'text-white/70 hover:text-white'}`}
              >
                <Mic size={24} />
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2 transition-colors ${isCameraActive ? 'text-snapchat-yellow' : 'text-white/70 hover:text-white'}`}
              >
                <Camera size={24} />
              </button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={!input.trim()}
                className={`p-2 transition-all ${
                  input.trim()
                    ? 'text-snapchat-blue scale-110'
                    : 'text-zinc-600'
                }`}
              >
                <Send size={24} fill={input.trim() ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
