<div align="center">

# 🛒 Backend E-Commerce API

### ⚡ Built with NestJS + Fastify + Vercel

A lightweight, serverless backend API for modern e-commerce applications.

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![pnpm](https://img.shields.io/badge/Package%20Manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🚀 Features

✅ **NestJS + Fastify** — blazing-fast, modular, and scalable  
✅ **Serverless-ready** — deploy seamlessly on Vercel  
✅ **Zod Validation** — type-safe and runtime validation  
✅ **CORS + Helmet + Compression** — secure defaults  
✅ **Sample Products API** — ready to integrate with frontend  
✅ **Auto Deploy & Push to GitHub** — via `pnpm release`

---

## 📁 Folder Structure

backend-ecommers/
├── src/
│ ├── app.controller.ts # Root & info endpoints
│ ├── products.controller.ts # Example Product API
│ ├── app.module.ts # Root module
│ ├── main.ts # Bootstrap (Nest + Fastify)
│ └── vercel.ts # Entry point for Vercel
├── vercel.json # Vercel config
├── package.json
├── tsconfig.json
└── README.md

yaml
Salin kode

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Framework | [NestJS 11](https://nestjs.com) |
| Server Adapter | [Fastify](https://fastify.dev) |
| Deployment | [Vercel Serverless Functions](https://vercel.com) |
| Language | [TypeScript 5.7+](https://www.typescriptlang.org) |
| Package Manager | [pnpm 10+](https://pnpm.io) |
| Logging | [Pino](https://github.com/pinojs/pino) |
| Validation | [Zod](https://github.com/colinhacks/zod) |

---

## 🧑‍💻 Local Development

Clone & install dependencies:
```bash
git clone https://github.com/hamzahrobbany/backend-ecommers.git
cd backend-ecommers
pnpm install
Start development server:

bash
Salin kode
pnpm start:dev
Run production build locally:

bash
Salin kode
pnpm build
pnpm start:vercel
Access locally → http://localhost:3000/api/info

🧱 Available Endpoints
Method	Endpoint	Description
GET	/	Root health check
GET	/healthz	Health status
GET	/api/info	App info
GET	/api/products	List sample products
GET	/api/products/:id	Get product by ID

Example:

json
Salin kode
{
  "ok": true,
  "total": 3,
  "data": [
    { "id": 1, "name": "Kopi Arabica Gayo", "price": 75000 },
    { "id": 2, "name": "Kopi Robusta Lampung", "price": 60000 }
  ]
}
🚀 Deployment on Vercel
Install CLI

bash
Salin kode
npm i -g vercel
Build & deploy

bash
Salin kode
pnpm release
Done 🎉
Live API →
👉 https://backend-ecommers.vercel.app/api/products

📦 Scripts
Command	Description
pnpm build	Compile TypeScript to JS
pnpm start:dev	Start NestJS in watch mode
pnpm start:vercel	Run serverless build locally
pnpm clean	Remove dist folder
pnpm repair-lock	Rebuild pnpm-lock.yaml
pnpm release	Clean → Build → Deploy → Auto-push to GitHub

🧠 Roadmap
 🔐 JWT Authentication (Login/Register)

 💾 Database (Supabase / PostgreSQL)

 💳 Orders & Transactions

 📦 Image Upload (Supabase Storage)

 🧮 Admin Dashboard (Next.js integration)

👨‍💻 Author
 Hamzah Robbany 
💼 Freelance Software Engineer — Fullstack Developer
🌍 GitHub • LinkedIn (optional)

🪪 License
This project is licensed under the MIT License — free to use and modify.

<div align="center"> <sub>© 2025 Hamzah Robbany — Crafted with ❤️ using NestJS & Vercel</sub> </div> ```