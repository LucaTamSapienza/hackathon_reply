import { useState, useRef, useEffect, useCallback } from 'react';

interface AgentOutput {
    agent: string;
    category: "insight" | "alert" | "diagnosis" | "note";
    content: string;
}

interface Message {
    id: string;
    type: 'user' | 'agent';
    text?: string;
    agentData?: AgentOutput;
}

export function useConsultation() {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [consultationId, setConsultationId] = useState<number | null>(null);

    // 1. Start Consultation (API)
    const startConsultation = async () => {
        try {
            const res = await fetch('http://localhost:8000/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presenting_complaint: "New Session" })
            });
            const data = await res.json();
            setConsultationId(data.id);
            return data.id;
        } catch (e) {
            console.error("Failed to start consultation", e);
            return null;
        }
    };

    // 2. Connect WebSocket
    const connectWebSocket = useCallback((id: number) => {
        if (wsRef.current) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/consultation/${id}`);

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'insight') {
                // Add user transcript if present
                if (data.transcript) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString() + '-user',
                        type: 'user',
                        text: data.transcript
                    }]);
                }

                // Add agent outputs
                data.outputs.forEach((output: AgentOutput, idx: number) => {
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: Date.now().toString() + `-agent-${idx}`,
                            type: 'agent',
                            agentData: output
                        }]);
                    }, idx * 500); // Stagger animations
                });
            }
        };

        ws.onclose = () => setIsConnected(false);
        wsRef.current = ws;
    }, []);

    // 3. Start Recording
    const startRecording = async () => {
        let id = consultationId;
        if (!id) {
            id = await startConsultation();
            if (id) connectWebSocket(id);
            else return;
        } else if (!wsRef.current) {
            connectWebSocket(id);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(event.data);
                }
            };

            mediaRecorder.start(1000); // Send chunks every 1s
            setIsRecording(true);
        } catch (e) {
            console.error("Error accessing microphone", e);
        }
    };

    // 4. Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    return {
        isConnected,
        isRecording,
        messages,
        startRecording,
        stopRecording
    };
}
