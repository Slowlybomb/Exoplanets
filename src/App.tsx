import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Overview from "./pages/Overview";
import Gallery from "./pages/Gallery";
import OrbitLab from "./pages/OrbitLab";
import Analytics from "./pages/Analytics";
import PlanetDetail from "./pages/PlanetDetail";
import Compare from "./pages/Compare";
import StarMap from "./pages/StarMap";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/orbit" element={<OrbitLab />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/planet/:name" element={<PlanetDetail />} />
            <Route path="/starmap" element={<StarMap />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
