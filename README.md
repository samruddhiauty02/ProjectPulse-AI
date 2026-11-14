# 🚀 ProjectPulse AI
### AI-Powered Enterprise Project & Procurement Intelligence Platform

ProjectPulse AI is a full-stack enterprise management platform designed to simplify project tracking, procurement management, budget monitoring, and business decision-making through AI-powered insights.

The platform combines a modern React dashboard with a Java Spring Boot backend and Google Gemini AI to provide intelligent, database-grounded assistance.

## ✨ Key Features

- **Project Management:** Create, update, delete, search, and track projects.
- **Procurement Management:** Manage procurement requests, vendors, amounts, and statuses.
- **Budget Analytics:** Monitor project budgets, procurement costs, and financial utilization.
- **Interactive Dashboard:** Visualize project and procurement information through charts.
- **Deadline Alerts:** Track upcoming project deadlines.
- **AI Assistant:** Ask questions about project and procurement records using Google Gemini AI.
- **AI Insights:** Generate intelligent business reports and summaries.
- **AI Risk Assessment:** Identify potential project and operational risks.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Backend | Java, Spring Boot |
| Database | MySQL |
| AI Integration | Google Gemini API |
| Build Tool | Maven |
| Development Tools | VS Code, Git, GitHub |

## 🏗️ Architecture

React Frontend → Spring Boot REST APIs → Service Layer → MySQL Database

The AI assistant uses Google Gemini to generate responses using relevant project and procurement information retrieved from the database.

## ⚙️ Setup and Installation

### Prerequisites

- Java Development Kit (JDK)
- Node.js and npm
- MySQL Server
- Google Gemini API Key

### 1. Clone the repository

```bash
git clone https://github.com/samruddhiauty02/ProjectPulse-AI.git
cd ProjectPulse-AI
```

### 2. Configure MySQL

Create a database:

```sql
CREATE DATABASE projectpulse_ai;
```

### 3. Configure application properties

Create `src/main/resources/application.properties` using the provided `application-example.properties` as a template.

Update your local configuration with your MySQL credentials and Gemini API key.

**Never commit real passwords or API keys to GitHub.**

### 4. Run the Spring Boot backend

From the project root, on Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

### 5. Run the React frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

`http://localhost:5173`

Backend runs at:

`http://localhost:8080`

## 🔐 Security

- Sensitive local configuration is excluded through `.gitignore`.
- API keys and database credentials should be supplied through local configuration.
- The example configuration contains placeholders only.

## 🎯 Project Objective

The objective of ProjectPulse AI is to demonstrate how full-stack development, database management, REST API integration, and generative AI can be combined to build a practical enterprise intelligence platform.

---

**Developed as a full-stack AI-powered enterprise project.**