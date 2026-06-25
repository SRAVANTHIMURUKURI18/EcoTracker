from flask import Blueprint, request, jsonify
from datetime import datetime
from firebase_config import db, DEMO_DATABASE, require_auth
from .calculator import compute_emissions, FOOD_COEFFICIENTS

habits_bp = Blueprint('habits', __name__)

def update_user_streak(uid, log_date_str):
    """
    Updates the logging streak of the user based on the log date.
    Returns the new streak. Supports both Demo Mode and standard Firestore.
    """
    try:
        log_date = datetime.strptime(log_date_str, '%Y-%m-%d').date()
    except ValueError:
        return 0

    if uid == 'demo_user':
        user_data = DEMO_DATABASE['users'].get(uid)
        if not user_data:
            user_data = {
                'uid': uid,
                'budget': 8.0,
                'theme': 'dark',
                'streak': 1,
                'last_logged_date': log_date_str,
                'badges': [],
                'displayName': 'Demo Hero',
                'country': 'in',
                'weekly_goal': 10.0
            }
            DEMO_DATABASE['users'][uid] = user_data
            return 1
            
        last_logged_str = user_data.get('last_logged_date')
        current_streak = user_data.get('streak', 0)
        
        if not last_logged_str:
            new_streak = 1
        else:
            try:
                last_logged = datetime.strptime(last_logged_str, '%Y-%m-%d').date()
                diff = (log_date - last_logged).days
                
                if diff == 1:
                    new_streak = current_streak + 1
                elif diff == 0:
                    new_streak = current_streak if current_streak > 0 else 1
                else:
                    new_streak = 1
            except Exception:
                new_streak = 1

        user_data['streak'] = new_streak
        user_data['last_logged_date'] = log_date_str
        DEMO_DATABASE['users'][uid] = user_data
        return new_streak

    else:
        # Standard Firestore Logic
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            user_ref.set({
                'uid': uid,
                'budget': 8.0,
                'theme': 'dark',
                'streak': 1,
                'last_logged_date': log_date_str,
                'badges': [],
                'patient_name': 'Eco Track User',
                'displayName': 'Eco Track User',
                'country': 'in',
                'weekly_goal': 10.0
            })
            return 1
            
        user_data = user_doc.to_dict()
        last_logged_str = user_data.get('last_logged_date')
        current_streak = user_data.get('streak', 0)
        
        if not last_logged_str:
            new_streak = 1
        else:
            try:
                last_logged = datetime.strptime(last_logged_str, '%Y-%m-%d').date()
                diff = (log_date - last_logged).days
                
                if diff == 1:
                    new_streak = current_streak + 1
                elif diff == 0:
                    new_streak = current_streak if current_streak > 0 else 1
                else:
                    new_streak = 1
            except Exception:
                new_streak = 1

        user_ref.update({
            'streak': new_streak,
            'last_logged_date': log_date_str
        })
        return new_streak

@habits_bp.route('/api/habits/log', methods=['POST'])
@require_auth
def log_habit():
    """
    POST: Calculates carbon emissions, stores the daily log (in Firestore or Demo DB),
    updates user streak, and returns results.
    """
    uid = request.uid
    data = request.get_json() or {}
    
    date_str = data.get('date')
    if not date_str:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
        
    # Input validation
    travel_data = data.get('travel', {})
    food_data = data.get('food', {})
    energy_data = data.get('energy', {})
    
    try:
        distance = float(travel_data.get('distance', 0))
        if distance < 0:
            return jsonify({'error': 'Distance must be a non-negative number'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Distance must be a number'}), 400
        
    try:
        kwh = float(energy_data.get('electricity_kwh', 0))
        if kwh < 0 or kwh > 30:
            return jsonify({'error': 'kWh must be a non-negative number between 0 and 30'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'kWh must be a number'}), 400
        
    diet = food_data.get('diet_type', 'omnivore')
    if diet not in FOOD_COEFFICIENTS:
        return jsonify({'error': f'Diet type must be one of {list(FOOD_COEFFICIENTS.keys())}'}), 400

    # Calculate emissions
    calculation = compute_emissions(data)
    
    # Update streak
    new_streak = update_user_streak(uid, date_str)
    calculation['streak'] = new_streak
    
    log_doc = {
        'uid': uid,
        'date': date_str,
        'travel': calculation['breakdown']['travel'],
        'food': calculation['breakdown']['food'],
        'energy': calculation['breakdown']['energy'],
        'travel_emissions': calculation['travel_emissions'],
        'food_emissions': calculation['food_emissions'],
        'energy_emissions': calculation['energy_emissions'],
        'total': calculation['total'],
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if uid == 'demo_user':
        # Write to memory Demo DB
        DEMO_DATABASE['habits'][f"{uid}_{date_str}"] = log_doc
    else:
        # Write to Firestore
        doc_id = f"{uid}_{date_str}"
        db.collection('habits').document(doc_id).set(log_doc)
        
    response = {
        'success': True,
        'date': date_str,
        'travel_emissions': calculation['travel_emissions'],
        'food_emissions': calculation['food_emissions'],
        'energy_emissions': calculation['energy_emissions'],
        'total': calculation['total'],
        'streak': new_streak,
        'breakdown': calculation['breakdown']
    }
    return jsonify(response), 200

@habits_bp.route('/api/habits/today', methods=['GET'])
@require_auth
def get_today_log():
    """
    GET: Retrieves today's log if it exists.
    """
    uid = request.uid
    date_str = request.args.get('date')
    if not date_str:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
        
    if uid == 'demo_user':
        log = DEMO_DATABASE['habits'].get(f"{uid}_{date_str}")
        if log:
            return jsonify({'success': True, 'log': log}), 200
        else:
            return jsonify({'success': False, 'message': 'No log found for today'}), 200
    else:
        doc_id = f"{uid}_{date_str}"
        doc_ref = db.collection('habits').document(doc_id).get()
        if doc_ref.exists:
            return jsonify({'success': True, 'log': doc_ref.to_dict()}), 200
        else:
            return jsonify({'success': False, 'message': 'No log found for today'}), 200

@habits_bp.route('/api/habits/history', methods=['GET'])
@require_auth
def get_history():
    """
    GET: Retrieves last 30 daily logs.
    """
    uid = request.uid
    
    if uid == 'demo_user':
        # Filter matching logs in-memory
        logs = [val for key, val in DEMO_DATABASE['habits'].items() if key.startswith(f"{uid}_")]
        logs.sort(key=lambda x: x['date']) # Sort chronologically ascending
        return jsonify({'success': True, 'history': logs}), 200
    else:
        logs_ref = db.collection('habits')\
            .where('uid', '==', uid)\
            .order_by('date', direction='DESCENDING')\
            .limit(30)
            
        logs = []
        try:
            for doc in logs_ref.stream():
                logs.append(doc.to_dict())
        except Exception:
            raw_logs = db.collection('habits').where('uid', '==', uid).stream()
            for doc in raw_logs:
                logs.append(doc.to_dict())
            logs.sort(key=lambda x: x['date'], reverse=True)
            logs = logs[:30]

        logs.reverse() # chronological order (oldest first)
        return jsonify({'success': True, 'history': logs}), 200

@habits_bp.route('/api/habits/settings', methods=['GET', 'PATCH'])
@require_auth
def manage_settings():
    """
    GET/PATCH: Reads and writes user profile settings.
    Exposes and updates display settings, country, and weekly goals.
    """
    uid = request.uid
    
    if uid == 'demo_user':
        user_data = DEMO_DATABASE['users'].get(uid)
        if not user_data:
            user_data = {
                'uid': uid,
                'budget': 8.0,
                'theme': 'dark',
                'streak': 0,
                'badges': [],
                'displayName': 'Demo Hero',
                'country': 'in',
                'weekly_goal': 10.0
            }
            DEMO_DATABASE['users'][uid] = user_data
            
        if request.method == 'GET':
            return jsonify({'success': True, 'settings': user_data}), 200
            
        elif request.method == 'PATCH':
            data = request.get_json() or {}
            if 'budget' in data:
                try:
                    user_data['budget'] = float(data['budget'])
                except (ValueError, TypeError):
                    pass
            if 'theme' in data:
                user_data['theme'] = str(data['theme'])
            if 'displayName' in data:
                user_data['displayName'] = str(data['displayName'])
            if 'country' in data:
                user_data['country'] = str(data['country'])
            if 'weekly_goal' in data:
                try:
                    user_data['weekly_goal'] = float(data['weekly_goal'])
                except (ValueError, TypeError):
                    pass
            DEMO_DATABASE['users'][uid] = user_data
            return jsonify({'success': True, 'settings': user_data}), 200

    else:
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if request.method == 'GET':
            if not user_doc.exists:
                default_settings = {
                    'uid': uid,
                    'budget': 8.0,
                    'theme': 'dark',
                    'streak': 0,
                    'badges': [],
                    'patient_name': 'Eco Track User',
                    'displayName': 'Eco Track User',
                    'country': 'in',
                    'weekly_goal': 10.0
                }
                user_ref.set(default_settings)
                return jsonify({'success': True, 'settings': default_settings}), 200
            return jsonify({'success': True, 'settings': user_doc.to_dict()}), 200
            
        elif request.method == 'PATCH':
            data = request.get_json() or {}
            update_data = {}
            
            if 'budget' in data:
                try:
                    budget_val = float(data['budget'])
                    if budget_val > 0:
                        update_data['budget'] = budget_val
                except (ValueError, TypeError):
                    pass
            if 'theme' in data:
                update_data['theme'] = str(data['theme'])
            if 'displayName' in data:
                update_data['displayName'] = str(data['displayName'])
                update_data['patient_name'] = str(data['displayName'])
            if 'country' in data:
                update_data['country'] = str(data['country'])
            if 'weekly_goal' in data:
                try:
                    update_data['weekly_goal'] = float(data['weekly_goal'])
                except (ValueError, TypeError):
                    pass

            if not user_doc.exists:
                update_data['uid'] = uid
                update_data.setdefault('streak', 0)
                update_data.setdefault('badges', [])
                user_ref.set(update_data)
            else:
                user_ref.update(update_data)
                
            updated_doc = user_ref.get().to_dict()
            return jsonify({'success': True, 'settings': updated_doc}), 200

@habits_bp.route('/api/habits/badges', methods=['GET', 'POST'])
@require_auth
def manage_badges():
    """
    GET/POST: Reads and writes badge data to Firestore or Demo Database.
    """
    uid = request.uid
    
    if uid == 'demo_user':
        user_data = DEMO_DATABASE['users'].get(uid)
        if not user_data:
            user_data = {
                'uid': uid,
                'budget': 8.0,
                'theme': 'dark',
                'streak': 0,
                'badges': [],
                'displayName': 'Demo Hero',
                'country': 'in',
                'weekly_goal': 10.0
            }
            DEMO_DATABASE['users'][uid] = user_data
            
        if request.method == 'GET':
            return jsonify({'success': True, 'badges': user_data.get('badges', [])}), 200
        elif request.method == 'POST':
            data = request.get_json() or {}
            badges = data.get('badges')
            if badges is None:
                return jsonify({'error': 'Badges field is required'}), 400
            user_data['badges'] = badges
            DEMO_DATABASE['users'][uid] = user_data
            return jsonify({'success': True, 'badges': badges}), 200
            
    else:
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            user_ref.set({
                'uid': uid,
                'budget': 8.0,
                'theme': 'dark',
                'streak': 0,
                'badges': [],
                'displayName': 'Eco Track User',
                'patient_name': 'Eco Track User',
                'country': 'in',
                'weekly_goal': 10.0
            })
            return jsonify({'success': True, 'badges': []}), 200
            
        if request.method == 'GET':
            user_data = user_doc.to_dict()
            badges = user_data.get('badges', [])
            return jsonify({'success': True, 'badges': badges}), 200
            
        elif request.method == 'POST':
            data = request.get_json() or {}
            badges = data.get('badges')
            if badges is None:
                return jsonify({'error': 'Badges field is required'}), 400
            user_ref.update({'badges': badges})
            return jsonify({'success': True, 'badges': badges}), 200
