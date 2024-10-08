import { store } from '../redux/store.js'
import { setAssistant, setThread, newPrompt, setHistoryPrompts } from '../redux/chat-slice.js'

class Assistants extends HTMLElement {

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.unsubscribe = null
    this.data = []
    this.assistants = []
  }

  connectedCallback () {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.chat.user) {
        this.assistants = currentState.chat.user.assistants
        this.loadData().then(() => this.render())
      }
    })
  }

  async loadData () {
    const url = `${import.meta.env.VITE_API_URL}/api/customer/assistants`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assistants: this.assistants })
      })
      
      this.data = await response.json()

    } catch (error) {
      console.log(error)
    }
  }

  render () {

    this.shadow.innerHTML =
    /*html*/`
      <style>

        *{
          box-sizing: border-box;
        }

        img{
          object-fit: cover;
          width: 100%;
        }

        .assistants{
          padding: 1rem;
        }

        .assistant{
          border: 1px solid hsla(210, 3%, 13%, 0);
          border-radius: 0.3rem;
          display: flex;
          gap: 0.5rem;
          padding: 0.3rem;
        }

        .assistant:hover{
          background-color: hsl(220, 4%, 13%);
          border: 1px solid hsla(210, 3%, 13%, 0.50);
          cursor: pointer;
        }

        .assistant-icon{
          align-items: center;
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          display: flex;
          height: 1.8rem;
          justify-content: center;
          overflow: hidden;
          width: 1.8rem;
        }

        .assistant-icon svg{
          width: 1.2rem;
        }

        .assistant-name{
          align-self: center;
          flex: 1;
        }

        .assistant-name span{
          color: hsl(0, 0%, 100%);
          font-family: 'SoehneBuch', sans-serif; 
          font-size: 0.8rem;
          font-weight: 600;
        }

        .assistant-start{
          align-self: center;
          position: relative;
        }

        .assistant-start svg{
          width: 1.2rem;
        }

        .assistant-start svg path{
          fill: hsl(0, 0%, 100%);
        }

        .assistant-start .tooltiptext {
          background-color: black;
          border-radius: 0.5rem;
          color: #fff;
          font-family: 'SoehneBuch', sans-serif;
          font-size: 0.8rem;
          margin-top: -0.5rem;
          margin-left: 3rem;
          opacity: 0;
          padding: 0.5rem 0;
          pointer-events: none; 
          position: absolute;
          text-align: center;
          transition: opacity 0.3s;
          visibility: hidden;
          width: 100px;
          z-index: 1001;
        }

        .assistant-start .tooltiptext::after {
          border-color: transparent #000000 transparent transparent;
          border-style: solid;
          border-width: 5px;
          content: " ";
          left: -10px;
          position: absolute;
          top: 35%;
        }

        .assistant-start:hover .tooltiptext {
          opacity: 1;
          visibility: visible;
        }
      </style>
    
      <section class="assistants"></section>
    `

    const assistants = this.shadow.querySelector('.assistants')

    this.data.forEach(assistant => {
      const assistantElement = document.createElement('div')
      assistantElement.classList.add('assistant')
      assistantElement.dataset.assistantId = assistant._id

      const assistantIcon = document.createElement('div')
      assistantIcon.classList.add('assistant-icon')

      const assistantImage = document.createElement('img')
      assistantImage.src = `${import.meta.env.VITE_API_URL}/api/customer/images/image/${assistant.images.xs.assistantAvatar.filename}`
      assistantImage.alt = assistant.images.thumbnail.assistantAvatar.alt
      assistantImage.title = assistant.images.thumbnail.assistantAvatar.title
      assistantIcon.appendChild(assistantImage)

      const assistantName = document.createElement('div')
      assistantName.classList.add('assistant-name')
      const name = document.createElement('span')
      name.textContent = assistant.name
      assistantName.appendChild(name)

      const assistantStart = document.createElement('div')
      assistantStart.classList.add('assistant-start')

      const assistantStartTooltip = document.createElement('span')
      assistantStartTooltip.classList.add('tooltiptext')
      assistantStartTooltip.innerHTML = 'Nuevo chat'
      assistantStart.appendChild(assistantStartTooltip)

      assistantElement.appendChild(assistantIcon)
      assistantElement.appendChild(assistantName)
      assistantElement.appendChild(assistantStart)
      assistants.appendChild(assistantElement)
    });

    this.shadow.querySelector('.assistants').addEventListener('click', (event) => {

      if (event.target.closest('.assistant')){

        const assistantElement = event.target.closest('.assistant')

        this.data.forEach(assistant => {
          if (assistant._id === assistantElement.dataset.assistantId) {
            store.dispatch(setAssistant(assistant))
          }
        })

        store.dispatch(setHistoryPrompts([]))
        store.dispatch(setThread(null))      
        store.dispatch(newPrompt(null))
      }
    })
  }
}

customElements.define('assistants-component', Assistants)