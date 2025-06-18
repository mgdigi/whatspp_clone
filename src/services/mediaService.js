export const mediaService = {
  validateMediaFile(file) {
    const errors = []
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
    
    if (!file) {
      errors.push('Aucun fichier sélectionné')
      return { isValid: false, errors }
    }

    if (file.size > maxSize) {
      errors.push('Le fichier est trop volumineux (maximum 50MB)')
    }

    const isImage = allowedImageTypes.includes(file.type)
    const isVideo = allowedVideoTypes.includes(file.type)

    if (!isImage && !isVideo) {
      errors.push('Format de fichier non supporté. Formats acceptés: JPG, PNG, GIF, WebP, MP4, WebM, OGG, AVI, MOV')
    }

    return {
      isValid: errors.length === 0,
      errors,
      type: isImage ? 'image' : 'video'
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  createVideoThumbnail(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.onloadedmetadata = () => {
        canvas.width = 300
        canvas.height = (video.videoHeight / video.videoWidth) * 300
        
        video.currentTime = 1 
      }
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
        resolve(thumbnail)
      }
      
      video.onerror = () => resolve(null)
      
      video.src = URL.createObjectURL(file)
    })
  },

  getVideoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration))
      }
      
      video.onerror = () => resolve(0)
      
      video.src = URL.createObjectURL(file)
    })
  },

  resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  },

  async saveMedia(file, conversationId, senderId) {
    try {
      const validation = this.validateMediaFile(file)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      const timestamp = Date.now()
      const fileName = `${validation.type}_${conversationId}_${senderId}_${timestamp}`
      
      let processedFile = file
      let thumbnail = null
      let duration = null

      if (validation.type === 'image') {
        if (file.size > 2 * 1024 * 1024) { 
          processedFile = await this.resizeImage(file)
        }
      } else if (validation.type === 'video') {
        thumbnail = await this.createVideoThumbnail(file)
        duration = await this.getVideoDuration(file)
      }

      const base64Data = await this.fileToBase64(processedFile)

      return {
        fileName,
        base64Data,
        thumbnail,
        duration,
        size: processedFile.size,
        type: validation.type,
        originalName: file.name,
        mimeType: file.type
      }
    } catch (error) {
      console.error('Erreur sauvegarde média:', error)
      throw error
    }
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}
