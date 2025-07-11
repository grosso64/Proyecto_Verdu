import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: usuario, clave }),
      });

      const data = await respuesta.json();

      if (data.acceso) {
        onLogin();
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
      console.error(error);
    }

    setCargando(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={manejarEnvio} className="login-form">
        <h2>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
        <button type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default Login;
