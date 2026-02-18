import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuid } from 'uuid';

const app = express();
const PORT = parseInt(process.env.API_PORT || '4000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// In-memory store (swap with DB later)
interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'audio' | 'video' | 'playlist' | 'announcement';
  url?: string;
  createdAt: string;
}

const content: ContentItem[] = [];

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.get('/v1/content', (_req, res) => {
  res.json({ items: content });
});

app.post('/v1/content', (req, res) => {
  const { title, description, type, url } = req.body;
  if (!title || !description || !type) {
    return res.status(400).json({ error: 'title, description, and type are required' });
  }
  const item: ContentItem = {
    id: uuid(),
    title,
    description,
    type,
    url,
    createdAt: new Date().toISOString(),
  };
  content.unshift(item);
  res.status(201).json(item);
});

app.listen(PORT, HOST, () => {
  console.log(`Admin API listening on http://${HOST}:${PORT}`);
});
