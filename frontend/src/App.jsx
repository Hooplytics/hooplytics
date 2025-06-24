import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import './App.css'

import { HomePage } from './components/HomePage'
import { ProfilePage } from './components/ProfilePage'
import { AuthenticationPage } from './components/AuthenticationPage'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/authentication" element={<AuthenticationPage />} />
      </Routes>
    </div>
  )
}

export default App
