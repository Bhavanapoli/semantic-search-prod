// import axios from 'axios'

// const API_BASE = import.meta.env.VITE_API_URL || '/api'

// const api = axios.create({
//   baseURL: API_BASE,
//   headers: { 'Content-Type': 'application/json' },
//   timeout: 30000,
// })

// // Attach access token
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('access_token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
  
//   // Don't set Content-Type for FormData - let axios handle it with proper boundary
//   if (config.data instanceof FormData) {
//     delete config.headers['Content-Type']
//   }
  
//   return config
// })

// // Auto-refresh on 401
// let isRefreshing = false
// let failedQueue = []

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
//   failedQueue = []
// }

// api.interceptors.response.use(
//   r => r,
//   async error => {
//     const original = error.config
//     if (error.response?.status === 401 && !original._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject })
//         }).then(token => {
//           original.headers.Authorization = `Bearer ${token}`
//           return api(original)
//         })
//       }
//       original._retry = true
//       isRefreshing = true
//       try {
//         const refresh = localStorage.getItem('refresh_token')
//         const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh })
//         localStorage.setItem('access_token', data.access_token)
//         api.defaults.headers.Authorization = `Bearer ${data.access_token}`
//         processQueue(null, data.access_token)
//         original.headers.Authorization = `Bearer ${data.access_token}`
//         return api(original)
//       } catch (err) {
//         processQueue(err, null)
//         localStorage.clear()
//         window.location.href = '/login'
//         return Promise.reject(err)
//       } finally {
//         isRefreshing = false
//       }
//     }
//     return Promise.reject(error)
//   }
// )

// export default api



import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://semantic-backend-w3rp.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let browser handle multipart/form-data boundaries
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// ===============================
// AUTO REFRESH TOKEN
// ===============================

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')

        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {
            refresh_token: refreshToken,
          }
        )

        localStorage.setItem(
          'access_token',
          data.access_token
        )

        processQueue(null, data.access_token)

        originalRequest.headers.Authorization =
          `Bearer ${data.access_token}`

        return api(originalRequest)

      } catch (err) {

        processQueue(err, null)

        localStorage.clear()

        window.location.href = '/login'

        return Promise.reject(err)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api