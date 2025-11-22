'use client';

import { useState } from 'react';
import { Mic, FileSearch, ChevronDown, Stethoscope, AlertTriangle, BookOpen, FileText, Brain } from 'lucide-react';

// Sample patients
const PATIENTS = [
    {
        id: 1,
        name: "Sarah Johnson",
        age: 40,
        condition: "Migraines",
        allergies: "Penicillin",
        meds: "Oral Contraceptive"
    },
    {
        id: 2,
        name: "John Smith",
        age: 55,
        condition: "Hypertension",
        allergies: "None",
        meds: "Lisinopril, Metformin"
    },
    {
        id: 3,
        name: "Maria Garcia",
        age: 33,
        condition: "Asthma",
        allergies: "Sulfa drugs",
        meds: "Albuterol inhaler"
    }
];

export default function Homepage() {
    const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]);
    const [showPatientList, setShowPatientList] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [allAgentOutputs, setAllAgentOutputs] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleStartRecording = async () => {
        setIsRecording(true);
        setShowReport(false);
        setLoading(true);
        
        // Simulate recording and getting consultation data
        try {
            const res = await fetch('http://localhost:8000/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient: {
                        full_name: selectedPatient.name,
                        date_of_birth: "1985-03-15",
                        allergies: selectedPatient.allergies,
                        history: `Patient with ${selectedPatient.condition}`,
                        medications: [{ name: selectedPatient.meds, dosage: "", frequency: "daily" }]
                    },
                    presenting_complaint: `Consultation for ${selectedPatient.condition}`
                })
            });
            const consultation = await res.json();
            
            // Send mocked transcript (full conversation)
            const mockedConversation = `Doctor: Good morning! What brings you in today?
Patient: I've been having these terrible headaches for about 6 months now.
Doctor: Can you describe the headaches for me?
Patient: They're very intense, throbbing pain, usually on the right side of my head.
Doctor: How often do you get these headaches?
Patient: About three times a week, sometimes more.
Doctor: Do you notice any patterns or triggers?
Patient: They seem worse when I'm stressed, and bright lights make them unbearable.
Doctor: Any warning signs before the headache starts?
Patient: Yes, sometimes I see flashing lights or zigzag lines.
Doctor: Do you experience nausea or vomiting?
Patient: Yes, often nausea and sometimes I throw up.
Doctor: Any sensitivity to sound?
Patient: Definitely, I have to find a quiet, dark room when they hit.
Doctor: How long do these headaches typically last?
Patient: Usually 4 to 6 hours, sometimes longer.
Doctor: Are you taking any medications currently?
Patient: Just my oral contraceptive.
Doctor: Any known allergies?
Patient: Yes, I'm allergic to penicillin.
Doctor: Does anyone in your family have migraines?
Patient: My mother had them when she was younger.`;
            
            setTimeout(async () => {
                const transcriptRes = await fetch(`http://localhost:8000/consultations/${consultation.id}/transcript`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        speaker: "patient",
                        text: mockedConversation
                    })
                });
                const data = await transcriptRes.json();
                
                // Store all agent outputs
                setAllAgentOutputs({
                    transcript: data.transcript,
                    outputs: data.outputs
                });
                setLoading(false);
            }, 2000);
            
        } catch (e) {
            console.error("Failed to start recording", e);
            setLoading(false);
            setIsRecording(false);
        }
    };

    const handleRetrieveInfo = () => {
        if (allAgentOutputs) {
            setShowReport(true);
        }
    };
    
    const handleStopRecording = () => {
        setIsRecording(false);
    };

    // Parse Dr. House diagnosis
    const parseHouseDiagnosis = (content) => {
        if (!content) return { diagnoses: [] };
        
        const lines = content.split('\n');
        const diagnoses = [];
        let currentDx = null;
        
        for (const line of lines) {
            if (line.match(/^\d+\.\s+\*\*(.+?)\*\*/)) {
                if (currentDx) diagnoses.push(currentDx);
                const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
                currentDx = { name: match[1], rationale: '', question: '' };
            } else if (line.includes('Rationale:')) {
                if (currentDx) currentDx.rationale = line.replace(/.*Rationale:\s*/, '').trim();
            } else if (line.includes('Discriminating Question')) {
                if (currentDx) currentDx.question = line.replace(/.*Discriminating Question[^:]*:\s*/, '').trim();
            }
        }
        
        if (currentDx) diagnoses.push(currentDx);
        return { diagnoses: diagnoses.slice(0, 3) };
    };
    
    // Parse Guardian alerts
    const parseGuardianAlerts = (content) => {
        if (!content) return [];
        const lines = content.split('\n');
        const alerts = [];
        
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*\*\*([^*:]+?)(?::|\*\*)\s*(.+)/);
            if (match) {
                alerts.push({ 
                    type: match[1].replace(/\*\*/g, '').trim(), 
                    message: match[2].trim() 
                });
            }
        }
        
        return alerts;
    };
    
    // Parse SOAP sections
    const parseSoap = (text) => {
        if (!text) return null;
        const sections = {};
        const parts = text.split(/\*\*([A-Za-z]+):\*\*/);
        for (let i = 1; i < parts.length; i += 2) {
            sections[parts[i].toLowerCase()] = parts[i + 1]?.trim() || '';
        }
        return sections;
    };
    
    // Parse Watson guidelines
    const parseWatsonGuidelines = (content) => {
        if (!content) return [];
        const lines = content.split('\n');
        const guidelines = [];
        let currentGuideline = null;
        
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*\*\*([^*:]+?)(?::|\*\*)\s*(.+)/);
            if (match) {
                if (currentGuideline) guidelines.push(currentGuideline);
                currentGuideline = { 
                    title: match[1].trim(), 
                    detail: match[2].trim() 
                };
            } else if (currentGuideline && line.trim() && !line.includes('Based on') && !line.includes('For further') && !line.includes('American')) {
                currentGuideline.detail += ' ' + line.trim();
            }
        }
        
        if (currentGuideline) guidelines.push(currentGuideline);
        return guidelines.slice(0, 5);
    };
    
    // Get parsed data if available
    const scribeOutput = allAgentOutputs?.outputs.find(o => o.agent === 'Scribe');
    const houseOutput = allAgentOutputs?.outputs.find(o => o.agent === 'Dr. House');
    const guardianOutput = allAgentOutputs?.outputs.find(o => o.agent === 'Guardian');
    const watsonOutput = allAgentOutputs?.outputs.find(o => o.agent === 'Dr. Watson');
    
    const soapSections = parseSoap(scribeOutput?.content);
    const houseParsed = parseHouseDiagnosis(houseOutput?.content);
    const guardianAlerts = parseGuardianAlerts(guardianOutput?.content);
    const watsonGuidelines = parseWatsonGuidelines(watsonOutput?.content);

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            {/* Minimal Header with Logo */}
            <header className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    {/* Cool Logo */}
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a]"></div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Pocket Council</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI Medical Assistant</p>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6 max-w-md mx-auto space-y-6">
                {/* Patient Selector */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-3 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        Active Patient
                    </label>
                    <button
                        onClick={() => setShowPatientList(!showPatientList)}
                        className="w-full bg-linear-to-br from-blue-500/10 to-violet-500/10 border-2 border-blue-500/30 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/50 transition-all shadow-lg shadow-blue-500/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
                                <span className="text-xl">👤</span>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">{selectedPatient.name}</div>
                                <div className="text-sm text-blue-300 font-medium">{selectedPatient.age}y • {selectedPatient.condition}</div>
                            </div>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-blue-400 transition-transform ${showPatientList ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Patient List Dropdown */}
                    {showPatientList && (
                        <div className="mt-3 bg-white/5 border border-blue-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                            {PATIENTS.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => {
                                        setSelectedPatient(patient);
                                        setShowPatientList(false);
                                        setShowReport(false);
                                        setAllAgentOutputs(null);
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-blue-500/10 transition-colors border-b border-white/5 last:border-b-0"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                        <span className="text-lg">👤</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">{patient.name}</div>
                                        <div className="text-xs text-slate-400">{patient.age}y • {patient.condition}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Patient Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-slate-400">Allergies</div>
                            <div className="text-sm font-medium">{selectedPatient.allergies}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Medications</div>
                            <div className="text-sm font-medium">{selectedPatient.meds}</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {!isRecording ? (
                        <button
                            onClick={handleStartRecording}
                            className="w-full bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl p-4 flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]"
                        >
                            <Mic className="w-6 h-6" />
                            Start Recording
                        </button>
                    ) : (
                        <button
                            onClick={handleStopRecording}
                            className="w-full bg-red-500 hover:bg-red-600 rounded-xl p-4 flex items-center justify-center gap-3 font-semibold transition-colors"
                        >
                            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                            Stop Recording
                        </button>
                    )}
                    
                    <button
                        onClick={handleRetrieveInfo}
                        disabled={!allAgentOutputs}
                        className="w-full bg-linear-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none rounded-xl p-4 flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]"
                    >
                        <FileSearch className="w-6 h-6" />
                        Retrieve Information
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-slate-400">Processing consultation...</p>
                    </div>
                )}

                {/* Comprehensive Report - All Agents */}
                {showReport && allAgentOutputs && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
                        {/* Mocked Conversation Transcript */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Mic className="w-4 h-4 text-blue-400" />
                                <h2 className="font-semibold text-sm">Consultation Transcript</h2>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                {allAgentOutputs.transcript?.split('\n').map((line, idx) => {
                                    if (line.startsWith('Doctor:')) {
                                        return (
                                            <div key={idx} className="text-blue-300">
                                                <span className="font-semibold">Doctor:</span> {line.replace('Doctor:', '')}
                                            </div>
                                        );
                                    } else if (line.startsWith('Patient:')) {
                                        return (
                                            <div key={idx} className="text-green-300">
                                                <span className="font-semibold">Patient:</span> {line.replace('Patient:', '')}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        {/* Scribe SOAP Note */}
                        {soapSections && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-violet-400" />
                                    <h2 className="font-semibold text-sm">Clinical Note (SOAP)</h2>
                                </div>
                                <div className="space-y-3 text-xs">
                                    {soapSections.subjective && (
                                        <div>
                                            <h3 className="font-semibold text-blue-400 mb-1">Subjective</h3>
                                            <p className="text-slate-300">{soapSections.subjective}</p>
                                        </div>
                                    )}
                                    {soapSections.objective && (
                                        <div>
                                            <h3 className="font-semibold text-green-400 mb-1">Objective</h3>
                                            <p className="text-slate-300">{soapSections.objective}</p>
                                        </div>
                                    )}
                                    {soapSections.assessment && (
                                        <div>
                                            <h3 className="font-semibold text-yellow-400 mb-1">Assessment</h3>
                                            <p className="text-slate-300">{soapSections.assessment}</p>
                                        </div>
                                    )}
                                    {soapSections.plan && (
                                        <div>
                                            <h3 className="font-semibold text-purple-400 mb-1">Plan</h3>
                                            <p className="text-slate-300">{soapSections.plan}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dr. House Differential Diagnosis */}
                        {houseParsed.diagnoses.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain className="w-4 h-4 text-pink-400" />
                                    <h2 className="font-semibold text-sm">Differential Diagnosis</h2>
                                </div>
                                <div className="space-y-2">
                                    {houseParsed.diagnoses.map((dx, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                            <h3 className="font-semibold text-pink-400 text-sm mb-1">
                                                {idx + 1}. {dx.name}
                                            </h3>
                                            {dx.rationale && (
                                                <p className="text-[11px] text-slate-300 mb-2">{dx.rationale}</p>
                                            )}
                                            {dx.question && (
                                                <div className="bg-pink-500/10 rounded px-2 py-1 mt-1">
                                                    <p className="text-[10px] text-pink-300 italic">
                                                        Q: {dx.question}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guardian Safety Alerts */}
                        {guardianAlerts.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <h2 className="font-semibold text-sm">Safety & Monitoring</h2>
                                </div>
                                <div className="space-y-2">
                                    {guardianAlerts.map((alert, idx) => (
                                        <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                            <h3 className="font-semibold text-red-400 text-xs mb-1">{alert.type}</h3>
                                            <p className="text-[11px] text-slate-300">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dr. Watson Clinical Guidelines */}
                        {watsonGuidelines.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-4 h-4 text-emerald-400" />
                                    <h2 className="font-semibold text-sm">Clinical Guidelines</h2>
                                </div>
                                <div className="space-y-2">
                                    {watsonGuidelines.map((guideline, idx) => (
                                        <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                            <h3 className="font-semibold text-emerald-400 text-xs mb-1">
                                                {idx + 1}. {guideline.title}
                                            </h3>
                                            <p className="text-[11px] text-slate-300">{guideline.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
