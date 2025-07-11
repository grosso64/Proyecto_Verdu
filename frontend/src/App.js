import { useState } from "react";
import Login from "./Login";
import Productos from "./Productos";

function App() {
  const [logueado, setLogueado] = useState(false);

  return (
    <div>
      {logueado ? <Productos /> : <Login onLogin={() => setLogueado(true)} />}
    </div>
  );
}

export default App;
