import httpx
import time

BASE_URL = "http://localhost:8000"

def simulate_consultation_flow():
    print("=" * 60)
    print("POCKET COUNCIL - Full Workflow Demo")
    print("=" * 60)
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Create Patient
        print("\n📋 Step 1: Creating Patient...")
        patient_data = {
            "full_name": "Maria Gonzalez",
            "date_of_birth": "1985-05-15",
            "allergies": "Penicillin, Pollen",
            "history": "Hypertension, migraine history",
            "medications": [
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "daily"},
                {"name": "Sumatriptan", "dosage": "50mg", "frequency": "as needed"}
            ]
        }
        response = client.post("/patients", json=patient_data)
        if response.status_code != 200:
            print(f"❌ Failed: {response.text}")
            return
        patient = response.json()
        print(f"✅ Patient created: {patient['full_name']} (ID: {patient['id']})")

        # 2. Start Consultation
        print("\n🩺 Step 2: Starting Consultation...")
        consult_data = {
            "patient_id": patient['id'],
            "presenting_complaint": "Severe headache and neck stiffness"
        }
        response = client.post("/consultations", json=consult_data)
        if response.status_code != 200:
            print(f"❌ Failed: {response.text}")
            return
        consultation = response.json()
        consult_id = consultation["id"]
        print(f"✅ Consultation started (ID: {consult_id})")

        # 3. Simulate real-time transcript chunks (Doctor-Patient conversation)
        print("\n💬 Step 3: Processing Conversation...")
        conversation = [
            ("patient", "It's been a really bad headache, Doctor, for two days now. And my neck feels stiff."),
            ("doctor", "I see. Have you experienced any fever or sensitivity to light?"),
            ("patient", "Yes, actually. The light bothers my eyes a lot."),
            ("doctor", "What is the recommended dosage of Aspirin for suspected meningitis?"),
        ]
        
        for speaker, text in conversation:
            print(f"\n  🗣️  [{speaker.upper()}]: {text}")
            transcript_data = {"text": text, "speaker": speaker}
            response = client.post(f"/consultations/{consult_id}/transcript", json=transcript_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ⚡ {len(data['outputs'])} agent(s) responded:")
                for output in data['outputs']:
                    agent_icon = {
                        "Scribe": "📝",
                        "Dr. House": "🔍",
                        "Guardian": "🛡️",
                        "Dr. Watson": "📚"
                    }.get(output['agent'], "🤖")
                    print(f"    {agent_icon} [{output['agent']}]: {output['content'][:120]}...")
            else:
                print(f"  ❌ Error: {response.text}")
            
            time.sleep(1)  # Simulate natural conversation pace

        # 4. Get All Insights
        print("\n\n📊 Step 4: Retrieving All Insights...")
        response = client.get(f"/consultations/{consult_id}/insights")
        if response.status_code == 200:
            insights = response.json()
            print(f"✅ Retrieved {len(insights)} total insights")
            
            # Group by agent
            by_agent = {}
            for insight in insights:
                agent = insight['agent']
                if agent not in by_agent:
                    by_agent[agent] = []
                by_agent[agent].append(insight['content'])
            
            for agent, contents in by_agent.items():
                print(f"\n  👤 {agent}: {len(contents)} insight(s)")
        
        # 5. Close Consultation
        print("\n\n🏁 Step 5: Closing Consultation...")
        response = client.post(
            f"/consultations/{consult_id}/close",
            params={"summary": "Suspected meningitis. Patient referred to emergency for CT scan and lumbar puncture."}
        )
        if response.status_code == 200:
            print("✅ Consultation closed successfully")
            print(f"   Status: {response.json()['status']}")
        
        print("\n" + "=" * 60)
        print("Demo Complete! ✨")
        print("=" * 60)

if __name__ == "__main__":
    try:
        simulate_consultation_flow()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
