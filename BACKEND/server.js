require('dotenv').config();
const express = require('express');
const cors = require('cors');

const actasRoutes = require('./routes/actasRoutes');
const authRoutes = require('./controllers/authController');
const catalogosRoutes = require('./routes/catalogosRoutes');
const authMiddleware = require('./middlewares/authmiddleware');
const usuariosRoutes = require('./controllers/usuariosController');
const empleadosRoutes = require('./controllers/empleadosController');
const receptoresRoutes = require('./controllers/receptoresController');
const plantillasRoutes = require('./routes/plantillasRoutes');
const equiposRoutes = require('./routes/equiposRoutes');


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', usuariosRoutes);
app.use('/api/catalogos', /*authMiddleware,*/ catalogosRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/actas', authMiddleware, actasRoutes);
app.use('/api', empleadosRoutes); 
app.use('/api', receptoresRoutes);
app.use("/api", authMiddleware, plantillasRoutes);
app.use('/api', equiposRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});