const db = require('./db'); // Conexión a tu base de datos

async function checkStockAgainstOrder(orderText) {
  // 1. Extraer productos del mensaje
  const orderedItems = extractProductsFromText(orderText);
  
  // 2. Consultar stock en DB
  const stockItems = await db.query('SELECT nombre, stock, unidad FROM productos');
  
  // 3. Comparar
  const missingItems = [];
  let allInStock = true;

  orderedItems.forEach(ordered => {
    const dbItem = stockItems.find(item => 
      item.nombre.toLowerCase() === ordered.nombre.toLowerCase()
    );
    
    if (!dbItem) {
      missingItems.push({
        nombre: ordered.nombre,
        faltan: ordered.cantidad,
        unidad: ordered.unidad || 'unidad',
        motivo: 'Producto no registrado'
      });
      allInStock = false;
    } 
    else if (dbItem.stock < ordered.cantidad) {
      missingItems.push({
        nombre: dbItem.nombre,
        faltan: ordered.cantidad - dbItem.stock,
        unidad: dbItem.unidad,
        motivo: 'Stock insuficiente'
      });
      allInStock = false;
    }
  });

  // 4. Generar mensaje de respuesta
  let message = allInStock 
    ? '✅ Pedido confirmado. Todo en stock.' 
    : '⚠️ Faltantes:\n' + 
      missingItems.map(item => 
        `- ${item.nombre}: ${item.faltan} ${item.unidad} (${item.motivo})`
      ).join('\n');

  return { message, missingItems };
}