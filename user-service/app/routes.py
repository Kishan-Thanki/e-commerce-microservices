from flask import Blueprint, request, jsonify
from .models import db, User
import jwt
from datetime import datetime, timedelta
import os

bp = Blueprint('user', __name__, url_prefix='/users')

HARDCODED_ADMIN_USERNAME = os.getenv('HARDCODED_ADMIN_USERNAME', 'admin_test')
HARDCODED_ADMIN_PASSWORD = os.getenv('HARDCODED_ADMIN_PASSWORD', 'admin_password')
HARDCODED_ADMIN_ID = 0

@bp.route('/', methods=['GET'])
def get_all_users():
    users = User.query.all()
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        })
    return jsonify(users_data), 200

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400

    if data['username'] == HARDCODED_ADMIN_USERNAME:
        return jsonify({'error': 'Cannot register with reserved username'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created', 'id': new_user.id}), 201


@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == HARDCODED_ADMIN_USERNAME and password == HARDCODED_ADMIN_PASSWORD:
        access_token = jwt.encode({
            'sub': HARDCODED_ADMIN_ID,
            'exp': datetime.utcnow() + timedelta(minutes=int(os.getenv('JWT_ACCESS_EXP_MINUTES', 15))),
            'type': 'access',
            'role': 'admin'
        }, os.getenv('SECRET_KEY'), algorithm="HS256")

        refresh_token = jwt.encode({
            'sub': HARDCODED_ADMIN_ID,
            'exp': datetime.utcnow() + timedelta(days=int(os.getenv('JWT_REFRESH_EXP_DAYS', 7))),
            'type': 'refresh',
            'role': 'admin'
        }, os.getenv('SECRET_KEY'), algorithm="HS256")

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': HARDCODED_ADMIN_ID
        })

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = jwt.encode({
        'sub': user.id,
        'exp': datetime.utcnow() + timedelta(minutes=int(os.getenv('JWT_ACCESS_EXP_MINUTES', 15))),
        'type': 'access'
    }, os.getenv('SECRET_KEY'), algorithm="HS256")

    refresh_token = jwt.encode({
        'sub': user.id,
        'exp': datetime.utcnow() + timedelta(days=int(os.getenv('JWT_REFRESH_EXP_DAYS', 7))),
        'type': 'refresh'
    }, os.getenv('SECRET_KEY'), algorithm="HS256")

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user_id': user.id
    })


@bp.route('/verify-role', methods=['GET'])
def verify_role():
    auth_header = request.headers.get('Authorization')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Missing token'}), 401

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        user_id = payload['sub']
        token_type = payload.get('type')
        token_role = payload.get('role')

        required_role = request.args.get('role', 'admin')

        if user_id == HARDCODED_ADMIN_ID and token_role == 'admin':
            if required_role == 'admin':
                return jsonify({'status': 'authorized'}), 200
            elif required_role == 'user' and token_type == 'access':
                return jsonify({'status': 'authorized'}), 200
            else:
                return jsonify({'error': 'Insufficient permissions'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role == required_role:
            return jsonify({'status': 'authorized'}), 200
        return jsonify({'error': 'Insufficient permissions'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

