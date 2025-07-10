from flask import Blueprint, request, jsonify
from .models import db, Product
import requests
import os

bp = Blueprint('product', __name__, url_prefix='/products')

def verify_admin(token):
    try:
        response = requests.get(
            f"{os.getenv('USER_SERVICE_URL', 'http://user-service:5000')}/users/verify-role",
            headers={'Authorization': f'Bearer {token}'},
            timeout=3
        )
        if response.status_code == 200:
            result = response.json()
            return result.get('status') == 'authorized'
        return False
    except requests.exceptions.RequestException as e:
        print(f"Error communicating with user service: {e}")
        return False


@bp.route('', methods=['POST'])
def create_product():
    auth_header = request.headers.get('Authorization')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Missing token'}), 401

    token = auth_header.split(' ')[1]
    if not verify_admin(token):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.json

    if not data or 'name' not in data or 'price' not in data:
        return jsonify({'error': 'Missing required fields: name and price'}), 400

    new_product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        stock=data.get('stock', 0)
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({
        'id': new_product.id,
        'name': new_product.name,
        'price': new_product.price,
        'stock': new_product.stock
    }), 201


@bp.route('', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'stock': p.stock
    } for p in products])
