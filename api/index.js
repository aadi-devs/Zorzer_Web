// Vercel serverless entry point — imports the Express app and exports it as
// the default handler. All /proxy/* routes are forwarded here by vercel.json.
import app from "../server.js";
export default app;
