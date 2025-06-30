import { useState } from "react";
import Login from "./Login";

function App() {
  const [logueado, setLogueado] = useState(false);

  return (
    <div>
      {logueado ? (
        <h1>Bienvenido al sistema de la verdulería 🍎</h1>
      ) : (
        <Login onLogin={() => setLogueado(true)} />
      )}
    </div>
  );
}

export default App;
