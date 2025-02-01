/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './Login.jsx';
import Tasks from './components/Tasks.jsx';
import NuevaTarea from './components/NuevaTarea.jsx';
import NuevaCategoria from './components/NuevaCategoria.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/" element={<LoginForm />} />
        <Route path="/nuevaTarea" element={<NuevaTarea />} />
        <Route path="/nuevaCategoria" element={<NuevaCategoria />} />
      </Routes>
    </Router>
  );
}

export default App;