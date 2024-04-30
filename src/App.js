import React, { useEffect, useState } from 'react'
import './App.css'
import Inscription from './inscription/Inscription'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Connexion from './connexion/Connexion';
import User from './User'
import { AuthProvider } from './AuthContext';
import io from 'socket.io-client'

function App() {

  return (
    <div>
      <Router>
        <AuthProvider>
            <Routes>
            <Route path="/" element={<User />} />
            
              <Route path="/Inscription" element={<Inscription />} />
              <Route path="/Connexion" element={<Connexion />} />
            </Routes>
          </AuthProvider>
        </Router>
    </div>
  )
}

export default App