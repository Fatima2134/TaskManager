# Task Manager

## Local development

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

## Production deployment

### Railway (backend)

1. Push this repository to GitHub.
2. In Railway, create a new project and deploy the backend folder.
3. Set these environment variables:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CORS_ORIGIN=https://your-netlify-app.netlify.app`
4. Use the generated Railway URL as the backend base URL.

### Netlify (frontend)

1. Import the repository into Netlify.
2. Set the build command to:
   - `npm install && npm run build`
3. Set the publish directory to:
   - `frontend/dist`
4. Set environment variable:
   - `VITE_API_URL=https://your-railway-app.up.railway.app/api`
5. Deploy.

### MongoDB Atlas

Create a MongoDB cluster and set:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/taskmanager
```
