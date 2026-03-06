require ('dotenv').config();
const express = require ('express');
const cors = require('cors');
const db = require('./config/db');
const actasRoutes = require('./routes/actasRoutes');
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

//Rutas
app.use('/api/actas', actasRoutes);

app.get ('/usuarios', async (req, res) => {
    try{
        const [usuarios] = await db.query ('SELECT * FROM usuarios');
        res.json (usuarios);
    } catch (error){
        res.status(500).json({error: error.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});