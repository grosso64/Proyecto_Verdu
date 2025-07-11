import { useEffect, useState } from "react";
import FormularioProducto from "./FormularioProducto";
import PedidoWhatsApp from "./PedidoWhatsApp";

function Productos() {
  const [productos, setProductos] = useState([]);

  const cargarProductos = () => {
    fetch("http://localhost:5000/productos")
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((err) => console.error("Error al cargar productos:", err));
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Stock de productos</h2>
      <FormularioProducto onProductoAgregado={cargarProductos} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.nombre}</td>
              <td>{prod.unidad}</td>
              <td>{prod.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 👇 Acá sí se renderiza el formulario de pedido */}
      <PedidoWhatsApp />
    </div>
  );
}

export default Productos;