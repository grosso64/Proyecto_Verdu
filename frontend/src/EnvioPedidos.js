function extractProductsFromText(text) {
  const productos = [];
  // Ejemplo de texto: "2 kg de tomate, 3 lechugas, 1 caja de manzanas"
  const items = text.split(',').map(item => item.trim().toLowerCase());
  
  items.forEach(item => {
    const regex = /(\d+\.?\d*)\s*(kg|kilos?|unidades?|cajas?)?\s*(?:de\s+)?([a-záéíóúñ\s]+)/i;
    const match = item.match(regex);
    
    if (match) {
      productos.push({
        nombre: match[3].trim(),
        cantidad: parseFloat(match[1]),
        unidad: match[2] || 'unidad'
      });
    }
  });
  
  return productos;
}