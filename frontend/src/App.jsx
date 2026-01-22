import { Routes, Route } from "react-router";
import Login from "../Components/Common_pages/Login.jsx";
import Signup from "../Components/Common_pages/Signup.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
