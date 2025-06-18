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
          lastMessageTime: message.timestamp,
          unreadCount: conversation.unreadCount + 1
        })
      })
    } catch (error) {
      console.error('Erreur mise à jour dernier message:', error)
    }
  },

  async markConversationAsRead(conversationId, userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`)
      const conversation = await response.json()

      if (!conversation.participants.includes(userId)) {
        throw new Error('Vous n\'êtes pas autorisé à marquer cette conversation comme lue')
      }

      await fetch(`https://json-server-7n1p.onrender.com/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          unreadCount: 0
        })
      })
    } catch (error) {
      console.error('Erreur marquer conversation comme lue:', error)
      throw error
    }
  },

  async getUnreadConversations(userId) {
    try {
      const response = await fetch(`https://json-server-7n1p.onrender.com/conversations?unreadCount_gt=0&participants_contains=${userId}`)
      return await response.json()
    } catch (error) {
      console.error('Erreur récupération conversations non lues:', error)
      return []
    }
  }
    
}

export const audioService = {
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
  stream: null,

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      })

      this.audioChunks = []
      this.isRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(100) 
      return true

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error)
      throw new Error('Impossible d\'accéder au microphone')
    }
  },

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Aucun enregistrement en cours'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.getSupportedMimeType() 
        })
        
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop())
        }

        this.isRecording = false
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  },

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
      }
      this.isRecording = false
      this.audioChunks = []
    }
  },

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return 'audio/webm'
  },

  async saveAudioMessage(audioBlob, conversationId, senderId) {
    try {
      const timestamp = Date.now()
      const fileName = `voice_${conversationId}_${senderId}_${timestamp}.webm`
      
      const base64Audio = await this.blobToBase64(audioBlob)
      
      const duration = await this.getAudioDuration(audioBlob)

      return {
        fileName,
        base64Audio,
        duration,
        size: audioBlob.size
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde audio:', error)
      throw error
    }
  },

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  },

  async getAudioDuration(audioBlob) {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
      }
      audio.onerror = () => resolve(0)
      audio.src = URL.createObjectURL(audioBlob)
    })
  },

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}


 