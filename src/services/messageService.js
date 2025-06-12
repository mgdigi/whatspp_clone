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

  // Envoyer un message
  async sendMessage(conversationId, senderId, text) {
    try {
      const message = {
        conversationId,
        senderId,
        text,
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: [senderId], // L'expéditeur a "lu" son propre message
        isDeleted: false
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

      const savedMessage = await response.json()
      
      // Mettre à jour la conversation
      await conversationService.updateLastMessage(conversationId, savedMessage)
      
      return savedMessage
    } catch (error) {
      console.error('Erreur envoi message:', error)
      throw error
    }
  },

  // Marquer un message comme lu
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
            isRead: updatedReadBy.length > 1 // Lu si plus d'une personne l'a lu
          })
        })
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    }
  },

  // Marquer tous les messages d'une conversation comme lus
  async markConversationAsRead(conversationId, userId) {
    try {
      const messages = await this.getConversationMessages(conversationId)
      
      for (const message of messages) {
        if (message.senderId !== userId && !message.readBy.includes(userId)) {
          await this.markAsRead(message.id, userId)
        }
      }

      // Réinitialiser le compteur de messages non lus
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

  // Supprimer un message
  async deleteMessage(messageId, userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/messages/${messageId}`)
      const message = await response.json()
      
      // Vérifier que l'utilisateur peut supprimer ce message
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