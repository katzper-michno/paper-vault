import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './router';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', router)

app.listen(process.env.PORT, () => {
  console.log(`Papervault server running on http://localhost:${process.env.PORT}`);
  console.log(`Available endpoints:`);
  console.log(`   GET    /api/search?q=:query`);
  console.log(`   GET    /api/papers`);
  console.log(`   POST   /api/papers`);
  console.log(`   PUT    /api/papers/:id`);
  console.log(`   DELETE /api/papers/:id`);
  console.log(`   GET    /api/papers/:id/bibtex`)
});
