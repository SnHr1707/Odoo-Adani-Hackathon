# 🛡️ GearGuard: The Ultimate Maintenance Tracker

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

**GearGuard** is a robust, full-stack maintenance management system inspired by **Odoo**.  
It connects **Equipment**, **Maintenance Teams**, and **Technicians** to streamline repair workflows using a **Kanban board**, **Calendar scheduling**, and **Role-Based Access Control**.

---

## 🚀 Features

- **Role-Based Access Control**  
  Separate portals for **Employees** (Requesters) and **Technicians** (Solvers).

- **Kanban Workflow**  
  Drag-and-drop maintenance requests across stages:  
  `New → In Progress → Repaired → Scrap`

- **Smart Scheduling**  
  Weekly calendar view with:
  - Drag-to-schedule
  - Current-time indicator

- **Asset Management**  
  Track equipment, serial numbers, and work centers.

- **Team Management**  
  Organize technicians into teams (IT, HVAC, Production) with category-based auto-assignment.

- **Dark Mode UI**  
  Sleek modern interface built using **Tailwind CSS**.

- **Smart Automation**  
  Auto-fills maintenance teams and categories based on selected equipment.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State & Forms:** React Hook Form, Context API
- **Date Handling:** date-fns

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (Motor Async Driver)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcrypt
- **Validation:** Pydantic

---

## ⚙️ Prerequisites

Ensure the following are installed:

1. **Node.js** (v16+) and **npm**
2. **Python** (v3.9+)
3. **MongoDB** running on `mongodb://localhost:27017`

---

## 📦 Installation Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/gearguard.git
cd gearguard

## 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn motor pydantic python-multipart \
python-jose[cryptography] passlib[bcrypt] email-validator

# Run backend server
python main.py
Backend runs at:
http://0.0.0.0:8000