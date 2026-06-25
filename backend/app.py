import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import blueprints from reorganized routes subdirectory
from routes.calculator import calculator_bp
from routes.habits import habits_bp
from routes.suggestions import suggestions_bp
from routes.carbon_interface import carbon_interface_bp

def create_app():
    app = Flask(__name__)
    
    # Configure CORS - Enable React frontend on port 5173 to access resources
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
    
    # Register Blueprints
    app.register_blueprint(calculator_bp)
    app.register_blueprint(habits_bp)
    app.register_blueprint(suggestions_bp)
    app.register_blueprint(carbon_interface_bp)
    
    @app.route('/')
    def index():
        return jsonify({
            'status': 'healthy',
            'service': 'EcoTrack Carbon Tracker API Backend',
            'version': '1.0.0'
        }), 200

    @app.route('/api/health')
    def health():
        """
        API health status validation endpoint.
        Returns: { "status": "ok" }
        """
        return jsonify({"status": "ok"}), 200
        
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404
        
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    # Run the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
