const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Conectar base de datos
const db = new sqlite3.Database("./db/database.sqlite", (err) => {
  if (err) return console.error("❌ Error al conectar:", err.message);
  console.log("🟢 Base de datos conectada");
});

// Crear tablas
db.serialize(() => {
  // Tabla usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      clave TEXT NOT NULL
    )
  `);

  // Usuario por defecto
  db.get("SELECT COUNT(*) as total FROM usuarios", (err, row) => {
    if (row.total === 0) {
      db.run("INSERT INTO usuarios (nombre, clave) VALUES (?, ?)", ["admin", "1234"]);
      console.log("🧑‍💼 Usuario admin creado");
    }
  });

  // Tabla productos
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      unidad TEXT NOT NULL,
      stock REAL NOT NULL
    )
  `);

  // Tabla pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto_original TEXT NOT NULL,
      fecha TEXT NOT NULL,
      total_faltantes TEXT
    )
  `);
});
//gets productos
app.get("/productos", (req, res) => {
  db.all("SELECT * FROM productos", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
//post productos
app.post("/productos", (req, res) => {
  const { nombre, unidad, stock } = req.body;

  if (!nombre || !unidad || stock == null) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  db.run(
    "INSERT INTO productos (nombre, unidad, stock) VALUES (?, ?, ?)",
    [nombre, unidad, stock],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});
//put productos
app.put("/productos/:id", (req, res) => {
  const id = req.params.id;
  const { stock } = req.body;

  db.run(
    "UPDATE productos SET stock = ? WHERE id = ?",
    [stock, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json({ mensaje: "Stock actualizado" });
    }
  );
});
//post login
app.post("/login", (req, res) => {
  const { nombre, clave } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE nombre = ? AND clave = ?",
    [nombre, clave],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({ acceso: true });
      } else {
        res.json({ acceso: false });
      }
    }
  );
});
// Servidor
app.listen(5000, () => {
  console.log("🚀 Backend corriendo en http://localhost:5000");
});