require ('dotenv').config();
const express = require ('express');
const db = require('./config/db');
const actasRoutes = require('./routes/actasRoutes');
const app = express();

app.use(express.json());
app.use('/api/actas', actasRoutes);


// RUTA DE PRUEBA
app.get('/prueba-db', async (req, res) => {
    try {
       console.log("Intentando conectar")
        const [rows] = await db.query('SELECT 1 + 1 AS solucion');
        console.log("Conexion exitosa")
        res.json({ rows});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error conectando a la BD" });
    }
});

app.get ('/usuarios', async (req, res) => {
    try{
        const [usuarios] = await db.query ('SELECT * FROM usuarios');
        res.json (usuarios);
    } catch (error){
        res.status(500).json({error: error.message});
    }
});

app.listen(3000, () => {
    console.log("Servidor corriendo");
})