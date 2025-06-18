import { conversationService } from './conversationService.js'

export const messageService = {
  async getConversationMessages(conversationId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/messages?conversationId=${conversationId}&_sort=timestamp&_order=asc`)
      return await response.json()
    } catch (error) {
      console.error('Erreur récupération messages:', error)
      return []
    }
  },

  
  async sendMessage(conversationId, senderId, text) {
    try {
      const message = {
        conversationId,
        senderId,
        text,
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: [senderId], 
        isDeleted: false
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

      const savedMessage = await response.json()
      
      await conversationService.updateLastMessage(conversationId, savedMessage)
      
       await this.updateConversationAfterMessage(conversationId, savedMessage, senderId)
      
      return savedMessage
    } catch (error) {
      console.error('Erreur envoi message:', error)
      throw error
    }
  },

  async updateConversationAfterMessage(conversationId, message, senderId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await response.json()
      
      let newUnreadCount = conversation.unreadCount || 0
      
      if (conversation.type === 'direct') {
        const otherParticipant = conversation.participants.find(id => id !== senderId)
        if (otherParticipant) {
          newUnreadCount = (conversation.unreadCount || 0) + 1
        }
      } else if (conversation.type === 'group') {
        const otherParticipants = conversation.participants.filter(id => id !== senderId)
        newUnreadCount = otherParticipants.length
      }

      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          lastMessage: message.text,
          lastMessageTime: message.timestamp,
          unreadCount: newUnreadCount,
          lastSenderId: senderId 
        })
      })
    } catch (error) {
      console.error('Erreur mise à jour conversation:', error)
    }
  },

  async markAsRead(messageId, userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/messages/${messageId}`)
      const message = await response.json()
      
      if (!message.readBy.includes(userId)) {
        const updatedReadBy = [...message.readBy, userId]
        
        await fetch(`https://json-server-7n1p.onrender.com/messages/${messageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...message,
            readBy: updatedReadBy,
            isRead: updatedReadBy.length > 1 
          })
        })
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    }
  },

  async markConversationAsRead(conversationId, userId) {
    try {
      const messages = await this.getConversationMessages(conversationId)
      
      for (const message of messages) {
        if (message.senderId !== userId && !message.readBy.includes(userId)) {
          await this.markAsRead(message.id, userId)
        }
      }

      const convResponse = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await convResponse.json()
      
      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          unreadCount: 0
        })
      })
    } catch (error) {
      console.error('Erreur marquage conversation lue:', error)
    }
  },

  async deleteMessage(messageId, userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/messages/${messageId}`)
      const message = await response.json()
      
      if (message.senderId !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres messages')
      }

      await fetch(`https://json-server-7n1p.onrender.com/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          isDeleted: true,
          text: 'Ce message a été supprimé'
        })
      })

      return true
    } catch (error) {
      console.error('Erreur suppression message:', error)
      throw error
    }
  }
}