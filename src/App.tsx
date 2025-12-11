import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

// 简化App组件，专注于路由配置
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
