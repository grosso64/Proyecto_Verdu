// db/migrate.js
const db = require('./database'); // Tu conexión existente

const migrations = [
  {
    name: 'añadir_prioridad_pedidos',
    up: `ALTER TABLE pedidos ADD COLUMN prioridad INTEGER DEFAULT 0`,
    down: `ALTER TABLE pedidos DROP COLUMN prioridad`
  },
  {
    name: 'crear_tabla_clientes',
    up: `CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telefono TEXT UNIQUE NOT NULL,
      nombre TEXT,
      ultimo_pedido DATETIME
    )`,
    down: `DROP TABLE clientes`
  }
];

function runMigrations() {
  db.serialize(() => {
    // Crear tabla de control de migraciones si no existe
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ejecutar migraciones pendientes
    migrations.forEach(migration => {
      db.get(`SELECT 1 FROM _migrations WHERE name = ?`, [migration.name], (err, row) => {
        if (!row) {
          db.run(migration.up, err => {
            if (err) console.error(`❌ Error en migración ${migration.name}:`, err.message);
            else {
              db.run(`INSERT INTO _migrations (name) VALUES (?)`, [migration.name]);
              console.log(`✅ Migración aplicada: ${migration.name}`);
            }
          });
        }
      });
    });
  });
}

module.exports = runMigrations;