require('dotenv').config();
const express = require('express');
const cors = require('cors');

const actasRoutes = require('./routes/actasRoutes');
const authRoutes = require('./controllers/authController');
const authMiddleware = require('./middlewares/authmiddleware');
const usuariosRoutes = require('./controllers/usuariosController');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/actas', authMiddleware, actasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});