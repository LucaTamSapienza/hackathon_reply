import os
import sys
from dotenv import load_dotenv

# Ensure we can import from app
sys.path.append(os.getcwd())
load_dotenv()

from app.config import get_settings
from app.agents.orchestrator import Orchestrator

def test_agents():
    print("Initializing Orchestrator...")
    settings = get_settings()
    try:
        orchestrator = Orchestrator(settings)
    except Exception as e:
        print(f"Error initializing orchestrator: {e}")
        return

    transcript = "Patient complains of severe chest pain radiating to the left arm. History of hypertension. Doctor asks: What is the recommended dosage of Aspirin for acute MI?"
    context = {
        "allergies": "Penicillin",
        "medications": "Lisinopril",
        "complaint": "Chest pain"
    }

    print(f"\nProcessing transcript: '{transcript}'")
    results = orchestrator.run(transcript, context)
    
    print("\n--- Agent Results ---")
    for res in results:
        print(f"[{res.agent}] ({res.category}): {res.content}\n")

if __name__ == "__main__":
    test_agents()
