export const conversationService = {
  async getUserConversations(userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations?participants_like=${userId}&_sort=lastMessageTime&_order=desc`)
      return await response.json()
    } catch (error) {
      console.error('Erreur récupération conversations:', error)
      return []
    }
  },

  async createDirectConversation(userId1, userId2) {
    try {
      const existing = await this.findDirectConversation(userId1, userId2)
      if (existing) return existing

      const conversation = {
        type: 'direct',
        participants: [userId1, userId2],
        name: null,
        avatar: null,
        isPinned: false,
        isArchived: false,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString()
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation)
      })

      return await response.json()
    } catch (error) {
      console.error('Erreur création conversation:', error)
      throw error
    }
  },

  async findDirectConversation(userId1, userId2) {
    try {
      const response = await fetch('https://json-server-7n1p.onrender.com/conversations')
      const conversations = await response.json()
      
      return conversations.find(conv => 
        conv.type === 'direct' && 
        conv.participants.includes(userId1) && 
        conv.participants.includes(userId2)
      )
    } catch (error) {
      console.error('Erreur recherche conversation:', error)
      return null
    }
  },

  async createGroup(name, participants, createdBy, avatar = null) {
    try {
      const group = {
        type: 'group',
        participants,
        name,
        avatar,
        isPinned: false,
        isArchived: false,
        lastMessage: 'Groupe créé',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        createdBy,
        admins: [createdBy]
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
      })

      return await response.json()
    } catch (error) {
      console.error('Erreur création groupe:', error)
      throw error
    }
  },

  async deleteGroup(groupId, userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${groupId}`)
      const group = await response.json()
      
      if (!group.admins.includes(userId)) {
        throw new Error('Seuls les administrateurs peuvent supprimer le groupe')
      }

      const messagesResponse = await fetch(`https://json-server-7n1p.onrender.com/messages?conversationId=${groupId}`)
      const messages = await messagesResponse.json()
      
      for (const message of messages) {
        await fetch(`https://json-server-7n1p.onrender.com/messages/${message.id}`, {
          method: 'DELETE'
        })
      }

      await fetch(`https://json-server-7n1p.onrender.com/conversations/${groupId}`, {
        method: 'DELETE'
      })

      return true
    } catch (error) {
      console.error('Erreur suppression groupe:', error)
      throw error
    }
  },

  async togglePin(conversationId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await response.json()
      
      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          isPinned: !conversation.isPinned
        })
      })

      return !conversation.isPinned
    } catch (error) {
      console.error('Erreur épinglage:', error)
      throw error
    }
  },

  async toggleArchive(conversationId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await response.json()
      
      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          isArchived: !conversation.isArchived
        })
      })

      return !conversation.isArchived
    } catch (error) {
      console.error('Erreur archivage:', error)
      throw error
    }
  },

  async updateLastMessage(conversationId, message) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await response.json()
      
      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          lastMessage: message.text,
          lastMessageTime: message.timestamp
        })
      })
    } catch (error) {
      console.error('Erreur mise à jour dernier message:', error)
    }
  }
}