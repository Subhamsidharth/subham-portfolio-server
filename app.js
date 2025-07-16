import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import route from './routes.js'

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 9090;
const DB_URI = process.env.DB_URI;

mongoose.set('strictQuery', true); // or false
mongoose.connect(DB_URI, { connectTimeoutMS: 30000 })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err));

app.use('/api', route);

app.get('/', (req, res) => {
    res.send('Welcome to Subham Portfolio Backend');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
