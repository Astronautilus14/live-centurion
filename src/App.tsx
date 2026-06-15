import { BrowserRouter, Routes, Route } from "react-router-dom";
import DJ from "./pages/DJ/DJ";
import Audiance from "./pages/audiance/Audiance";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DJ />} />
        <Route path="/audiance" element={<Audiance />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
