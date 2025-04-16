import requests
import json

def test_gemini_chat():
    url = 'http://localhost:5000/gemini-chat'
    headers = {'Content-Type': 'application/json'}
    data = {'message': 'What are GLP-1 medications?'}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.json()
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == '__main__':
    result = test_gemini_chat()