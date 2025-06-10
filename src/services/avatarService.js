// Service pour la gestion des avatars
export const avatarService = {
  async saveAvatar(file, contactId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          img.onload = () => {
            const size = 150
            canvas.width = size
            canvas.height = size
            
            const minDim = Math.min(img.width, img.height)
            const startX = (img.width - minDim) / 2
            const startY = (img.height - minDim) / 2
            
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size)
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            
            const avatarKey = `avatar_${contactId}`
            localStorage.setItem(avatarKey, dataUrl)
            
            resolve(`/avatars/${contactId}.jpg`)
          }
          
          img.onerror = () => reject(new Error('Erreur lors du traitement de l\'image'))
          img.src = e.target.result
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
      reader.readAsDataURL(file)
    })
  },

  getAvatar(contactId) {
    const avatarKey = `avatar_${contactId}`
    const storedAvatar = localStorage.getItem(avatarKey)
    
    if (storedAvatar) {
      return storedAvatar
    }
    
    return this.getDefaultAvatar()
  },

  getDefaultAvatar() {
    return this.generateDefaultAvatar('?')
  },

  generateDefaultAvatar(initials, backgroundColor = '#25D366') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 150
    
    canvas.width = size
    canvas.height = size
    
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, size, size)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 60px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials.toUpperCase(), size / 2, size / 2)
    
    return canvas.toDataURL('image/jpeg', 0.8)
  },

  deleteAvatar(contactId) {
    const avatarKey = `avatar_${contactId}`
    localStorage.removeItem(avatarKey)
  },

  validateImageFile(file) {
    const errors = []
    
    if (!file.type.startsWith('image/')) {
      errors.push('Le fichier doit être une image')
    }
    
    if (file.size > 5 * 1024 * 1024) {
      errors.push('La taille du fichier ne doit pas dépasser 5MB')
    }
    
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!supportedFormats.includes(file.type)) {
      errors.push('Format non supporté. Utilisez JPG, PNG, GIF ou WebP')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}