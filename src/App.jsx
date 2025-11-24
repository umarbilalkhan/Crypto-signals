import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import IndicatorsPage from './pages/IndicatorsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicators" element={<IndicatorsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
