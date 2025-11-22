import httpx
import time
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    print("Starting API Test Flow...")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Create Patient
        print("\n1. Creating Patient...")
        patient_data = {
            "full_name": "John Doe",
            "date_of_birth": "1980-01-01",
            "allergies": "Peanuts",
            "history": "Hypertension",
            "medications": [{"name": "Lisinopril", "dosage": "10mg", "frequency": "daily"}]
        }
        response = client.post("/patients", json=patient_data)
        if response.status_code != 200:
            print(f"Failed to create patient: {response.text}")
            return
        patient = response.json()
        patient_id = patient["id"]
        print(f"✅ Patient created: ID {patient_id} ({patient['full_name']})")

        # 2. Create Medical Record
        print("\n2. Creating Medical Record...")
        record_data = {
            "record_type": "lab_panel",
            "title": "Blood Work",
            "content_text": "Cholesterol is slightly elevated.",
            "data": {"cholesterol": 210, "hdl": 40, "ldl": 150}
        }
        response = client.post(f"/records/patients/{patient_id}", json=record_data)
        if response.status_code == 200:
            print(f"✅ Medical record created: ID {response.json()['id']}")
        else:
            print(f"⚠️ Failed to create record: {response.text}")

        # 3. Start Consultation
        print("\n3. Starting Consultation...")
        consult_data = {
            "patient_id": patient_id,
            "presenting_complaint": "Chest pain"
        }
        response = client.post("/consultations", json=consult_data)
        if response.status_code != 200:
            print(f"Failed to start consultation: {response.text}")
            return
        consultation = response.json()
        consult_id = consultation["id"]
        print(f"✅ Consultation started: ID {consult_id}")

        # 4. Send Transcript (Simulate Audio)
        print("\n4. Sending Transcript (Simulating Audio)...")
        transcript_data = {
            "text": "I have been feeling a sharp pain in my chest since this morning.",
            "speaker": "patient"
        }
        response = client.post(f"/consultations/{consult_id}/transcript", json=transcript_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Transcript processed. Agents responded:")
            for output in data["outputs"]:
                print(f"   - [{output['agent']}] ({output['category']}): {output['content'][:100]}...")
        else:
            print(f"⚠️ Failed to send transcript: {response.text}")

        # 5. Get Insights
        print("\n5. Fetching Insights...")
        response = client.get(f"/consultations/{consult_id}/insights")
        if response.status_code == 200:
            insights = response.json()
            print(f"✅ Retrieved {len(insights)} insights.")
        else:
            print(f"⚠️ Failed to get insights: {response.text}")

        # 6. Close Consultation
        print("\n6. Closing Consultation...")
        response = client.post(f"/consultations/{consult_id}/close", params={"summary": "Patient referred to cardiology."})
        if response.status_code == 200:
            print(f"✅ Consultation closed.")
        else:
            print(f"⚠️ Failed to close consultation: {response.text}")

        # 7. List Patients
        print("\n7. Listing Patients...")
        response = client.get("/patients")
        if response.status_code == 200:
            patients = response.json()
            print(f"✅ Found {len(patients)} patients.")
        else:
            print(f"⚠️ Failed to list patients: {response.text}")

if __name__ == "__main__":
    try:
        import httpx
        test_api()
    except ImportError:
        print("Please install httpx: pip install httpx")
