import { useState } from "react";

function PedidoWhatsApp() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);

  const analizarPedido = async () => {
    try {
      const res = await fetch("http://localhost:5000/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto_original: texto }),
      });

      const data = await res.json();
      setResultado(data);
    } catch (err) {
      alert("Error al analizar el pedido");
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>Pedido desde WhatsApp</h3>
      <textarea
        rows="6"
        style={{ width: "100%" }}
        placeholder="Pegá el texto del pedido aquí..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      ></textarea>
      <button onClick={analizarPedido}>Analizar Pedido</button>

      {resultado && (
        <div style={{ marginTop: "20px" }}>
          <h4>Productos que faltan:</h4>
          {resultado.faltan.length === 0 ? (
            <p>¡Todo en stock!</p>
          ) : (
            <ul>
       {resultado.faltan.map((f, i) => (
  <li key={i}>
    {f.nombre}: falta {f.faltan.toFixed(2)} {f.unidad} ({f.motivo})
  </li>
))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default PedidoWhatsApp;
