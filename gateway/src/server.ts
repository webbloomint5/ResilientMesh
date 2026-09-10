import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const services = [
    { name: 'Auth Service', healthUrl: 'http://localhost:3001/api/auth/verify', baseUrl: 'http://localhost:3001' },
    { name: 'Payment Service', healthUrl: 'http://localhost:3002/api/payment/verify', baseUrl: 'http://localhost:3002' }
];

const healthRegistry: Record<string, { status: string; lastChecked: string; responseTimeMs: number }> = {};

// Monitoraggio periodico dello stato dei servizi
setInterval(async () => {
    for (const service of services) {
        const start = Date.now();
        try {
            await axios.get(service.healthUrl, { timeout: 2000 });
            const responseTimeMs = Date.now() - start;
            healthRegistry[service.name] = {
                status: 'HEALTHY',
                lastChecked: new Date().toISOString(),
                responseTimeMs
            };
        } catch (error) {
            healthRegistry[service.name] = {
                status: 'DOWN / UNRESPONSIVE',
                lastChecked: new Date().toISOString(),
                responseTimeMs: Date.now() - start
            };
        }
    }
}, 5000);

app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'API Gateway & Observability Engine',
        status: 'UP',
        port: PORT,
        endpoints: {
            dashboard: '/gateway/dashboard',
            proxyAuth: '/proxy/auth/*',
            proxyPayment: '/proxy/payment/*'
        }
    });
});

app.get('/gateway/dashboard', (req: Request, res: Response) => {
    res.json({
        systemStatus: 'OPERATIONAL',
        monitoredServices: healthRegistry,
        timestamp: new Date().toISOString()
    });
});

// Proxy dinamico per Auth Service (porta 3001)
app.all('/proxy/auth/:path*', async (req: Request, res: Response) => {
    const targetPath = req.params.path ? `/${req.params.path}` : '';
    const queryString = Object.keys(req.query).length ? '?' + new URLSearchParams(req.query as Record<string, string>).toString() : '';
    const url = `http://localhost:3001${targetPath}${queryString}`;

    try {
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            validateStatus: () => true // Permette di inoltrare anche codici di errore (es. 503 Chaos)
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        res.status(502).json({ error: 'Gateway failed to reach Auth Service', details: error.message });
    }
});

// Proxy dinamico per Payment Service (porta 3002)
app.all('/proxy/payment/:path*', async (req: Request, res: Response) => {
    const targetPath = req.params.path ? `/${req.params.path}` : '';
    const queryString = Object.keys(req.query).length ? '?' + new URLSearchParams(req.query as Record<string, string>).toString() : '';
    const url = `http://localhost:3002${targetPath}${queryString}`;

    try {
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            validateStatus: () => true
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        res.status(502).json({ error: 'Gateway failed to reach Payment Service', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway & Observability Engine running on port ${PORT}`);
});