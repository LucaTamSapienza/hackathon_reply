import { useState, useRef, useCallback, useEffect } from 'react';

// Mocked SOAP note that appears after consultation starts
const MOCKED_SOAP_NOTE = `**Subjective:**
Patient reports severe, throbbing headaches on the right side, occurring suddenly in the afternoon for the past week. Associated symptoms include nausea, photophobia, and visual auras (zigzag lines) lasting 15 minutes before headaches. Family history of migraines noted. Increased stress and poor sleep (5 hours/night) reported.

**Objective:**
BP 128/82, HR 76, Temp 98.6°F. Allergies: Penicillin (hives). Medications: Oral Contraceptive (Combined).

**Assessment:**
1. Migraine with aura 2. Stress-related headache triggers 3. Sleep deprivation

**Plan:**
Prescribe sumatriptan 50mg for acute attacks, propranolol 40mg daily for prevention. Advise keeping a headache diary and improving sleep hygiene. Follow-up in 4 weeks.`;

export function useConsultation() {
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([]);
    const [soapNote, setSoapNote] = useState('');
    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [consultationId, setConsultationId] = useState(null);

    const startConsultation = async () => {
        try {
            const res = await fetch('http://localhost:8000/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient: {
                        full_name: "Sarah Johnson",
                        date_of_birth: "1985-03-15",
                        allergies: "Penicillin (hives)",
                        history: "Family history of migraines (mother). No significant past medical history.",
                        medications: [
                            { name: "Oral Contraceptive (Combined)", dosage: "1 tablet", frequency: "daily", notes: "Taking regularly for 2 years" }
                        ]
                    },
                    presenting_complaint: "Severe recurring headaches with visual aura"
                })
            });
            const data = await res.json();
            setConsultationId(data.id);
            return data.id;
        } catch (e) {
            console.error("Failed to start consultation", e);
            return null;
        }
    };

    const connectWebSocket = useCallback((id) => {
        if (wsRef.current) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/consultation/${id}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'insight') {
                if (data.transcript) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString() + '-user',
                        type: 'user',
                        text: data.transcript,
                        timestamp: new Date().toLocaleTimeString()
                    }]);
                }

                data.outputs.forEach((output, idx) => {
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: Date.now().toString() + `-agent-${idx}`,
                            type: 'agent',
                            agent: output.agent,
                            category: output.category,
                            content: output.content,
                            timestamp: new Date().toLocaleTimeString()
                        }]);
                    }, idx * 300);
                });
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        wsRef.current = ws;
    }, []);

    const startRecording = async () => {
        let id = consultationId;
        if (!id) {
            id = await startConsultation();
            if (id) {
                // Show mocked SOAP note immediately
                setTimeout(() => {
                    setSoapNote(MOCKED_SOAP_NOTE);
                }, 1000);
                
                // Trigger agents with mocked transcript via REST API
                setTimeout(async () => {
                    try {
                        const mockedTranscript = "Patient reports severe headaches on the right side for the past week, with visual auras, nausea, and photophobia. Family history of migraines. Currently on oral contraceptives. Allergic to penicillin.";
                        
                        const response = await fetch(`http://localhost:8000/consultations/${id}/transcript`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                speaker: "patient",
                                text: mockedTranscript
                            })
                        });
                        
                        const data = await response.json();
                        const outputs = data.outputs; // Extract outputs from InsightBundle
                        
                        // Add transcript to messages
                        setMessages(prev => [...prev, {
                            id: Date.now().toString() + '-user',
                            type: 'user',
                            text: mockedTranscript,
                            timestamp: new Date().toLocaleTimeString()
                        }]);
                        
                        // Add agent outputs with staggered timing
                        outputs.forEach((output, idx) => {
                            setTimeout(() => {
                                setMessages(prev => [...prev, {
                                    id: Date.now().toString() + `-agent-${idx}`,
                                    type: 'agent',
                                    agent: output.agent,
                                    category: output.category,
                                    content: output.content,
                                    timestamp: new Date().toLocaleTimeString()
                                }]);
                            }, idx * 500);
                        });
                    } catch (e) {
                        console.error("Failed to trigger agents", e);
                    }
                }, 2000);
            }
            else return;
        }

        // Try to get microphone for real recording (optional)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            // Connect WebSocket for real-time if needed
            if (!wsRef.current) {
                connectWebSocket(id);
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(event.data);
                }
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (e) {
            console.error("Microphone not available, using mocked data only", e);
            // Still set recording state to show UI feedback
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    return {
        isRecording,
        messages,
        soapNote,
        startRecording,
        stopRecording
    };
}
