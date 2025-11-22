'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function Homepage() {
    const [isConsulting, setIsConsulting] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [agentCards, setAgentCards] = useState([]);

    // WebSocket Logic Inlined
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        if (socketRef.current) return;

        const socket = new WebSocket('ws://localhost:8000/ws');
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'transcript') {
                    setTranscript(prev => [...prev, { text: data.text, timestamp: new Date().toLocaleTimeString() }]);
                } else if (data.type === 'agent') {
                    setAgentCards(prev => [data.payload, ...prev]);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            socketRef.current = null;
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    const sendMessage = useCallback((message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        }
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const toggleConsult = () => {
        if (isConsulting) {
            sendMessage({ type: 'end_consult' });
            setIsConsulting(false);
        } else {
            setTranscript([]);
            setAgentCards([]);
            connect();
            setIsConsulting(true);
            // Small delay to ensure connection is open before sending start
            setTimeout(() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: 'start_consult' }));
                } else {
                    // Retry once if not ready
                    setTimeout(() => {
                        socketRef.current?.send(JSON.stringify({ type: 'start_consult' }));
                    }, 500);
                }
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans relative overflow-x-hidden pb-32">
            {/* Animated Background Blobs */}
            <div className="fixed top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        Pocket Council
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Medical Companion</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8 relative z-10">

                {/* Patient Card - Collapsible or Compact */}
                <section className="space-y-4">
                    <div className="glass p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white">
                                <path d="M20 7h-7L10 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                            </svg>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Patient</h2>
                                    <h3 className="text-2xl font-bold text-white">Lorenzo Ventrone</h3>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-300 border border-white/10">ID #88291</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Age / Blood</p>
                                    <p className="text-sm font-medium">45 / O+</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Condition</p>
                                    <p className="text-sm font-medium text-red-300">Hypertension</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Current Meds</p>
                                    <p className="text-xs text-slate-200">Metformin 500mg, Lisinopril 10mg, Warfarin 5mg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live Feed Area */}
                {isConsulting && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Live Transcript
                        </div>

                        <div className="glass p-4 rounded-2xl max-h-[300px] overflow-y-auto font-mono text-xs text-slate-300 border border-white/5 shadow-inner bg-black/20">
                            {transcript.length === 0 ? (
                                <div className="h-20 flex items-center justify-center text-slate-600 italic">Listening to consultation...</div>
                            ) : (
                                <div className="space-y-3">
                                    {transcript.map((t, i) => (
                                        <div key={i} className="flex gap-3 animate-in fade-in duration-300">
                                            <span className="text-slate-600 shrink-0">{t.timestamp}</span>
                                            <span className="text-slate-200">{t.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Agent Cards Stream */}
                        <div className="space-y-3">
                            {agentCards.map((card, idx) => (
                                <div key={idx} className={`glass p-4 rounded-2xl border-l-4 ${card.type === 'alert' ? 'border-red-500 bg-red-500/10' : 'border-violet-500 bg-violet-500/10'} animate-in slide-in-from-right duration-500 shadow-lg backdrop-blur-md`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg filter drop-shadow-lg">{card.type === 'alert' ? '🛡️' : '🕵️'}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${card.type === 'alert' ? 'text-red-300' : 'text-violet-300'}`}>
                                            {card.agentName}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-100 leading-relaxed font-medium">{card.message}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <button
                    onClick={toggleConsult}
                    className={`pointer-events-auto liquid-glass-btn group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full transition-all duration-500 ${isConsulting
                            ? 'bg-red-500/20 border-red-500/50 w-auto'
                            : 'w-auto hover:scale-105'
                        }`}
                >
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isConsulting ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]'}`} />
                    <span className="text-sm font-bold uppercase tracking-widest text-white">
                        {isConsulting ? 'End Session' : 'Start Consult'}
                    </span>
                </button>
            </div>
        </div>
    );
}
