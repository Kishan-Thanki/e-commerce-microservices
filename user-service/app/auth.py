import jwt
from datetime import datetime, timedelta
from flask import current_app


def create_jwt(user_id):
    access_payload = {
        'exp': datetime.utcnow() + timedelta(minutes=current_app.config['JWT_ACCESS_EXP_MINUTES']),
        'iat': datetime.utcnow(),
        'sub': user_id,
        'type': 'access'
    }
    refresh_payload = {
        'exp': datetime.utcnow() + timedelta(days=current_app.config['JWT_REFRESH_EXP_DAYS']),
        'iat': datetime.utcnow(),
        'sub': user_id,
        'type': 'refresh'
    }

    access_token = jwt.encode(
        access_payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    refresh_token = jwt.encode(
        refresh_payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return access_token, refresh_token