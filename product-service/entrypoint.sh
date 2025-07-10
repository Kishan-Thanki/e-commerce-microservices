#!/bin/sh

mkdir -p db

export FLASK_APP=app

python <<EOF
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
EOF

exec python -m flask run --host=0.0.0.0 --port=5001
