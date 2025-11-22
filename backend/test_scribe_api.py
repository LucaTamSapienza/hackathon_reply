#!/usr/bin/env python3
"""
Simple test script to verify the Scribe agent works via the API.
Run this after starting the FastAPI server with: uvicorn app.main:app --reload
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_step(step_num: int, message: str):
    """Print formatted step header."""
    print(f"\n{'='*70}")
    print(f"  STEP {step_num}: {message}")
    print('='*70)

def main():
    print("\n🏥 POCKET COUNCIL API TEST - Scribe Agent")
    print("Make sure the server is running: uvicorn app.main:app --reload\n")
    
    # Test health endpoint
    print_step(1, "Testing API Health")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ API is running: {response.json()}")
    except Exception as e:
        print(f"❌ Cannot connect to API. Is it running?")
        print(f"   Error: {e}")
        print("\n   Start the server with: cd backend && uvicorn app.main:app --reload")
        return
    
    # Create a patient
    print_step(2, "Creating Patient")
    patient_data = {
        "full_name": "Sarah Johnson",
        "date_of_birth": "1985-03-15",
        "allergies": "Penicillin (hives)",
        "history": "Family history of migraines (mother).",
        "medications": [
            {
                "name": "Oral Contraceptive (Combined)",
                "dosage": "1 tablet",
                "frequency": "Daily"
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/patients", json=patient_data)
    patient = response.json()
    patient_id = patient["id"]
    print(f"✅ Created patient: {patient['full_name']} (ID: {patient_id})")
    
    # Start consultation
    print_step(3, "Starting Consultation")
    consult_data = {
        "patient_id": patient_id,
        "presenting_complaint": "Severe recurring headaches with visual aura"
    }
    
    response = requests.post(f"{BASE_URL}/consultations", json=consult_data)
    consultation = response.json()
    consult_id = consultation["id"]
    print(f"✅ Started consultation ID: {consult_id}")
    print(f"   Chief complaint: {consultation['summary']}")
    
    # Add conversation transcript
    print_step(4, "Adding Doctor-Patient Conversation")
    
    conversation = [
        {"speaker": "Doctor", "text": "Good morning! What brings you in today?"},
        {"speaker": "Patient", "text": "Hi doctor. I've been having these terrible headaches for the past week. They come on suddenly, usually in the afternoon, and the pain is really intense on the right side of my head."},
        {"speaker": "Doctor", "text": "I see. Can you describe the pain? Is it throbbing, sharp, or dull?"},
        {"speaker": "Patient", "text": "It's definitely throbbing, almost like a pulse. Sometimes I feel nauseous when it gets really bad, and light bothers me a lot."},
        {"speaker": "Doctor", "text": "Have you had any vision changes, like seeing spots or blurred vision before the headache starts?"},
        {"speaker": "Patient", "text": "Yes! About 20 minutes before the headache hits, I sometimes see these zigzag lines in my vision. They usually last about 15 minutes."},
        {"speaker": "Doctor", "text": "Those are called visual auras, and they're often associated with migraines. Do you have any family history of migraines?"},
        {"speaker": "Patient", "text": "My mother used to get terrible migraines when she was younger."},
        {"speaker": "Doctor", "text": "Let me check your vitals. Your blood pressure is 128/82, heart rate is 76, temperature 98.6°F."},
        {"speaker": "Doctor", "text": "Based on your symptoms - the throbbing headache, visual aura, nausea, and photophobia, along with your family history - this is consistent with migraine with aura. I'll prescribe sumatriptan 50mg for acute attacks and propranolol 40mg daily for prevention."},
    ]
    
    print(f"Adding {len(conversation)} conversation exchanges...")
    for exchange in conversation:
        response = requests.post(
            f"{BASE_URL}/consultations/{consult_id}/transcript",
            json=exchange
        )
        print(f"  ✓ [{exchange['speaker']}] {exchange['text'][:50]}...")
        time.sleep(0.1)  # Small delay to avoid overwhelming the server
    
    print(f"\n✅ All conversation added and agents triggered")
    
    # Get agent insights
    print_step(5, "Retrieving Agent Insights")
    response = requests.get(f"{BASE_URL}/consultations/{consult_id}/insights")
    insights = response.json()
    
    print(f"✅ Retrieved {len(insights)} agent outputs\n")
    
    # Display Scribe output
    scribe_output = next((i for i in insights if i["agent"] == "Scribe"), None)
    
    if scribe_output:
        print("\n" + "="*70)
        print("  📋 SCRIBE AGENT OUTPUT (SOAP NOTE)")
        print("="*70 + "\n")
        print(scribe_output["content"])
        print("\n" + "="*70)
    else:
        print("⚠️  No Scribe output found")
    
    # Display other agents
    print("\n" + "="*70)
    print("  🤖 OTHER AGENT OUTPUTS")
    print("="*70)
    
    for insight in insights:
        if insight["agent"] != "Scribe":
            print(f"\n🔹 {insight['agent']} ({insight['category']}):")
            print("-" * 50)
            print(insight["content"][:300] + "..." if len(insight["content"]) > 300 else insight["content"])
    
    # Summary
    print("\n" + "="*70)
    print("  ✅ TEST COMPLETE")
    print("="*70)
    print(f"\nSummary:")
    print(f"  • Patient ID: {patient_id}")
    print(f"  • Consultation ID: {consult_id}")
    print(f"  • Conversation exchanges: {len(conversation)}")
    print(f"  • Agent insights: {len(insights)}")
    print(f"  • Scribe SOAP note: {'✓ Generated' if scribe_output else '✗ Not found'}")
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
