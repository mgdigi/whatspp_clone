export const userService = {
  async getAllUsers() {
    try {
      const response = await fetch('https://json-server-7n1p.onrender.com/users')
      return await response.json()
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
      return []
    }
  },

  async searchUsers(query) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/users?q=${encodeURIComponent(query)}`)
      return await response.json()
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error)
      return []
    }
  },

  async getUserById(id) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/users/${id}`)
      return await response.json()
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
      return null
    }
  },

  async getUsersByIds(ids) {
    try {
      const users = await this.getAllUsers()
      return users.filter(user => ids.includes(user.id))
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
      return []
    }
  }
}