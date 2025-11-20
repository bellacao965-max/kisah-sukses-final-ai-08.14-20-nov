Kisah Sukses Final AI Hebat — Render-ready package (all files in repo root)

How to deploy:
1. Upload **all files** from this package into your GitHub repo root.
2. On Render.com create a new Web Service and connect to your repo.
   - Environment: Node
   - Root Directory: .
   - Build Command: npm install
   - Start Command: node server.js
3. Set environment variable OPENAI_API_KEY on Render if you want real OpenAI responses.
4. Visit the URL after deploy.

Local test:
1. npm install
2. npm start
3. Visit http://localhost:10000