# GLP-1 Tracker

A mobile application built with React Native and Expo for tracking GLP-1 related health data, including shots, weight, meals, side effects, steps, water intake, goals, achievements, and challenges. The application also features a Python Flask backend integrated with Supabase for data storage and a Gemini AI chat for user interaction.

## Technologies Used

*   **Frontend:** React Native, Expo, NativeWind (Tailwind CSS)
*   **Backend:** Python, Flask, Google Gemini AI
*   **Database:** Supabase

## Setup Instructions

### Prerequisites

*   Node.js and npm/yarn/bun
*   Python 3.x and pip
*   Expo Go app on your mobile device (for testing on device)
*   Supabase account and project

### Frontend Setup

1.  Navigate to the project root directory.
2.  Install dependencies:
    ```bash
    bun install
    ```
    or
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```
3.  Create a `.env` file in the root directory based on `.env.example` (if available) and add your Supabase URL and Anon Key.

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Create a Python virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    *   On Windows: `.\venv\Scripts\activate`
    *   On macOS/Linux: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt # Assuming a requirements.txt exists or create one with flask, supabase, python-dotenv, google-generativeai, flask-cors
    ```
5.  Create a `.env` file in the `backend` directory based on `.env.example` (if available) and add your `GEMINI_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Supabase Setup

1.  Create a new project in your Supabase account.
2.  Run the SQL schema provided in `supabase_schema.sql` in your Supabase SQL editor to set up the necessary tables.
3.  Obtain your Supabase Project URL and `anon` key from your Supabase project settings (API section). These will be used in the frontend and backend `.env` files.

## How to Run the Project

### Running the Backend

1.  Navigate to the `backend` directory.
2.  Activate the Python virtual environment (if not already active).
3.  Run the Flask application:
    ```bash
    python app.py
    ```
    The backend server should start, typically on `http://127.0.0.1:5000`.

### Running the Frontend

1.  Navigate to the project root directory.
2.  Start the Expo development server:
    ```bash
    bun start --tunnel
    ```
    or
    ```bash
    npm start --tunnel
    ```
    or
    ```bash
    yarn start --tunnel
    ```
3.  Scan the QR code displayed in the terminal or browser with the Expo Go app on your mobile device to open the application.

## Contributing

(Coming Soon)

## License

(Coming Soon)

## Contact

(Coming Soon)