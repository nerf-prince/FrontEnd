import { useState } from 'react'
import Header from './Header'

interface LoginPageProps {
  onNavigateBack: () => void
  onNavigateToRegister: () => void
  onNavigateToLanding: () => void
}

function LoginPage({ onNavigateBack, onNavigateToRegister, onNavigateToLanding }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')

  const handleLogin = () => {
    console.log('Login attempted with:', { username, email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header showBackButton onNavigateBack={onNavigateBack} onNavigateToLanding={onNavigateToLanding} />

      {/* Login Card - Centered */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-md p-8 lg:p-10 transform transition-transform duration-300">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          InfoBac
        </h1>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nume utilizator
            </label>
            <input
              id="username"
              type="text"
              placeholder="Introdu numele de utilizator"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="exemplu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder:text-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform transition-all duration-400"
          >
            CONECTEAZĂ-TE
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Nu ai cont?{' '}
          <button 
            onClick={onNavigateToRegister}
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Înregistrează-te
          </button>
        </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

