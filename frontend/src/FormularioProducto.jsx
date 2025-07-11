import { useState } from "react";

function FormularioProducto({ onProductoAgregado }) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [stock, setStock] = useState("");

  const manejarEnvio = async (e) => {
    e.preventDefault();

    const nuevoProducto = { nombre, unidad, stock: parseFloat(stock) };

    try {
      const res = await fetch("http://localhost:5000/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });

      const data = await res.json();
      if (data.id) {
        alert("Producto agregado");
        setNombre("");
        setUnidad("kg");
        setStock("");
        onProductoAgregado(); // actualiza la tabla
      } else {
        alert("Error al agregar");
      }
    } catch (err) {
      console.error("Error al enviar producto:", err);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <form onSubmit={manejarEnvio} style={{ marginBottom: "20px" }}>
      <h3>Agregar nuevo producto</h3>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
        <option value="kg">kg</option>
        <option value="unidad">unidad</option>
        <option value="atado">atado</option>
        <option value="caja">caja</option>
      </select>
      <input
        type="number"
        step="0.1"
        placeholder="Stock"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        required
      />
      <button type="submit">Cargar</button>
    </form>
  );
}

export default FormularioProducto;
