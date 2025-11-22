"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Menu, User, Search, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentCard } from "./components/AgentCard";
import { ChatBubble } from "./components/ChatBubble";
import { useConsultation } from "./hooks/useConsultation";

export default function Home() {
  const { isRecording, startRecording, stopRecording, messages } = useConsultation();
  const [mode, setMode] = useState<"consult" | "retrieve">("consult");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-slate-900 via-slate-950 to-black relative overflow-hidden">

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white leading-none tracking-tight">Pocket Council</h1>
            <p className="text-xs text-slate-400 mt-1.5">Dr. Luca Tam</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors backdrop-blur-sm border border-white/5">
            <User size={20} />
          </button>
          <button className="p-2.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors backdrop-blur-sm border border-white/5">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mode Toggle */}
      <div className="px-6 mb-6 z-10 relative">
        <div className="flex p-1.5 rounded-2xl bg-slate-800/60 border border-white/10 backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setMode("consult")}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === 'consult'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Consultation
          </button>
          <button
            onClick={() => setMode("retrieve")}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === 'retrieve'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search size={16} />
              <span>Retrieve Info</span>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-36 space-y-5 scroll-smooth z-10 relative">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-500 mt-24 space-y-3"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center backdrop-blur-sm">
                <Mic size={28} className="text-slate-600" />
              </div>
              <p className="text-sm font-medium">
                {mode === 'consult' ? 'Start recording to begin consultation' : 'Ask a question about your patient'}
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.type === 'user' && <ChatBubble text={msg.text!} isUser />}
              {msg.type === 'agent' && msg.agentData && (
                <AgentCard
                  agentName={msg.agentData.agent}
                  category={msg.agentData.category}
                  content={msg.agentData.content}
                />
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black via-slate-950/95 to-transparent z-20">
        <div className="flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`
                    relative group flex items-center gap-3 px-10 py-5 rounded-full font-semibold text-white shadow-2xl transition-all
                    ${isRecording
                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/50'
                : mode === 'consult'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/50'
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-purple-500/50'
              }
                `}
          >
            {/* Pulse Effect */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-30" />
              </>
            )}

            <div className="relative z-10 flex items-center gap-3">
              {isRecording ? (
                <Square size={22} fill="currentColor" className="animate-pulse" />
              ) : (
                mode === 'consult' ? <Mic size={22} /> : <Search size={22} />
              )}
              <span className="text-base">
                {isRecording ? "Stop Recording" : (mode === 'consult' ? "Start Recording" : "Ask Question")}
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
