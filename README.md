🚀 DevTrack
Project & Task Management Platform

A production-oriented full-stack project management application designed to help teams organize projects, manage tasks, collaborate efficiently, and track progress.

<p align="center">
<img src="https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge" alt="Project Status"/>
<img src="https://img.shields.io/badge/Stack-PERN-blue?style=for-the-badge" alt="PERN Stack"/>
<img src="https://img.shields.io/badge/Cloud-AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS"/>
<img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions"/>
</p>

📌 About The Project

DevTrack is a full-stack project and task management platform inspired by modern collaboration tools such as Jira and Linear.

The application aims to provide teams with a centralized workspace to manage projects, assign tasks, monitor progress, and improve team productivity.

This project is being developed with industry-standard engineering practices, including clean architecture, secure authentication, automated testing, containerization, cloud deployment, and CI/CD automation.

✨ Planned Features
🔐 Secure user authentication and authorization
👥 Team and user management
📁 Project creation and management
📋 Task creation, assignment, and tracking
🏷️ Task priorities and status management
📊 Project dashboards and progress analytics
🔒 Role-based access control
📱 Responsive user interface
🛠️ Technology Stack
Technology	Purpose
React	Frontend development
Node.js	Backend runtime
Express.js	REST API development
PostgreSQL	Relational database
Docker	Application containerization
AWS	Cloud infrastructure and hosting
GitHub Actions	CI/CD automation
Git & GitHub	Version control and collaboration
HTTPie	API testing
🏗️ Architecture

The application follows a monorepo architecture with independently managed frontend and backend applications.

text
                  DEVTRACK
                     |
          +----------+----------+
          |                     |
       FRONTEND              BACKEND
          |                     |
        React               Node.js
                                |
                             Express
                                |
                           PostgreSQL

📂 Repository Structure
text
devtrack/
│
├── client/                 # React frontend
│
├── server/                 # Node.js + Express backend
│
├── database/               # Database scripts and migrations
│
├── infrastructure/         # AWS infrastructure configuration
│
├── .github/
│   └── workflows/           # GitHub Actions CI/CD workflows
│
├── .gitignore
└── README.md

🚀 Getting Started
Development setup instructions will be added as the application components are implemented.
Prerequisites
Node.js
npm
PostgreSQL
Git
Docker Desktop
GitHub account
🔄 CI/CD Pipeline

The project will use GitHub Actions to automate the software delivery lifecycle.

Planned pipeline stages:

Code checkout
Dependency installation
Code quality and lint checks
Automated testing
Application build
Docker image creation
Container image publishing
AWS deployment
Deployment verification
☁️ Cloud Infrastructure

The application is planned to be deployed on AWS.

Planned services include:

AWS IAM – Identity and access management
Amazon EC2 – Application hosting
Amazon RDS – Managed PostgreSQL
Amazon S3 – File storage
Amazon ECR – Docker image registry
Amazon CloudWatch – Monitoring and logging
🧪 Testing

Automated unit, integration, and API tests will be introduced as the application develops.

🗺️ Development Roadmap
Development environment setup
Repository and project architecture
Backend implementation
PostgreSQL database design
Authentication and authorization
Frontend implementation
API integration
Automated testing
Docker containerization
AWS infrastructure setup
GitHub Actions CI/CD pipeline
Production deployment
Monitoring and logging
🎯 Project Goals

This project focuses on demonstrating practical full-stack development and DevOps engineering skills through a realistic application lifecycle.

Key engineering principles:

Clean and maintainable code
Separation of concerns
Secure application development
Scalable architecture
Automated testing
Infrastructure as Code
Continuous Integration and Deployment
Production monitoring
👨‍💻 Author

Pavan Raj

GitHub: @pavanrajar

<p align="center">
Built with ❤️ while learning Full-Stack Development, AWS and DevOps.
</p>