# Backend API Guide for Frontend Integration

## 🌐 API Base URL

```
https://modern-beans-fold.loca.lt
```

> [!IMPORTANT]
> **First Time Access**: When you first visit this URL in your browser, localtunnel will show a security page. Simply click the **"Continue"** or **"Click to Continue"** button to proceed. This is a one-time step per browser session.

## 📡 Available API Endpoints

Based on the backend implementation, here are the available routes:

### Health Check
- **GET** `/health` - Check if the API is running

### Patients
- **Endpoints available in** `routes_patients.py`
- Base path: `/api/patients` (likely)

### Consultations
- **Endpoints available in** `routes_consultations.py`
- Base path: `/api/consultations` (likely)

### Documents
- **Endpoints available in** `routes_documents.py`
- Base path: `/api/documents` (likely)

### Medical Records
- **Endpoints available in** `routes_records.py`
- Base path: `/api/records` (likely)

### WebSocket
- **Real-time communication** via WebSocket
- Available in `routes_websocket.py`

## 🔧 Frontend Integration Example

### Basic Fetch Example

```typescript
const API_BASE_URL = 'https://modern-beans-fold.loca.lt';

async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  const data = await response.json();
  return data;
}
```

### With Error Handling

```typescript
async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## 🔑 Authentication

> [!NOTE]
> No API keys are required from the frontend. The backend handles OpenAI API authentication internally.

## 🚨 Important Notes

1. **Tunnel Stability**: This tunnel is active only while my backend server is running. If you lose connection, let me know!

2. **CORS**: The backend should allow cross-origin requests for your localhost frontend.

3. **Documentation**: For detailed endpoint documentation, visit:
   ```
   https://modern-beans-fold.loca.lt/docs
   ```
   (FastAPI automatically generates OpenAPI/Swagger documentation)

4. **Tunnel URL Changes**: If I restart the tunnel, the URL will change. I'll update you with the new URL.

## 🛠️ Testing the Connection

Quick test in your browser's console:

```javascript
fetch('https://modern-beans-fold.loca.lt/health')
  .then(r => r.json())
  .then(console.log)
```

## 📞 Need Help?

If you encounter any issues, check:
- ✅ The tunnel URL is accessible in your browser
- ✅ You've clicked through the localtunnel security page
- ✅ CORS headers are properly configured
- ✅ The endpoint path is correct

---

**Last Updated:** 2025-11-22 at 15:05  
**Backend Status:** ✅ Running
