import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AgentOutput = {
  agent: string;
  category: string;
  content: string;
  created_at?: string;
};

type InsightResponse = {
  consultation_id: number;
  transcript: string;
  outputs: AgentOutput[];
};

const defaultBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 25px 60px rgba(0,0,0,0.38)",
  backdropFilter: "blur(12px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(12,20,35,0.8)",
  color: "#eaf0f7",
  padding: "10px 12px",
  fontSize: 15,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #4adf88, #7cc8ff)",
  color: "#03101c",
  fontWeight: 700,
  boxShadow: "0 12px 30px rgba(74,223,136,0.35)",
};

export default function Home() {
  const [baseUrl, setBaseUrl] = useState(defaultBase);
  const [health, setHealth] = useState<string>("Not checked.");
  const [log, setLog] = useState<string>("Awaiting actions…");

  const [patientName, setPatientName] = useState("Jane Doe");
  const [patientAllergies, setPatientAllergies] = useState("penicillin");
  const [patientId, setPatientId] = useState<number | null>(null);

  const [complaint, setComplaint] = useState("chest discomfort");
  const [consultId, setConsultId] = useState<number | null>(null);

  const [transcriptText, setTranscriptText] = useState("I have chest tightness when I climb stairs; taking Lisinopril.");
  const [outputs, setOutputs] = useState<AgentOutput[]>([]);
  const [history, setHistory] = useState<string>("No history loaded yet.");

  const [examFile, setExamFile] = useState<File | null>(null);
  const [examType, setExamType] = useState("imaging");
  const [examTitle, setExamTitle] = useState("CT Angio");
  const [examNotes, setExamNotes] = useState("CTA chest uploaded for review.");

  const [recording, setRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState("Not recording.");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<{ type: string; ext: string }>({ type: "audio/webm", ext: "webm" });

  const api = useMemo(() => baseUrl.replace(/\/$/, ""), [baseUrl]);

  const logMsg = useCallback((msg: string, obj?: unknown) => {
    const text = obj ? `${msg}\n${JSON.stringify(obj, null, 2)}` : msg;
    setLog(text);
  }, []);

  const fetchJson = useCallback(
    async (path: string, init?: RequestInit) => {
      const resp = await fetch(`${api}${path}`, init);
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${body}`);
      }
      return resp.json();
    },
    [api],
  );

  const checkHealth = useCallback(async () => {
    try {
      const data = await fetchJson("/health");
      setHealth("API reachable ✓");
      logMsg("Healthcheck OK", data);
    } catch (e) {
      const err = e as Error;
      setHealth("API not reachable. Check base URL / server.");
      logMsg("Healthcheck failed: " + err.message);
    }
  }, [fetchJson, logMsg]);

  const createPatient = useCallback(async () => {
    try {
      const data = await fetchJson("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: patientName,
          allergies: patientAllergies || null,
        }),
      });
      setPatientId(data.id);
      logMsg("Created patient", data);
    } catch (e) {
      const err = e as Error;
      logMsg("Create patient failed: " + err.message);
    }
  }, [fetchJson, logMsg, patientAllergies, patientName]);

  const startConsult = useCallback(async () => {
    if (!patientId) {
      logMsg("Patient ID required.");
      return;
    }
    try {
      const data = await fetchJson("/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          presenting_complaint: complaint || null,
        }),
      });
      setConsultId(data.id);
      logMsg("Started consultation", data);
    } catch (e) {
      const err = e as Error;
      logMsg("Start consultation failed: " + err.message);
    }
  }, [complaint, fetchJson, logMsg, patientId]);

  const sendText = useCallback(async () => {
    if (!consultId) {
      logMsg("Consultation ID required.");
      return;
    }
    if (!transcriptText.trim()) {
      logMsg("Transcript text required.");
      return;
    }
    try {
      const data = (await fetchJson(`/consultations/${consultId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker: "patient", text: transcriptText }),
      })) as InsightResponse;
      setOutputs(data.outputs || []);
      logMsg("Text sent", data);
    } catch (e) {
      const err = e as Error;
      logMsg("Send text failed: " + err.message);
    }
  }, [consultId, fetchJson, logMsg, transcriptText]);

  const toggleRecording = useCallback(async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices) {
      logMsg("Media devices not available in this browser.");
      return;
    }
    try {
      // Prefer formats that work across browsers (Safari often needs mp4).
      const preferred = [
        { type: "audio/webm;codecs=opus", ext: "webm" },
        { type: "audio/webm", ext: "webm" },
        { type: "audio/mp4", ext: "mp4" },
        { type: "audio/mp3", ext: "mp3" },
      ];
      const pick = preferred.find((p) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(p.type)) ?? {
        type: "",
        ext: "webm",
      };
      mimeTypeRef.current = pick;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, pick.type ? { mimeType: pick.type } : undefined);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        setRecordStatus("Recording stopped. Ready to send.");
        const blob = new Blob(chunksRef.current, { type: pick.type || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
      };
      rec.start();
      setRecording(true);
      setRecordStatus("Recording…");
      setAudioUrl(null);
      logMsg("Recording started");
    } catch (e) {
      const err = e as Error;
      logMsg("Mic access failed: " + err.message);
    }
  }, [logMsg, recording]);

  const sendAudio = useCallback(async () => {
    if (!consultId) {
      logMsg("Consultation ID required.");
      return;
    }
    if (!chunksRef.current.length) {
      logMsg("No audio recorded.");
      return;
    }
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    const { ext, type } = mimeTypeRef.current;
    formData.append("file", blob, `sample.${ext}`);
    try {
      const data = (await fetchJson(`/consultations/${consultId}/audio`, {
        method: "POST",
        body: formData,
      })) as InsightResponse;
      setOutputs(data.outputs || []);
      logMsg("Audio sent", data);
      setRecordStatus("Sent. Record again to send more.");
      chunksRef.current = [];
    } catch (e) {
      const err = e as Error;
      logMsg("Send audio failed: " + err.message);
    }
  }, [consultId, fetchJson, logMsg]);

  const fetchHistory = useCallback(async () => {
    if (!patientId) {
      logMsg("Patient ID required to fetch history.");
      return;
    }
    try {
      const [records, documents] = await Promise.all([
        fetchJson(`/records/patients/${patientId}`),
        fetchJson(`/documents/patients/${patientId}`),
      ]);
      const lines: string[] = [];
      lines.push(`Patient ID: ${patientId}`);
      if (records?.length) {
        lines.push("Records:");
        for (const r of records) {
          lines.push(`- [${r.record_type}] ${r.title} (${r.created_at || ""}) :: ${r.content_text || ""}`);
        }
      } else {
        lines.push("Records: none");
      }
      if (documents?.length) {
        lines.push("Documents:");
        for (const d of documents) {
          lines.push(`- ${d.filename} (${d.kind || "unknown"}) uploaded ${d.uploaded_at || ""}`);
        }
      } else {
        lines.push("Documents: none");
      }
      setHistory(lines.join("\n"));
      logMsg("History loaded", { records, documents });
    } catch (e) {
      const err = e as Error;
      logMsg("Fetch history failed: " + err.message);
    }
  }, [fetchJson, logMsg, patientId]);

  const generateReport = useCallback(async () => {
    if (!consultId) {
      logMsg("Consultation ID required to generate a report.");
      return;
    }
    try {
      const data = (await fetchJson(`/consultations/${consultId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker: "system",
          text: "Please generate a concise updated summary/report incorporating all transcript, meds, history, and latest exams.",
        }),
      })) as InsightResponse;
      setOutputs(data.outputs || []);
      logMsg("Report requested from agents", data);
    } catch (e) {
      const err = e as Error;
      logMsg("Report generation failed: " + err.message);
    }
  }, [consultId, fetchJson, logMsg]);

  const uploadExam = useCallback(async () => {
    if (!patientId) {
      logMsg("Patient ID required to attach an exam.");
      return;
    }
    if (!examFile) {
      logMsg("Choose a file to upload.");
      return;
    }
    try {
      // Upload document
      const docForm = new FormData();
      docForm.append("file", examFile);
      docForm.append("kind", examType);
      const docResp = await fetchJson(`/documents/patients/${patientId}`, {
        method: "POST",
        body: docForm,
      });

      // Create structured medical record so agents get context
      await fetchJson(`/records/patients/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: examType,
          title: examTitle || examFile.name,
          content_text: examNotes || `Uploaded: ${examFile.name}`,
          data: null,
          source: "frontend-upload",
        }),
      });

      // Nudge agents if consult is active
      if (consultId) {
        await fetchJson(`/consultations/${consultId}/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker: "system",
            text: `New ${examType} uploaded: ${examTitle || examFile.name}. Notes: ${examNotes || "See document."} Please analyze and include in the report.`,
          }),
        });
      }

      logMsg("Exam uploaded and queued for agents", docResp);
    } catch (e) {
      const err = e as Error;
      logMsg("Upload exam failed: " + err.message);
    }
  }, [consultId, examFile, examNotes, examTitle, examType, fetchJson, logMsg, patientId]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div style={{ maxWidth: 1220, margin: "0 auto", padding: 18, paddingBottom: 28 }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#9fb7d4",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            Pocket Council • Agents: Scribe, Dr. House, Guardian
          </span>
          <span style={{ fontSize: 17, color: health.includes("reachable") ? "#4adf88" : "#ff9d7c" }}>{health}</span>
        </div>
        <h1 style={{ margin: "8px 0 4px 0", letterSpacing: "-0.02em" }}>Backend Playground</h1>
        <p style={{ margin: 0, color: "#9fb7d4" }}>
          Create patient & consult, send transcript text or recorded audio, upload exams, and view multi-agent outputs.
        </p>
      </header>

      <div className="grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div style={glassCard}>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Base URL</label>
          <input style={inputStyle} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <button style={{ ...buttonStyle, marginTop: 10 }} onClick={checkHealth}>
            Check /health
          </button>
        </div>
        <div style={glassCard}>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Patient</h3>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Full name</label>
          <input style={inputStyle} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Allergies</label>
          <input style={inputStyle} value={patientAllergies} onChange={(e) => setPatientAllergies(e.target.value)} />
          <button style={{ ...buttonStyle, marginTop: 10 }} onClick={createPatient}>
            Create Patient
          </button>
          <div style={{ color: "#9fb7d4", marginTop: 8 }}>Patient ID: {patientId ?? "–"}</div>
        </div>
        <div style={glassCard}>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Consultation</h3>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Patient ID</label>
          <input style={inputStyle} value={patientId ?? ""} onChange={(e) => setPatientId(Number(e.target.value))} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Presenting complaint</label>
          <input style={inputStyle} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          <button style={{ ...buttonStyle, marginTop: 10 }} onClick={startConsult}>
            Start Consultation
          </button>
          <div style={{ color: "#9fb7d4", marginTop: 8 }}>Consult ID: {consultId ?? "–"}</div>
        </div>
      </div>

      <div className="grid" style={{ display: "grid", gap: 12, marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div style={glassCard}>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Send Transcript (text)</h3>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Consultation ID</label>
          <input style={inputStyle} value={consultId ?? ""} onChange={(e) => setConsultId(Number(e.target.value))} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Transcript text</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
          />
          <button style={{ ...buttonStyle, marginTop: 10 }} onClick={sendText}>
            Send Text
          </button>
        </div>

        <div style={glassCard}>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Record & Send Audio</h3>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Consultation ID</label>
          <input style={inputStyle} value={consultId ?? ""} onChange={(e) => setConsultId(Number(e.target.value))} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={{
                ...buttonStyle,
                flex: 1,
                boxShadow: recording ? "0 12px 30px rgba(255,109,109,0.3)" : buttonStyle.boxShadow,
                background: recording ? "linear-gradient(135deg, #ff9d7c, #ff6b6b)" : buttonStyle.background as string,
              }}
              onClick={toggleRecording}
            >
              {recording ? "Stop Recording" : "Start Recording"}
            </button>
            <button style={{ ...buttonStyle, flex: 1 }} onClick={sendAudio} disabled={!audioUrl && chunksRef.current.length === 0}>
              Send Audio
            </button>
          </div>
          <div style={{ color: "#9fb7d4", marginTop: 6, fontSize: 14 }}>{recordStatus}</div>
          {audioUrl && <audio controls src={audioUrl} style={{ marginTop: 8, width: "100%" }} />}
        </div>

        <div style={glassCard}>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Upload Exam / Report</h3>
          <label style={{ color: "#9fb7d4", fontSize: 14 }}>Patient ID (required)</label>
          <input style={inputStyle} value={patientId ?? ""} onChange={(e) => setPatientId(Number(e.target.value))} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Consultation ID (optional to notify agents)</label>
          <input style={inputStyle} value={consultId ?? ""} onChange={(e) => setConsultId(Number(e.target.value))} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Exam type</label>
          <select style={inputStyle} value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="lab_panel">Lab panel</option>
            <option value="imaging">Imaging</option>
            <option value="exam">Exam</option>
            <option value="note">Note</option>
            <option value="other">Other</option>
          </select>
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Title</label>
          <input style={inputStyle} value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>Notes / summary (sent to agents)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={examNotes}
            onChange={(e) => setExamNotes(e.target.value)}
          />
          <label style={{ color: "#9fb7d4", fontSize: 14, marginTop: 8 }}>File</label>
          <input style={inputStyle} type="file" onChange={(e) => setExamFile(e.target.files?.[0] || null)} />
          <button style={{ ...buttonStyle, marginTop: 10 }} onClick={uploadExam}>
            Upload & Ask Agents
          </button>
        </div>
      </div>

      <div style={{ ...glassCard, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>History & Reports</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button style={{ ...buttonStyle, flex: "1 1 180px" }} onClick={fetchHistory}>
            Get Patient History
          </button>
          <button style={{ ...buttonStyle, flex: "1 1 180px" }} onClick={generateReport}>
            Generate New Report
          </button>
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", minHeight: 80 }}>{history}</pre>
      </div>

      <div style={{ ...glassCard, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Agent Outputs</h3>
        {outputs.length === 0 && <div style={{ color: "#9fb7d4" }}>No outputs yet.</div>}
        {outputs.map((o, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{o.agent || "Agent"}</strong>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#9fb7d4",
                  fontSize: 12,
                }}
              >
                {o.category || "insight"}
              </span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: (o.content || "").replace(/\n/g, "<br>") }} />
          </div>
        ))}
      </div>

      <div style={{ ...glassCard, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Log</h3>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", minHeight: 100 }}>{log}</pre>
      </div>
    </div>
  );
}
