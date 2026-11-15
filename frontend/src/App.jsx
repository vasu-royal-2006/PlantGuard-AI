import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Detect from './pages/Detect';
import CompareModels from './pages/CompareModels';
import AugmentationLab from './pages/AugmentationLab';
import Robustness from './pages/Robustness';
import Methodology from './pages/Methodology';
import Limitations from './pages/Limitations';
import Team from './pages/Team';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/compare" element={<CompareModels />} />
          <Route path="/augmentation-lab" element={<AugmentationLab />} />
          <Route path="/robustness" element={<Robustness />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/limitations" element={<Limitations />} />
          <Route path="/team" element={<Team />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
