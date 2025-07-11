const config = require('./config');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// =============================================
// Configuración del Servidor
// =============================================
const PORT = config.PORT || 5000;

// =============================================
// Configuración de la Base de Datos
// =============================================
const db = new sqlite3.Database(config.DATABASE_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
    process.exit(1); // Salir si no hay conexión a DB
  } else {
    console.log('🟢 Conectado a SQLite');
    initializeDatabase();
  }
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función de inicialización de la base de datos
function initializeDatabase() {
  db.serialize(() => {
    // 1. Crear tabla principal de pedidos
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT NOT NULL,
      pedido TEXT NOT NULL,
      faltantes TEXT,
      procesado BOOLEAN DEFAULT 0,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('❌ Error al crear tabla pedidos:', err.message);
    });

    // 2. Verificar estructura de la tabla
    db.all("PRAGMA table_info(pedidos)", [], (err, columns) => {
      if (err) return console.error('❌ Error al verificar tabla:', err.message);
      
      const requiredColumns = {
        cliente: 'TEXT NOT NULL',
        pedido: 'TEXT NOT NULL',
        faltantes: 'TEXT',
        procesado: 'BOOLEAN DEFAULT 0'
      };

      // Verificar y agregar columnas faltantes
      Object.entries(requiredColumns).forEach(([col, type]) => {
        if (!columns.some(c => c.name === col)) {
          db.run(`ALTER TABLE pedidos ADD COLUMN ${col} ${type}`, (err) => {
            if (err) console.error(`❌ Error al añadir ${col}:`, err.message);
            else console.log(`✅ Columna '${col}' añadida correctamente`);
          });
        }
      });
    });
  });
}
// Después de conectar a la DB:
db.serialize(() => {
  // Lista de cambios necesarios
  const cambios = [
    "ALTER TABLE pedidos ADD COLUMN prioridad INTEGER DEFAULT 0",
    "CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY, telefono TEXT UNIQUE)"
  ];
  
  cambios.forEach(sql => {
    db.run(sql, err => {
      if (err && !err.message.includes('duplicate column')) { // Ignora errores de columna ya existente
        console.error(`❌ Error aplicando cambio: ${sql}`, err.message);
      }
    });
  });
});
// =============================================
// Middlewares
// =============================================
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// =============================================
// Webhook de WhatsApp (Solo Recepción)
// =============================================

// 1. Endpoint de verificación (GET)
app.get('/webhook', (req, res) => {
  console.log('🔍 Parámetros recibidos:', req.query);
  
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    return res.status(200).send(req.query['hub.challenge']);
  }
  
  console.log('❌ Token incorrecto');
  res.sendStatus(403);
});

// 2. Endpoint para recibir mensajes (POST)
app.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    
    // Solo procesar mensajes de texto
    if (message?.type === 'text') {
      const { from, text } = message;
      
      // Extraer productos del mensaje
      const productos = extraerProductos(text.body);
      
      // Consultar stock en la base de datos
      const faltantes = await verificarStock(productos);
      
      // Guardar en base de datos (sin enviar respuesta)
      await guardarPedido(from, text.body, faltantes);
      
      console.log('📥 Pedido registrado:', {
        cliente: from,
        productos: productos.length,
        faltantes: faltantes.length
      });
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('🔥 Error en webhook:', error);
    res.sendStatus(500);
  }
});

// =============================================
// Funciones auxiliares (SIN ENVÍO DE MENSAJES)
// =============================================

function extraerProductos(texto) {
  return texto.split(',')
    .map(item => {
      const match = item.trim().match(/(\d+)\s*(kg|unidades?)?\s*(?:de\s+)?([a-záéíóúñ\s]+)/i);
      return match && {
        cantidad: parseFloat(match[1]),
        unidad: match[2] || 'unidad',
        nombre: match[3].trim().toLowerCase()
      };
    })
    .filter(Boolean);
}

async function verificarStock(productos) {
  const faltantes = [];
  
  for (const producto of productos) {
    const enStock = await new Promise((resolve, reject) => {
      db.get(
        'SELECT stock, unidad FROM productos WHERE nombre LIKE ?',
        [`%${producto.nombre}%`],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!enStock) {
      faltantes.push({
        ...producto,
        motivo: 'Producto no registrado'
      });
    } else if (enStock.stock < producto.cantidad) {
      faltantes.push({
        nombre: producto.nombre,
        faltan: producto.cantidad - enStock.stock,
        unidad: enStock.unidad,
        motivo: 'Stock insuficiente'
      });
    }
  }
  
  return faltantes;
}

function guardarPedido(cliente, pedido, faltantes) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO pedidos (cliente, pedido, faltantes) VALUES (?, ?, ?)',
      [cliente, pedido, JSON.stringify(faltantes)],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// =============================================
// Endpoints de Administración
// =============================================

app.get('/admin/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos ORDER BY fecha DESC', [], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener pedidos:', err.message);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    res.json(rows);
  });
});

app.put('/admin/pedidos/:id', (req, res) => {
  db.run(
    'UPDATE pedidos SET procesado = ? WHERE id = ?',
    [req.body.procesado ? 1 : 0, req.params.id],
    function(err) {
      if (err) {
        console.error('❌ Error al actualizar pedido:', err.message);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }
      res.sendStatus(200);
    }
  );
});

// =============================================
// Iniciar el servidor
// =============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor funcionando en http://localhost:${PORT}`);
  console.log('🔧 Configuración:');
  console.log(`- Puerto: ${PORT}`);
  console.log(`- Ruta DB: ${config.DATABASE_PATH}`);
  console.log(`- Modo: ${config.NODE_ENV || 'development'}\n`);
});