export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier'
  }
  
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (date > weekAgo) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  }
  
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

export const generateId = () => {
  return Date.now() + Math.random()
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const formatPhoneNumber = (phone) => {
  return phone.replace(/(\+221)(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6')
}

export const validatePhone = (phone) => {
  const phoneRegex = /^\+221\s?[6-7]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/
  return phoneRegex.test(phone)
}

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const formatDate = (date) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  return new Date(date).toLocaleDateString('fr-FR', options)
}
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm) return text
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<span class="bg-yellow-200">$1</span>')
}