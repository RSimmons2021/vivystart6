import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the chat model
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    chat = model.start_chat(history=[])
    logger.info("Successfully initialized Gemini chat")
except Exception as e:
    logger.error(f"Error initializing Gemini chat: {str(e)}")
    raise

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Supabase credentials not found in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = Flask(__name__)
CORS(app)

# Data storage
goals = []
coach_data = []
journey_data = []
progress_data = []
weight_data = []  # Store weight entries as a list
shots_data = {}
steps_data = []  # Store steps data as a list

@app.route('/gemini-chat', methods=['POST'])
def gemini_chat():
    try:
        data = request.get_json(force=True)
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message']
        user_id = data.get('user_id')  # Optionally pass user_id from frontend
        logger.info(f"Processing message: {user_message}")

        # Store user message in Supabase
        if user_id:
            supabase.table('chat_history').insert({
                'user_id': user_id,
                'message': user_message,
                'is_user': True
            }).execute()

        try:
            response = chat.send_message(user_message)
            ai_reply = response.text if hasattr(response, 'text') else ''
            logger.info(f"Generated response: {ai_reply}")

            # Store AI response in Supabase
            if user_id and ai_reply:
                supabase.table('chat_history').insert({
                    'user_id': user_id,
                    'message': ai_reply,
                    'is_user': False
                }).execute()

            return jsonify({'content': ai_reply}), 200
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Error in gemini_chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/gemini-chat/history', methods=['GET'])
def get_chat_history():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        # Retrieve chat history for the user, ordered by timestamp
        res = supabase.table('chat_history').select('*').eq('user_id', user_id).order('timestamp', desc=False).execute()
        return jsonify({'history': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for goals ---
@app.route('/goals', methods=['GET'])
def get_goals():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('goals').select('*').eq('user_id', user_id).order('created', desc=False).execute()
        return jsonify({'goals': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving goals: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/goals', methods=['POST'])
def add_goal():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('title'):
        return jsonify({'error': 'user_id and title required'}), 400
    try:
        goal = {
            'user_id': user_id,
            'title': data['title'],
            'description': data.get('description'),
            'category': data.get('category', 'other'),
            'target_date': data.get('targetDate'),
            'is_completed': data.get('isCompleted', False),
            'progress': data.get('progress', 0),
            'created': data.get('created')
        }
        res = supabase.table('goals').insert(goal).execute()
        return jsonify({'message': 'Goal added successfully!', 'goal': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding goal: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/goals/<goal_id>', methods=['PUT'])
def update_goal(goal_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('goals').update(update_data).eq('id', goal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Goal updated!', 'goal': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating goal: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/goals/<goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('goals').delete().eq('id', goal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Goal deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting goal: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for progress (weight logs, steps, etc.) ---
@app.route('/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('progress').select('*').eq('user_id', user_id).order('date', desc=False).execute()
        return jsonify({'progress': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving progress: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/progress', methods=['POST'])
def add_progress():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        entry = {
            'user_id': user_id,
            'date': data['date'],
            'weight': data.get('weight'),
            'steps': data.get('steps'),
            'nutrition': data.get('nutrition')
        }
        res = supabase.table('progress').insert(entry).execute()
        return jsonify({'message': 'Progress added!', 'entry': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding progress: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for achievements ---
@app.route('/achievements', methods=['GET'])
def get_achievements():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('achievements').select('*').eq('user_id', user_id).execute()
        return jsonify({'achievements': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving achievements: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/achievements', methods=['POST'])
def add_achievement():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('name'):
        return jsonify({'error': 'user_id and name required'}), 400
    try:
        achievement = {
            'user_id': user_id,
            'name': data['name'],
            'category': data.get('category'),
            'description': data.get('description'),
            'is_unlocked': data.get('is_unlocked', False),
            'points': data.get('points', 0),
            'date_unlocked': data.get('date_unlocked')
        }
        res = supabase.table('achievements').insert(achievement).execute()
        return jsonify({'message': 'Achievement added!', 'achievement': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding achievement: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/achievements/<achievement_id>', methods=['PUT'])
def update_achievement(achievement_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('achievements').update(update_data).eq('id', achievement_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Achievement updated!', 'achievement': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating achievement: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for challenges ---
@app.route('/challenges', methods=['GET'])
def get_challenges():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('challenges').select('*').eq('user_id', user_id).execute()
        return jsonify({'challenges': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving challenges: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/challenges/<challenge_id>', methods=['PUT'])
def update_challenge(challenge_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('challenges').update(update_data).eq('id', challenge_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Challenge updated!', 'challenge': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating challenge: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for shots ---
@app.route('/shots', methods=['GET'])
def get_shots():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('shots').select('*').eq('user_id', user_id).execute()
        return jsonify({'shots': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving shots: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/shots', methods=['POST'])
def add_shot():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        shot = {k: v for k, v in data.items() if k != 'user_id'}
        shot['user_id'] = user_id
        res = supabase.table('shots').insert(shot).execute()
        return jsonify({'message': 'Shot added!', 'shot': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding shot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/shots/<shot_id>', methods=['PUT'])
def update_shot(shot_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('shots').update(update_data).eq('id', shot_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Shot updated!', 'shot': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating shot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/shots/<shot_id>', methods=['DELETE'])
def delete_shot(shot_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('shots').delete().eq('id', shot_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Shot deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting shot: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for weight logs ---
@app.route('/weight-logs', methods=['GET'])
def get_weight_logs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('weight_logs').select('*').eq('user_id', user_id).execute()
        return jsonify({'weight_logs': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving weight logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/weight-logs', methods=['POST'])
def add_weight_log():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        log = {k: v for k, v in data.items() if k != 'user_id'}
        log['user_id'] = user_id
        res = supabase.table('weight_logs').insert(log).execute()
        return jsonify({'message': 'Weight log added!', 'weight_log': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding weight log: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/weight-logs/<log_id>', methods=['PUT'])
def update_weight_log(log_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('weight_logs').update(update_data).eq('id', log_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Weight log updated!', 'weight_log': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating weight log: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/weight-logs/<log_id>', methods=['DELETE'])
def delete_weight_log(log_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('weight_logs').delete().eq('id', log_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Weight log deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting weight log: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for side effects ---
@app.route('/side-effects', methods=['GET'])
def get_side_effects():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('side_effects').select('*').eq('user_id', user_id).execute()
        return jsonify({'side_effects': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving side effects: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/side-effects', methods=['POST'])
def add_side_effect():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        effect = {k: v for k, v in data.items() if k != 'user_id'}
        effect['user_id'] = user_id
        res = supabase.table('side_effects').insert(effect).execute()
        return jsonify({'message': 'Side effect added!', 'side_effect': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding side effect: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/side-effects/<effect_id>', methods=['PUT'])
def update_side_effect(effect_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('side_effects').update(update_data).eq('id', effect_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Side effect updated!', 'side_effect': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating side effect: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/side-effects/<effect_id>', methods=['DELETE'])
def delete_side_effect(effect_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('side_effects').delete().eq('id', effect_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Side effect deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting side effect: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for meals ---
@app.route('/meals', methods=['GET'])
def get_meals():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('meals').select('*').eq('user_id', user_id).execute()
        return jsonify({'meals': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving meals: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/meals', methods=['POST'])
def add_meal():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        meal = {k: v for k, v in data.items() if k != 'user_id'}
        meal['user_id'] = user_id
        res = supabase.table('meals').insert(meal).execute()
        return jsonify({'message': 'Meal added!', 'meal': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding meal: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/meals/<meal_id>', methods=['PUT'])
def update_meal(meal_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('meals').update(update_data).eq('id', meal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Meal updated!', 'meal': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating meal: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/meals/<meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('meals').delete().eq('id', meal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Meal deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting meal: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for saved meals ---
@app.route('/saved-meals', methods=['GET'])
def get_saved_meals():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('saved_meals').select('*').eq('user_id', user_id).execute()
        return jsonify({'saved_meals': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving saved meals: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/saved-meals', methods=['POST'])
def add_saved_meal():
    data = request.get_json()
    user_id = data.get('user_id')
    meal_id = data.get('meal_id')
    if not user_id or not meal_id:
        return jsonify({'error': 'user_id and meal_id required'}), 400
    try:
        entry = {'user_id': user_id, 'meal_id': meal_id}
        res = supabase.table('saved_meals').insert(entry).execute()
        return jsonify({'message': 'Saved meal added!', 'saved_meal': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding saved meal: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/saved-meals/<saved_meal_id>', methods=['DELETE'])
def delete_saved_meal(saved_meal_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        supabase.table('saved_meals').delete().eq('id', saved_meal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Saved meal deleted!'}), 200
    except Exception as e:
        logger.error(f"Error deleting saved meal: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for water logs ---
@app.route('/water-logs', methods=['GET'])
def get_water_logs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('water_logs').select('*').eq('user_id', user_id).execute()
        return jsonify({'water_logs': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving water logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/water-logs', methods=['POST'])
def add_water_log():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        log = {k: v for k, v in data.items() if k != 'user_id'}
        log['user_id'] = user_id
        res = supabase.table('water_logs').insert(log).execute()
        return jsonify({'message': 'Water log added!', 'water_log': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding water log: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for step logs ---
@app.route('/step-logs', methods=['GET'])
def get_step_logs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('step_logs').select('*').eq('user_id', user_id).execute()
        return jsonify({'step_logs': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving step logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/step-logs', methods=['POST'])
def add_step_log():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        log = {k: v for k, v in data.items() if k != 'user_id'}
        log['user_id'] = user_id
        res = supabase.table('step_logs').insert(log).execute()
        return jsonify({'message': 'Step log added!', 'step_log': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding step log: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for daily logs ---
@app.route('/daily-logs', methods=['GET'])
def get_daily_logs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('daily_logs').select('*').eq('user_id', user_id).execute()
        return jsonify({'daily_logs': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving daily logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/daily-logs', methods=['POST'])
def add_daily_log():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('date'):
        return jsonify({'error': 'user_id and date required'}), 400
    try:
        log = {k: v for k, v in data.items() if k != 'user_id'}
        log['user_id'] = user_id
        res = supabase.table('daily_logs').insert(log).execute()
        return jsonify({'message': 'Daily log added!', 'daily_log': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding daily log: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for journey stages ---
@app.route('/journey-stages', methods=['GET'])
def get_journey_stages():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('journey_stages').select('*').eq('user_id', user_id).execute()
        return jsonify({'journey_stages': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving journey stages: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/journey-stages', methods=['POST'])
def add_journey_stage():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or not data.get('title'):
        return jsonify({'error': 'user_id and title required'}), 400
    try:
        stage = {k: v for k, v in data.items() if k != 'user_id'}
        stage['user_id'] = user_id
        res = supabase.table('journey_stages').insert(stage).execute()
        return jsonify({'message': 'Journey stage added!', 'journey_stage': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding journey stage: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/journey-stages/<stage_id>', methods=['PUT'])
def update_journey_stage(stage_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        update_data = {k: v for k, v in data.items() if k != 'user_id'}
        res = supabase.table('journey_stages').update(update_data).eq('id', stage_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Journey stage updated!', 'journey_stage': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating journey stage: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for users (profile) ---
@app.route('/users', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('users').select('*').eq('id', user_id).single().execute()
        return jsonify({'user': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['POST'])
def add_user():
    data = request.get_json()
    if not data.get('id') or not data.get('name'):
        return jsonify({'error': 'id and name required'}), 400
    try:
        res = supabase.table('users').insert(data).execute()
        return jsonify({'message': 'User added!', 'user': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    try:
        res = supabase.table('users').update(data).eq('id', user_id).execute()
        return jsonify({'message': 'User updated!', 'user': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Supabase CRUD for streaks ---
@app.route('/streaks', methods=['GET'])
def get_streaks():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('streaks').select('*').eq('user_id', user_id).single().execute()
        return jsonify({'streaks': res.data}), 200
    except Exception as e:
        logger.error(f"Error retrieving streaks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/streaks', methods=['POST'])
def add_streaks():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('streaks').insert(data).execute()
        return jsonify({'message': 'Streaks added!', 'streaks': res.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding streaks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/streaks/<streak_id>', methods=['PUT'])
def update_streaks(streak_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    try:
        res = supabase.table('streaks').update(data).eq('id', streak_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Streaks updated!', 'streaks': res.data[0]}), 200
    except Exception as e:
        logger.error(f"Error updating streaks: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
