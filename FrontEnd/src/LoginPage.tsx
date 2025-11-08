import { useState } from 'react'
import './LoginPage.css'

interface LoginPageProps {
  onNavigateBack: () => void
}

function LoginPage({ onNavigateBack }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')

  const handleLogin = () => {
    console.log('Login attempted with:', { username, email, password })
  }

  return (
    <div className="page-container">
      <button className="back-button" onClick={onNavigateBack}>
        INAPOI
      </button>

      <div className="central-card">
        <h1 className="title">SmartLearn</h1>

        <div className="input-container">
          <input
            type="text"
            placeholder="Nume utilizator"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>

        <button className="login-button" onClick={handleLogin}>
          CONECTEAZĂ-TE
        </button>
      </div>
    </div>
  )
}

export default LoginPage

