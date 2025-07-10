# E-commerce Microservices Demo

Hey there! 👋 This is a **demo e-commerce app** built with a microservices twist. We're using Flask for the backend services, Docker to keep everything neatly contained, and Nginx as our friendly API Gateway to tie it all together. Perfect for seeing how these pieces fit!

---

##  Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Running the App](#running-the-app)
7. [API Endpoints](#api-endpoints)
8. [Deploying to AWS](#deploying-to-aws)
9. [Project Structure](#project-structure)
10. [License](#license)

---

##  Overview

This app mimics a mini online store with services split into:

- **User Service:** Manages user registration, login, and roles.
- **Product Service:** Handles product creation and listing.
- **Nginx API Gateway:** Routes requests to the appropriate backend service.

All services communicate over Docker's internal network with persistent storage.

---

##  Tech Stack

- Python (Flask)
- Docker & Docker Compose
- SQLite (dev only)
- JWT (Authentication)
- Nginx (API Gateway)
- Postman (for testing)

---

##  Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Postman](https://www.postman.com/)

### Clone the Repository

```bash
git clone https://github.com/Kishan-Thanki/e-commerce-microservices.git
cd e-commerce-microservices
```

---

##  Environment Variables

Create a `.env` file in the root directory with the following:

```env
SECRET_KEY=your_strong_secret_key
USER_DB_PATH=sqlite:////app/db/user.db
PRODUCT_DB_PATH=sqlite:////app/db/products.db
JWT_ACCESS_EXP_MINUTES=15
JWT_REFRESH_EXP_DAYS=7
USER_SERVICE_URL=http://user-service:5000
HARDCODED_ADMIN_USERNAME=admin_test
HARDCODED_ADMIN_PASSWORD=admin_password
```

---

##  Database Migrations

### User Service

```bash
docker-compose down -v
docker-compose build user-service product-service
docker-compose run --rm user-service flask db init
docker-compose run --rm user-service flask db migrate -m "Add created_at to User model"
docker-compose run --rm user-service flask db upgrade
```

### Product Service

```bash
docker-compose run --rm product-service flask db init
docker-compose run --rm product-service flask db migrate -m "Initial product model"
docker-compose run --rm product-service flask db upgrade
```

---

## ▶ Running the App

```bash
docker-compose up --build
```

- App is available at: `http://localhost`
- Internal service URLs:
  - `http://user-service:5000`
  - `http://product-service:5001`

---

##  API Endpoints

###  Users

| Method | Endpoint                                | Description             |
|--------|------------------------------------------|-------------------------|
| POST   | `/users/register`                        | Register new user       |
| POST   | `/users/login`                           | User login              |
| GET    | `/users`                                 | List users              |
| GET    | `/users/verify-role?role=admin`          | Check admin role        |

###  Products

| Method | Endpoint          | Description               | Auth Required |
|--------|-------------------|---------------------------|---------------|
| GET    | `/products`       | List all products         | ❌            |
| POST   | `/products`       | Add new product           | ✅ Admin only |

> Use the admin credentials from `.env` to authenticate and get a token for protected routes.

---

## ☁ Deploying to AWS (Free Tier)

- Use separate `t2.micro` EC2 instances for each service.
- Configure VPC, subnets, and security groups.
- Push Docker images to AWS ECR.
- ⚠️ Free tier has 750 total hours/month. Stop instances when not needed!

---

##  Project Structure

```
e-commerce/
├── api-gateway/
│   └── nginx.conf
├── product-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── routes.py
│   ├── entrypoint.sh
│   ├── Dockerfile
│   └── requirements.txt
├── user-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── routes.py
│   ├── entrypoint.sh
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── .gitignore
└── .dockerignore
```

---

##  Architecture Diagram

*Coming Soon – visual overview of services and communication.*

---

## 📄 License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).
