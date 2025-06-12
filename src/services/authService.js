
const BASE_URL_USERS = 'https://json-server-7n1p.onrender.com/users'

export const authService = {
  async login(username, password) {
    try {
      const response = await fetch(BASE_URL_USERS)
      const users = await response.json()
      
      const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
      )
      
      if (user) {
        await this.updateUserStatus(user.id, true)
        
        localStorage.setItem('currentUser', JSON.stringify(user))
        return { success: true, user }
      }
      
      return { success: false, error: 'Identifiants incorrects' }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  },

  async logout() {
    const currentUser = this.getCurrentUser()
    if (currentUser) {
      await this.updateUserStatus(currentUser.id, false)
    }
    localStorage.removeItem('currentUser')
  },

  getCurrentUser() {
    const userData = localStorage.getItem('currentUser')
    return userData ? JSON.parse(userData) : null
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null
  },

  async updateUserStatus(userId, isOnline) {
    try {
      const response = await fetch(`BASE_URL_USERS/${userId}`)
      const user = await response.json()
      
      await fetch(`BASE_URL_USERS/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          isOnline,
          lastSeen: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
    }
  },

  async register(userData) {
    try {
      const response = await fetch('BASE_URL_USERS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          isOnline: true,
          lastSeen: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const newUser = await response.json()
        localStorage.setItem('currentUser', JSON.stringify(newUser))
        return { success: true, user: newUser }
      }
      
      return { success: false, error: 'Erreur lors de l\'inscription' }
    } catch (error) {
      console.error('Erreur inscription:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }
}