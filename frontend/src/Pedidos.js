const db = require('./db'); // Tu conexión a la base de datos

module.exports = {
  analizarPedido: async (texto) => {
    // Ejemplo: "2kg tomate, 3 lechugas"
    const productos = texto.split(',').map(item => {
      const match = item.trim().match(/(\d+)\s*(\w+)?\s*(?:de\s+)?(\w+)/i);
      return match && {
        cantidad: parseFloat(match[1]),
        unidad: match[2] || 'unidad',
        nombre: match[3].toLowerCase()
      };
    }).filter(Boolean);

    // Consultar stock
    const faltantes = [];
    for (const producto of productos) {
      const enStock = await db.query(
        'SELECT stock FROM productos WHERE nombre LIKE ?',
        [`%${producto.nombre}%`]
      );
      
      if (!enStock.length) {
        faltantes.push({...producto, motivo: 'No existe en inventario'});
      } else if (enStock[0].stock < producto.cantidad) {
        faltantes.push({
          ...producto,
          faltan: producto.cantidad - enStock[0].stock,
          motivo: 'Stock insuficiente'
        });
      }
    }

    return {
      productos,
      faltantes,
      todoEnStock: faltantes.length === 0
    };
  }
};