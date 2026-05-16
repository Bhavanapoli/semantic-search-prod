// import { createContext, useContext, useState, useCallback } from 'react'
// import api from '../services/api'

// const AuthContext = createContext(null)

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     try {
//       const stored = localStorage.getItem('user')
//       return stored ? JSON.parse(stored) : null
//     } catch { return null }
//   })

//   const login = useCallback(async (email, password) => {
//     const { data } = await api.post('api/auth/login', { email, password })
//     localStorage.setItem('access_token', data.access_token)
//     localStorage.setItem('refresh_token', data.refresh_token)
//     localStorage.setItem('user', JSON.stringify(data.user))
//     setUser(data.user)
//     return data.user
//   }, [])

//   const register = useCallback(async (username, email, password) => {
//     const { data } = await api.post('/api/auth/register', { username, email, password })
//     localStorage.setItem('access_token', data.access_token)
//     localStorage.setItem('refresh_token', data.refresh_token)
//     localStorage.setItem('user', JSON.stringify(data.user))
//     setUser(data.user)
//     return data.user
//   }, [])

//   const logout = useCallback(async () => {
//     try { await api.post('api/auth/logout') } catch {}
//     localStorage.removeItem('access_token')
//     localStorage.removeItem('refresh_token')
//     localStorage.removeItem('user')
//     setUser(null)
//   }, [])

//   const refreshUser = useCallback(async () => {
//     try {
//       const { data } = await api.get('/auth/me')
//       localStorage.setItem('user', JSON.stringify(data))
//       setUser(data)
//     } catch {}
//   }, [])

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider')
//   return ctx
// }



import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // =========================
  // LOGIN
  // =========================

  const login = useCallback(async (email, password) => {

    const { data } = await api.post('/auth/login', {
      email,
      password,
    })

    localStorage.setItem(
      'access_token',
      data.access_token
    )

    localStorage.setItem(
      'refresh_token',
      data.refresh_token
    )

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    )

    setUser(data.user)

    return data.user

  }, [])

  // =========================
  // REGISTER
  // =========================

  const register = useCallback(async (
    username,
    email,
    password
  ) => {

    const { data } = await api.post('/auth/register', {
      username,
      email,
      password,
    })

    localStorage.setItem(
      'access_token',
      data.access_token
    )

    localStorage.setItem(
      'refresh_token',
      data.refresh_token
    )

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    )

    setUser(data.user)

    return data.user

  }, [])

  // =========================
  // LOGOUT
  // =========================

  const logout = useCallback(async () => {

    try {
      await api.post('/auth/logout')
    } catch {}

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    setUser(null)

  }, [])

  // =========================
  // REFRESH USER
  // =========================

  const refreshUser = useCallback(async () => {

    try {

      const { data } = await api.get('/auth/me')

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      )

      setUser(data)

    } catch (err) {
      console.error(err)
    }

  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {

  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      'useAuth must be inside AuthProvider'
    )
  }

  return ctx
}