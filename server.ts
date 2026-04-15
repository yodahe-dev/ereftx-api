import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './models';
import Category from './Router/category.router';
import Brand from './Router/brand.router';
import Packaging from './Router/Packaging.router';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 9000;

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/categories', Category);
app.use('/api/brands', Brand);
app.use('/api/packagings', Packaging);


app.get('/', (req, res) => {
  res.send('EREFTX API running...');
});

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    await db.sequelize.sync(); // remove alter: true

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('DB error:', err);
  }
})();