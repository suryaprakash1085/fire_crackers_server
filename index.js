import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import usersRouter from './route/users.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Users route
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.send('Welcome to API!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
