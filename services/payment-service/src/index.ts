import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

let isUnhealthy = false;
let simulatedLatencyMs = 0;

app.use(express.json());

app.use((req: Request, res: Response, next) => {
    if (isUnhealthy) {
        return res.status(503).json({ error: 'Payment Service is currently down (Chaos Simulation)' });
    }

    if (simulatedLatencyMs > 0) {
        setTimeout(next, simulatedLatencyMs);
    } else {
        next();
    }
});

app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'Payment Service',
        status: 'UP',
        port: PORT,
        endpoints: {
            verify: '/api/payment/verify',
            chaosToggle: '/chaos/toggle',
            chaosLatency: '/chaos/latency'
        }
    });
});

app.get('/api/payment/verify', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'Payment Service', 
        timestamp: new Date().toISOString(),
        metrics: { memoryUsage: process.memoryUsage().heapUsed },
        customObject: {
            description: "Gestione transazioni e pagamenti",
            environment: "development",
            version: "1.0.0"
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
    console.log(`💳 Payment Service running on port ${PORT}`);
});