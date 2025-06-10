const API_BASE_URL = 'https://json-server-7n1p.onrender.com'

// Service générique pour les appels API
const createApiService = (endpoint) => ({
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      return []
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${endpoint} ${id}:`, error)
      return null
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error creating ${endpoint}:`, error)
      throw error
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error updating ${endpoint} ${id}:`, error)
      throw error
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return true
    } catch (error) {
      console.error(`Error deleting ${endpoint} ${id}:`, error)
      throw error
    }
  }
})

// Services spécialisés
export const contactsService = createApiService('contacts')

export const messagesService = {
  ...createApiService('messages'),
  
  async getByContactId(contactId) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages?contactId=${contactId}&_sort=timestamp&_order=asc`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching messages for contact ${contactId}:`, error)
      return []
    }
  }
}