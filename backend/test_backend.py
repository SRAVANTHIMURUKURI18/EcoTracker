import unittest
import json
from routes.calculator import compute_emissions

class TestCarbonCalculations(unittest.TestCase):
    
    def test_travel_calculations(self):
        # Car Petrol emission factor: 0.192, 1 passenger
        # Expected: (100 * 0.192) / 1 = 19.2 kg CO2
        data = {
            'travel': {'mode': 'car_petrol', 'distance': 100, 'passengers': 1},
            'food': {'diet_type': 'vegan', 'meal_count': 3, 'food_waste': False},
            'energy': {'electricity_kwh': 0, 'heating': False, 'ac': False}
        }
        res = compute_emissions(data)
        self.assertAlmostEqual(res['travel_emissions'], 19.2)
        
        # Car Petrol with 4 passengers carpooling
        # Expected: (100 * 0.192) / 4 = 4.8 kg CO2
        data['travel']['passengers'] = 4
        res = compute_emissions(data)
        self.assertAlmostEqual(res['travel_emissions'], 4.8)

        # Bike should have 0 emissions
        data['travel'] = {'mode': 'bicycle', 'distance': 50, 'passengers': 1}
        res = compute_emissions(data)
        self.assertAlmostEqual(res['travel_emissions'], 0.0)

    def test_food_calculations(self):
        # Vegan base emission: 2.89, 3 meals, no food waste
        # Expected: 2.89
        data = {
            'travel': {'mode': 'walking', 'distance': 0, 'passengers': 1},
            'food': {'diet_type': 'vegan', 'meal_count': 3, 'food_waste': False},
            'energy': {'electricity_kwh': 0, 'heating': False, 'ac': False}
        }
        res = compute_emissions(data)
        self.assertAlmostEqual(res['food_emissions'], 2.89)

        # Vegan base emission: 2.89, 3 meals, food waste penalty (+10%)
        # Expected: 2.89 * 1.1 = 3.179 kg CO2
        data['food']['food_waste'] = True
        res = compute_emissions(data)
        self.assertAlmostEqual(res['food_emissions'], 3.179)

        # Meat-heavy base emission: 7.19, 2 meals, no food waste
        # Expected: 7.19 * (2/3) = 4.793 kg CO2
        data['food'] = {'diet_type': 'meat-heavy', 'meal_count': 2, 'food_waste': False}
        res = compute_emissions(data)
        self.assertAlmostEqual(res['food_emissions'], 4.793)

    def test_energy_calculations(self):
        # 10 kWh electricity * India grid (0.233) = 2.33 kg CO2
        # AC flat rate (+1.5 kg), Heating active (+2.0 kg)
        # Expected: 2.33 + 1.5 + 2.0 = 5.83 kg CO2
        data = {
            'travel': {'mode': 'walking', 'distance': 0, 'passengers': 1},
            'food': {'diet_type': 'vegan', 'meal_count': 3, 'food_waste': False},
            'energy': {'electricity_kwh': 10, 'heating': True, 'ac': True}
        }
        res = compute_emissions(data)
        self.assertAlmostEqual(res['energy_emissions'], 5.83)

if __name__ == '__main__':
    unittest.main()
