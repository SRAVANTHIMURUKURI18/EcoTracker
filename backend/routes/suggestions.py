import os
import json
from flask import Blueprint, request, jsonify
from firebase_config import require_auth
from groq import Groq

suggestions_bp = Blueprint('suggestions', __name__)

@suggestions_bp.route('/api/suggestions/generate', methods=['POST'])
@require_auth
def generate_suggestions():
    """
    POST: Gathers current user daily emissions, calls Groq API (llama-3.3-70b-versatile)
    to generate 3 personalized suggestions, and returns them.
    If the API key is not present or an error occurs, falls back to offline recommendations.
    """
    uid = request.uid
    data = request.get_json() or {}
    
    # Extract emissions data
    travel = float(data.get('travel_emissions', 0.0))
    food = float(data.get('food_emissions', 0.0))
    energy = float(data.get('energy_emissions', 0.0))
    total = float(data.get('total', 0.0))
    budget = float(data.get('budget', 8.0))
    
    breakdown = data.get('breakdown', {})
    travel_info = breakdown.get('travel', {})
    food_info = breakdown.get('food', {})
    energy_info = breakdown.get('energy', {})
    
    # Local fallback suggestions based on logged stats
    fallback_suggestions = [
        {
            "title": "Switch to Cycling or Walking",
            "description": f"Since you travelled {travel_info.get('distance', 0)} km via '{travel_info.get('mode', 'vehicle')}', replacing short car trips with a bicycle or walking eliminates carbon footprint completely.",
            "category": "travel",
            "estimated_co2_saving": round(travel * 0.8, 2) if travel > 0 else 1.5
        },
        {
            "title": "Opt for a Plant-Based Meal",
            "description": f"With your current diet logged as '{food_info.get('diet_type', 'omnivore')}', replacing meat with beans, tofu, or seasonal vegetables reduces methane emissions by 40%.",
            "category": "food",
            "estimated_co2_saving": 2.0
        },
        {
            "title": "Optimize Heating & Cooling",
            "description": "Turning off appliances when not in use and setting your AC temperature to 24°C reduces electricity consumption and lightens grid loads.",
            "category": "energy",
            "estimated_co2_saving": round(energy * 0.3, 2) if energy > 0 else 1.2
        }
    ]

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or "your_groq_api_key" in api_key.lower():
        # Check if placeholder or empty. If so, go straight to fallback.
        return jsonify({'success': True, 'suggestions': fallback_suggestions}), 200

    prompt = f"""
    Here is the daily carbon footprint breakdown of the user:
    - Daily Carbon Budget: {budget} kg CO2
    - Total Footprint Today: {total} kg CO2
    - Travel Category: {travel} kg CO2 (Mode: {travel_info.get('mode')}, Distance: {travel_info.get('distance')} km, Passengers: {travel_info.get('passengers')})
    - Food Category: {food} kg CO2 (Diet: {food_info.get('diet_type')}, Meals logged: {food_info.get('meal_count')}, Food Waste: {food_info.get('food_waste')})
    - Energy Category: {energy} kg CO2 (Electricity: {energy_info.get('electricity_kwh')} kWh, Heating active: {energy_info.get('heating')}, AC active: {energy_info.get('ac')})
    
    Based on the data above, generate exactly 3 personalized, practical, and encouraging eco swap recommendations.
    Return ONLY a JSON array, without any markdown formatting, markdown code blocks, or text explanation.
    
    Each object in the array MUST contain:
    - "title": a short, punchy title representing the swap
    - "description": a clear, encouraging sentence explaining the swap and its environmental benefit
    - "category": either "travel", "food", or "energy"
    - "estimated_co2_saving": a positive decimal number representing daily CO2 saved in kilograms (must be realistic compared to their emissions).
    
    Example output format:
    [
      {{"title": "Swap Petrol Car for Train", "description": "Taking the train instead of your petrol car for your 20km trip saves emissions.", "category": "travel", "estimated_co2_saving": 3.2}}
    ]
    """

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful carbon footprint reduction specialist. You output only a raw JSON array of suggestions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        content = completion.choices[0].message.content.strip()
        
        # Clean up any markdown wrapping
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        suggestions = json.loads(content)
        if isinstance(suggestions, list) and len(suggestions) > 0:
            return jsonify({'success': True, 'suggestions': suggestions}), 200
        else:
            return jsonify({'success': True, 'suggestions': fallback_suggestions}), 200
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return jsonify({'success': True, 'suggestions': fallback_suggestions}), 200
