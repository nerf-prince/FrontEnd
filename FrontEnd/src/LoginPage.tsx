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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    
    try {
      // Fetch mock users
      const response = await fetch('/Mock/Users.json')
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      
      const users = await response.json()
      
      // Find user by username and password
      const user = users.find((u: any) => 
        u.username === username && u.password === password
      )
      
      if (user) {
        // Login successful
        console.log('Login successful:', { id: user.id, username: user.username, fullName: user.fullName })
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }))
        
        // Show success message and redirect
        alert(`Bine ai venit, ${user.fullName}!`)
        onNavigateToLanding()
      } else {
        setError('Nume utilizator sau parolă incorectă!')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Eroare la autentificare. Vă rugăm încercați din nou.')
    } finally {
      setLoading(false)
    }
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
            <p className="font-semibold mb-1">Utilizatori demo:</p>
            <p>• Username: <strong>test</strong> / Password: <strong>test123</strong></p>
            <p>• Username: <strong>student</strong> / Password: <strong>student123</strong></p>
          </div>
          
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SE CONECTEAZĂ...' : 'CONECTEAZĂ-TE'}
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

