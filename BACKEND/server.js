require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const actasRoutes = require('./routes/actasRoutes');
const authRoutes = require('./controllers/authController');
const authMiddleware = require('./middlewares/authmiddleware');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/usuarios', async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT idUsuarios, nomUsu, cargoUsu, corUsu FROM usuarios');
        res.json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: error.message });
    }
});


app.use('/api/actas', authMiddleware, actasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});