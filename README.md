AI Customer Support Assistant
A demo customer-support web application built with React, TypeScript, Express, and a database layer. It provides FAQ-based responses, identifies requests that may need human support, and lets users submit support tickets.


Features
- Responsive customer-support chat interface
- Predefined FAQs for shipping, returns, refunds, order tracking, support hours, and payment methods
- Basic issue categorization and escalation recommendations
- Support ticket creation with a generated ticket ID
- Input validation using Zod
- Health and FAQ endpoints
- React + TypeScript frontend and Express + TypeScript backend
Tech stack
- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Validation: Zod
- Data layer: Drizzle ORM and the workspace database package
- Package manager: pnpm
Project structure
.
├── artifacts/
│   ├── api-server/                 # Express API
│   └── customer-support-assistant/ # React/Vite frontend
├── lib/                            # Shared workspace libraries
├── package.json
├── pnpm-workspace.yaml
└── ...
Prerequisites
- Node.js (use a current LTS release)
- pnpm (version compatible with the repository's packageManager field, if present)
- Database configuration required by the workspace database package
Install dependencies
Clone the repository and enter the project directory:
git clone https://github.com/Yaswanthpothula/AI-Customer-Support-Assistant.git
cd AI-Customer-Support-Assistant
Install pnpm if it is not already installed:
npm install --global pnpm
Install dependencies from the repository root:
pnpm install
This is a pnpm workspace. Do not use npm install at the repository root; the root preinstall script requires pnpm.

Run in development
The project was created as a Replit workspace, and its service startup may depend on Replit-provided environment variables and database configuration. Review .replit, the database package, and any required environment-variable definitions before running outside Replit.

Frontend development server:
pnpm --filter @workspace/customer-support-assistant dev
Build the API server:
pnpm --filter @workspace/api-server build
Start the API server after building:
pnpm --filter @workspace/api-server start
The API server may require a working database connection before ticket creation will succeed. These commands are provided from the workspace scripts; a clean local setup has not yet been independently verified.
API endpoints
The support router defines the following endpoints (the application may mount them under an API prefix):
Method	Endpoint path	Purpose
GET	/support/health	Returns demo health status
GET	/support/faqs	Returns the predefined FAQ list
POST	/support/chat	Matches a message against FAQs and recommends escalation when appropriate
POST	/support/tickets	Creates a support ticket


Example chat request body:
{
  "message": "What is your return policy?",
  "customer_name": "Demo Customer",
  "customer_email": "demo@example.com"
}
Example ticket request body:
{
  "customer_name": "Demo Customer",
  "customer_email": "demo@example.com",
  "category": "returns",
  "priority": "normal",
  "summary": "Question about returning an item",
  "message": "I would like to understand the return process."
}
Request fields are validated by the API schemas; consult the shared API schema files for the exact required fields and constraints.
Build and type-check
From the repository root:
pnpm run typecheck
pnpm run build
These commands have not yet been run in a clean environment, so they should be treated as verification steps rather than a claim that the build is passing.
Security and privacy
- Never commit .env files, database credentials, API keys, tokens, or other secrets.
- Use .env.example for documented placeholder variables if environment variables are required.
- Use fictional customer details for demos.
- The current demo is not designed for production customer data. Add authentication, authorization, rate limiting, logging safeguards, and production-grade error handling before deployment for real users.
Future improvements
- Add an optional LLM integration with clearly documented configuration and usage costs
- Connect to a mock or authorized order-management API
- Add authentication and a protected support-agent dashboard
- Add email/notification integration for ticket updates
- Add automated tests and CI checks
Author
Yaswanth Pothula

This project was built as a portfolio demo to explore customer-support workflows, API development, issue categorization, and ticket management
