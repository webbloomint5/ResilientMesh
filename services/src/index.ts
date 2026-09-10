import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

let isUnhealthy = false;
let simulatedLatencyMs = 0;

app.use(express.json());

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

app.get('/api/auth/verify', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'Auth Service', 
        timestamp: new Date().toISOString(),
        metrics: { memoryUsage: process.memoryUsage().heapUsed }
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