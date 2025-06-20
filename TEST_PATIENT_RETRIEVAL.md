# Test Patient Retrieval

## Overview
This guide helps you test that patient retrieval is working correctly with the `Patients` collection (capital P).

## Test Steps

### 1. First, verify your Firebase collection name
Make sure your Firestore collection is named exactly `Patients` (with capital P).

### 2. Create a test patient (if you don't have one)
```bash
curl -X POST http://localhost:3000/api/signup/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testpatient@example.com",
    "password": "password123",
    "name": "Test Patient",
    "phone": "123-456-7890"
  }'
```

### 3. Login as a doctor or admin to get access token
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-doctor-email@example.com",
    "password": "your-password"
  }'
```

### 4. Test getting all patients
```bash
# Replace YOUR_TOKEN_HERE with the actual token from login
TOKEN="YOUR_TOKEN_HERE"

curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test getting a specific patient by ID
```bash
# Replace PATIENT_ID with an actual patient ID from your Patients collection
PATIENT_ID="your-patient-id-here"

curl -X GET http://localhost:3000/api/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Expected Results

### Get All Patients Response:
```json
{
  "message": "Patients retrieved successfully",
  "count": 1,
  "patients": [
    {
      "id": "patient-document-id",
      "email": "testpatient@example.com",
      "name": "Test Patient",
      "phone": "123-456-7890",
      "role": "patient",
      "createdAt": "timestamp"
    }
  ],
  "accessedBy": {
    "role": "doctor",
    "name": "Dr. Test Doctor"
  }
}
```

### Get Specific Patient Response:
```json
{
  "message": "Patient retrieved successfully",
  "patient": {
    "id": "patient-document-id",
    "email": "testpatient@example.com",
    "name": "Test Patient",
    "phone": "123-456-7890",
    "role": "patient",
    "createdAt": "timestamp"
  },
  "accessedBy": {
    "role": "doctor",
    "name": "Dr. Test Doctor"
  }
}
```

## Troubleshooting

### If you get "Patient not found":
1. **Check the patient ID**: Make sure you're using the correct document ID from your `Patients` collection
2. **Verify collection name**: Ensure your Firestore collection is named `Patients` (capital P)
3. **Check authentication**: Make sure you're logged in as a doctor or admin
4. **Verify patient exists**: Check your Firebase Console to confirm the patient document exists

### If you get 403 Forbidden:
1. **Check your role**: Make sure you're logged in as a doctor or admin
2. **Verify token**: Ensure your authentication token is valid
3. **Check middleware**: The route requires doctor or admin access

### If you get 500 Server Error:
1. **Check server logs**: Look for error messages in your server console
2. **Verify Firebase connection**: Ensure your Firebase credentials are correct
3. **Check collection permissions**: Verify your Firestore security rules allow read access

## Debug Steps

### 1. Check your Firebase Console
- Go to Firestore Database
- Look for the `Patients` collection
- Verify the patient document exists with the ID you're trying to access

### 2. Check server logs
Look for these log messages in your server console:
```
🔍 doctor Dr. Test Doctor fetching all patients
🔍 doctor Dr. Test Doctor fetching patient patient-id-here
```

### 3. Test with a known patient ID
Use the document ID directly from your Firebase Console to test the specific patient endpoint.

## Collection Structure Verification

Your `Patients` collection should contain documents like this:
```javascript
{
  "email": "patient@example.com",
  "authId": "firebase-auth-uid",
  "role": "patient",
  "name": "Patient Name",
  "phone": "123-456-7890",
  "createdAt": "timestamp"
}
``` 