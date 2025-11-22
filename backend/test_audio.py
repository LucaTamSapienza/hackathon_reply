import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_connection():
    """Test if OpenAI API key is valid"""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key or api_key == 'your_openai_api_key_here':
        print("❌ ERROR: OpenAI API key not set properly in .env file")
        print("   Please edit backend/.env and add your real API key:")
        print("   OPENAI_API_KEY=sk-...")
        return False
    
    print(f"✅ OpenAI API key found: {api_key[:10]}...{api_key[-4:]}")
    
    # Test connection
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Simple test - list models
        models = client.models.list()
        print(f"✅ OpenAI API connection successful!")
        return True
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {e}")
        return False

def test_whisper_with_sample():
    """Test Whisper transcription with a sample audio file"""
    print("\n📝 Testing Whisper Transcription...")
    print("   Note: You need to record a sample audio file to test.")
    print("   For now, we'll just verify the transcription function exists.")
    
    try:
        from app.services import audio
        from app.config import get_settings
        
        settings = get_settings()
        print(f"✅ Audio service loaded")
        print(f"   Transcription model: {settings.transcription_model}")
        print(f"   Storage path: {settings.storage_path}")
        
        # Check if storage directory exists
        storage_dir = Path(settings.storage_path)
        if not storage_dir.exists():
            print(f"   Creating storage directory: {storage_dir}")
            storage_dir.mkdir(parents=True, exist_ok=True)
        
        return True
    except Exception as e:
        print(f"❌ Audio service test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Backend Audio Transcription Test")
    print("=" * 60)
    
    # Test 1: OpenAI API Key
    print("\n1. Testing OpenAI API Key...")
    if not test_openai_connection():
        print("\n⚠️  Please fix your .env file before continuing")
        exit(1)
    
    # Test 2: Audio service
    print("\n2. Testing Audio Service...")
    if not test_whisper_with_sample():
        exit(1)
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Make sure your .env has a valid OpenAI API key")
    print("2. Start the backend: uvicorn app.main:app --reload --reload-dir app")
    print("3. Test with the frontend by speaking into your microphone")
