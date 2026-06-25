from flask import Blueprint, request, jsonify

calculator_bp = Blueprint('calculator', __name__)

# Transport Coefficients (kg CO2 per km per person)
TRANSPORT_COEFFICIENTS = {
    'car_petrol': 0.192,
    'car_diesel': 0.171,
    'car_electric': 0.053,
    'bus': 0.089,
    'train': 0.041,
    'motorcycle': 0.114,
    'bicycle': 0.000,
    'walking': 0.000,
    'flight_short': 0.255,  # Short-haul flights (< 1500 km)
    'flight_long': 0.195    # Long-haul flights (>= 1500 km)
}

# Food Emission Values (kg CO2 per day)
FOOD_COEFFICIENTS = {
    'meat-heavy': 7.19,
    'omnivore': 5.63,
    'vegetarian': 3.81,
    'vegan': 2.89
}

# Energy Factors
ELECTRICITY_FACTOR = 0.233  # kg CO2/kWh (India Grid)
HEATING_FLAT_RATE = 2.0     # kg CO2 if active
AC_FLAT_RATE = 1.5          # kg CO2 if active

def compute_emissions(data):
    """
    Computes emissions based on input data and returns a dictionary breakdown.
    """
    # 1. Travel Calculation
    travel_data = data.get('travel', {})
    mode = travel_data.get('mode', 'walking')
    distance = float(travel_data.get('distance', 0))
    passengers = int(travel_data.get('passengers', 1))
    if passengers < 1:
        passengers = 1
        
    coef = TRANSPORT_COEFFICIENTS.get(mode, 0.0)
    travel_emissions = (distance * coef) / passengers

    # 2. Food Calculation
    food_data = data.get('food', {})
    diet = food_data.get('diet_type', 'omnivore')
    meals = int(food_data.get('meal_count', 3))
    wasted = bool(food_data.get('food_waste', False))
    
    base_food = FOOD_COEFFICIENTS.get(diet, 5.63)
    # Scale food emissions by fraction of meals out of standard 3 meals
    meals_scale = (meals / 3.0) if meals > 0 else 1.0
    food_emissions = base_food * meals_scale
    if wasted:
        food_emissions *= 1.1 # 10% penalty for food waste

    # 3. Energy Calculation
    energy_data = data.get('energy', {})
    kwh = float(energy_data.get('electricity_kwh', 0))
    heating = bool(energy_data.get('heating', False))
    ac = bool(energy_data.get('ac', False))
    
    energy_emissions = kwh * ELECTRICITY_FACTOR
    if heating:
        energy_emissions += HEATING_FLAT_RATE
    if ac:
        energy_emissions += AC_FLAT_RATE

    total = travel_emissions + food_emissions + energy_emissions

    return {
        'travel_emissions': round(travel_emissions, 3),
        'food_emissions': round(food_emissions, 3),
        'energy_emissions': round(energy_emissions, 3),
        'total': round(total, 3),
        'breakdown': {
            'travel': {
                'mode': mode,
                'distance': distance,
                'passengers': passengers
            },
            'food': {
                'diet_type': diet,
                'meal_count': meals,
                'food_waste': wasted
            },
            'energy': {
                'electricity_kwh': kwh,
                'heating': heating,
                'ac': ac
            }
        }
    }

@calculator_bp.route('/api/calculate/footprint', methods=['POST'])
def calculate_footprint():
    """
    POST route to calculate footprint preview.
    Does not save to database.
    """
    data = request.get_json() or {}
    
    # Validation logic
    travel_data = data.get('travel', {})
    food_data = data.get('food', {})
    energy_data = data.get('energy', {})
    
    # Distance validation
    try:
        distance = float(travel_data.get('distance', 0))
        if distance < 0:
            return jsonify({'error': 'Distance must be a non-negative number'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Distance must be a number'}), 400
        
    # kWh validation
    try:
        kwh = float(energy_data.get('electricity_kwh', 0))
        if kwh < 0 or kwh > 30:
            return jsonify({'error': 'kWh must be a non-negative number between 0 and 30'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'kWh must be a number'}), 400
        
    # Diet type validation
    diet = food_data.get('diet_type', 'omnivore')
    if diet not in FOOD_COEFFICIENTS:
        return jsonify({'error': f'Diet type must be one of {list(FOOD_COEFFICIENTS.keys())}'}), 400

    results = compute_emissions(data)
    results['success'] = True
    return jsonify(results), 200
