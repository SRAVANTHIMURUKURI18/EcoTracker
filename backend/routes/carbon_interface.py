import os
import requests
import math
from flask import Blueprint, request, jsonify
from firebase_config import require_auth

carbon_interface_bp = Blueprint('carbon_interface', __name__)

# Coordinates for popular airports to calculate mock distance using Haversine
AIRPORT_COORDS = {
    'DEL': (28.5562, 77.1000), # Delhi
    'BOM': (19.0896, 72.8680), # Mumbai
    'BLR': (13.1986, 77.7066), # Bangalore
    'CCU': (22.6547, 88.4467), # Kolkata
    'MAA': (12.9941, 80.1805), # Chennai
    'JFK': (40.6413, -73.7781),# New York
    'LHR': (51.4700, -0.4543), # London Heathrow
    'DXB': (25.2532, 55.3640), # Dubai
    'SIN': (1.3644, 103.9915), # Singapore
    'SFO': (37.7749, -122.4194) # San Francisco
}

def haversine_distance(coord1, coord2):
    """
    Calculates the great-circle distance between two points in kilometers.
    """
    R = 6371.0 # Earth's radius in km
    lat1, lon1 = map(math.radians, coord1)
    lat2, lon2 = map(math.radians, coord2)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def compute_mock_flight_emissions(legs, passengers):
    """
    Fallback calculations for flights.
    """
    total_distance = 0.0
    for leg in legs:
        dep = leg.get('departure_airport', '').upper().strip()
        dest = leg.get('destination_airport', '').upper().strip()
        
        if dep in AIRPORT_COORDS and dest in AIRPORT_COORDS:
            dist = haversine_distance(AIRPORT_COORDS[dep], AIRPORT_COORDS[dest])
        else:
            # Default estimated distance for unknown routes
            dist = 1200.0 # Standard domestic/regional distance estimate
            
        total_distance += dist
        
    # Standard emission factor (short haul vs long haul)
    # Short haul (< 1500 km): 0.255 kg CO2/km, Long haul (>= 1500): 0.195 kg CO2/km
    if total_distance < 1500:
        coef = 0.255
    else:
        coef = 0.195
        
    carbon_kg = total_distance * coef * passengers
    return {
        'carbon_kg': round(carbon_kg, 2),
        'distance_km': round(total_distance, 1),
        'passengers': passengers
    }

@carbon_interface_bp.route('/api/carbon/electricity', methods=['POST'])
@require_auth
def calculate_electricity_emissions():
    """
    POST: Queries Carbon Interface for electricity carbon estimates.
    Falls back to local grids if API is unconfigured/unavailable.
    """
    data = request.get_json() or {}
    value = float(data.get('electricity_value', 0.0))
    unit = data.get('electricity_unit', 'kwh').lower()
    country = data.get('country', 'in').lower()
    state = data.get('state') # e.g. 'fl'
    
    if value < 0:
        return jsonify({'error': 'Electricity value must be a non-negative number'}), 400

    api_key = os.environ.get('CARBON_INTERFACE_API_KEY')
    
    # Check if API key is present and not placeholder
    if not api_key or "your_carbon_interface_key" in api_key.lower():
        # Fallback to local science coefficient (India Grid = 0.233 kg/kWh, US average = 0.385 kg/kWh, Global default = 0.47 kg/kWh)
        factor = 0.233 if country == 'in' else (0.385 if country == 'us' else 0.47)
        multiplier = 1000.0 if unit == 'mwh' else 1.0
        carbon_kg = value * multiplier * factor
        return jsonify({
            'success': True,
            'source': 'local_fallback',
            'carbon_kg': round(carbon_kg, 2)
        }), 200

    # API Request configuration
    url = "https://www.carboninterface.com/api/v1/estimates"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "type": "electricity",
        "electricity_unit": unit,
        "electricity_value": value,
        "country": country
    }
    if state:
        payload["state"] = state.lower()

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        if response.status_code == 201 or response.status_code == 200:
            res_json = response.json()
            carbon_kg = res_json['data']['attributes']['carbon_kg']
            return jsonify({
                'success': True,
                'source': 'carbon_interface_api',
                'carbon_kg': carbon_kg
            }), 200
        else:
            raise Exception(f"Carbon Interface returned status code {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Carbon Interface API failed: {e}")
        # Return local fallback in case of errors
        factor = 0.233 if country == 'in' else (0.385 if country == 'us' else 0.47)
        multiplier = 1000.0 if unit == 'mwh' else 1.0
        carbon_kg = value * multiplier * factor
        return jsonify({
            'success': True,
            'source': 'local_fallback_on_error',
            'carbon_kg': round(carbon_kg, 2)
        }), 200

@carbon_interface_bp.route('/api/carbon/flight', methods=['POST'])
@require_auth
def calculate_flight_emissions():
    """
    POST: Queries Carbon Interface for flight estimates.
    Falls back to local Haversine calculations if API is unavailable.
    """
    data = request.get_json() or {}
    passengers = int(data.get('passengers', 1))
    legs = data.get('legs', [])
    
    if not legs:
        return jsonify({'error': 'Flight legs are required'}), 400
        
    api_key = os.environ.get('CARBON_INTERFACE_API_KEY')
    
    if not api_key or "your_carbon_interface_key" in api_key.lower():
        # Fallback to local calculations
        result = compute_mock_flight_emissions(legs, passengers)
        return jsonify({
            'success': True,
            'source': 'local_fallback',
            'carbon_kg': result['carbon_kg'],
            'distance_km': result['distance_km']
        }), 200

    # API Request configuration
    url = "https://www.carboninterface.com/api/v1/estimates"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "type": "flight",
        "passengers": passengers,
        "legs": legs
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        if response.status_code == 201 or response.status_code == 200:
            res_json = response.json()
            carbon_kg = res_json['data']['attributes']['carbon_kg']
            distance_value = res_json['data']['attributes'].get('distance_value', 0.0)
            distance_unit = res_json['data']['attributes'].get('distance_unit', 'km')
            distance_km = distance_value if distance_unit == 'km' else distance_value * 1.60934
            
            return jsonify({
                'success': True,
                'source': 'carbon_interface_api',
                'carbon_kg': carbon_kg,
                'distance_km': round(distance_km, 1)
            }), 200
        else:
            raise Exception(f"Carbon Interface returned status code {response.status_code}")
    except Exception as e:
        print(f"Carbon Interface Flight API failed: {e}")
        # Run local fallback
        result = compute_mock_flight_emissions(legs, passengers)
        return jsonify({
            'success': True,
            'source': 'local_fallback_on_error',
            'carbon_kg': result['carbon_kg'],
            'distance_km': result['distance_km']
        }), 200
