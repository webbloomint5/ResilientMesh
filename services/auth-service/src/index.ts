import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

let isUnhealthy = false;
let simulatedLatencyMs = 0;

app.use(express.json());

app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
});

app.use((req: Request, res: Response, next) => {
    if (isUnhealthy) {
        return res.status(503).json({ error: 'Auth Service is currently down (Chaos Simulation)' });
    }

    if (simulatedLatencyMs > 0) {
        setTimeout(next, simulatedLatencyMs);
    } else {
        next();
    }
});

app.get('/', (req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Auth Service</title>
    <link rel="icon" href="data:,">
</head>
<body>
    <h1>🔒 Auth Service is Online</h1>
    <p>Endpoint di verifica: <a href="/api/auth/verify">/api/auth/verify</a></p>
    <p>Endpoint Out: <a href="/api/out/verifica">/api/out/verifica</a></p>
</body>
</html>`);
});

app.get('/api/auth/verify', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'Auth Service', 
        timestamp: new Date().toISOString(),
        metrics: { memoryUsage: process.memoryUsage().heapUsed },
        customObject: {
            description: "Oggetto aggiunto per la verifica",
            environment: "development",
            version: "1.0.0"
        }
    });
});

app.get('/api/out/verifica', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'Out Service', 
        timestamp: new Date().toISOString(),
        metrics: { memoryUsage: process.memoryUsage().heapUsed },
        customObject: {
            description: "Oggetto per endpoint out verifica",
            active: true
        }
    });
});

app.post('/chaos/toggle', (req: Request, res: Response) => {
    isUnhealthy = !isUnhealthy;
    res.json({ message: `Chaos state changed`, isUnhealthy });
});

app.post('/chaos/latency', (req: Request, res: Response) => {
    simulatedLatencyMs = req.body.latency || 0;
    res.json({ message: `Simulated latency updated`, simulatedLatencyMs });
});

app.listen(PORT, () => {
    console.log(`🔒 Auth Service running on port ${PORT}`);
});