import { state, setState } from '../utils/state.js'
import { statusService } from '../services/statusService.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'

export const createStatusList = async (container, rerender) => {
  const allStatuses = await statusService.getAllActiveStatuses()
  const myStatuses = await statusService.getUserStatuses(state.currentUser.id)
  
  setState({ ...state, allStatuses, myStatuses })

  const render = () => {
    container.innerHTML = `
      <div class="h-full bg-whatsapp-bg-chat overflow-y-auto">
        <!-- Header -->
        <div class="p-4 bg-whatsapp-bg-light border-b border-whatsapp-bg-dark">
          <h2 class="text-xl font-semibold text-whatsapp-text-light">Statuts</h2>
        </div>

        <!-- Mon statut -->
        <div class="p-4 border-b border-whatsapp-bg-dark">
          <h3 class="text-sm font-medium text-whatsapp-text-secondary mb-3">Mon statut</h3>
          
          <div class="flex items-center gap-3">
            <div class="relative">
              <img 
                src="${state.currentUser.avatar || avatarService.getAvatar(state.currentUser.id)}" 
                alt="${state.currentUser.username}" 
                class="w-14 h-14 rounded-full object-cover border-2 ${myStatuses.length > 0 ? 'border-whatsapp-green' : 'border-whatsapp-bg-dark'}"
              >
              <button 
                id="add-status-btn" 
                class="absolute -bottom-1 -right-1 w-6 h-6 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-sm hover:bg-whatsapp-dark-green transition-colors"
              >
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
            
            <div class="flex-1 cursor-pointer" id="my-status-info">
              <h4 class="font-medium text-whatsapp-text-light">Mon statut</h4>
              <p class="text-sm text-whatsapp-text-secondary">
                ${myStatuses.length > 0 
                  ? `${myStatuses.length} mise${myStatuses.length > 1 ? 's' : ''} à jour • ${statusService.formatTimeRemaining(myStatuses[0].expiresAt)}`
                  : 'Appuyez pour ajouter une mise à jour de statut'
                }
              </p>
            </div>
          </div>
        </div>

        <!-- Statuts récents -->
        <div class="p-4">
          <h3 class="text-sm font-medium text-whatsapp-text-secondary mb-3">Mises à jour récentes</h3>
          
          <div class="space-y-3">
            ${Object.keys(allStatuses).filter(userId => parseInt(userId) !== state.currentUser.id).map(userId => {
              const userStatuses = allStatuses[userId]
              const user = state.users.find(u => u.id === parseInt(userId))
              const latestStatus = userStatuses[0]
              const hasUnviewed = userStatuses.some(status => 
                !status.views.some(view => view.userId === state.currentUser.id)
              )
              
              if (!user) return ''
              
              return `
                <div class="flex items-center gap-3 cursor-pointer hover:bg-whatsapp-bg-light rounded-lg p-2 transition-colors status-item" 
                     data-user-id="${userId}">
                  <div class="relative">
                    <img 
                      src="${user.avatar || avatarService.getAvatar(user.id)}" 
                      alt="${user.username}" 
                      class="w-14 h-14 rounded-full object-cover border-2 ${hasUnviewed ? 'border-whatsapp-green' : 'border-gray-500'}"
                    >
                    ${hasUnviewed ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-whatsapp-green rounded-full"></div>' : ''}
                  </div>
                  
                  <div class="flex-1">
                    <h4 class="font-medium text-whatsapp-text-light">${user.username}</h4>
                    <p class="text-sm text-whatsapp-text-secondary">
                      ${formatTime(latestStatus.timestamp)} • ${statusService.formatTimeRemaining(latestStatus.expiresAt)}
                    </p>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>
    `

    setupStatusEvents(rerender)
  }

  const setupStatusEvents = (rerender) => {
    const addStatusBtn = container.querySelector('#add-status-btn')
    if (addStatusBtn) {
      addStatusBtn.addEventListener('click', () => {
        setState({ ...state, showStatusForm: true })
        rerender()
      })
    }

    const myStatusInfo = container.querySelector('#my-status-info')
    if (myStatusInfo && myStatuses.length > 0) {
      myStatusInfo.addEventListener('click', () => {
        setState({ 
          ...state, 
          selectedStatusUserId: state.currentUser.id,
          showStatusViewer: true 
        })
        rerender()
      })
    }

    const statusItems = container.querySelectorAll('.status-item')
    statusItems.forEach(item => {
      item.addEventListener('click', () => {
        const userId = parseInt(item.dataset.userId)
        setState({ 
          ...state, 
          selectedStatusUserId: userId,
          showStatusViewer: true 
        })
        rerender()
      })
    })
  }

  render()
}
