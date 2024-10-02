import isEqual from 'lodash-es/isEqual'
import { store } from '../redux/store.js'
import { setResponseState, setThread, setImages } from '../redux/chat-slice.js'

class Chat extends HTMLElement {

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.socket = new WebSocket(import.meta.env.VITE_WS_URL);
    this.unsubscribe = null
    this.user = null
    this.assistant = null
    this.lastPrompt = null
    this.scroll = false
    this.stopWriting = false
    this.threadId = null
  }

  connectedCallback () {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.chat.user && !isEqual(this.user, currentState.chat.user)) {
        this.user = currentState.chat.user
      }

      if (currentState.chat.assistant && !isEqual(this.assistant, currentState.chat.assistant)) {
        this.assistant = currentState.chat.assistant
        this.render()
      }

      if (currentState.chat.threadId && !isEqual(this.threadId, currentState.chat.threadId)) {
        this.threadId = currentState.chat.threadId
      }

      if (currentState.chat.prompt && !isEqual(this.lastPrompt, currentState.chat.prompt)) {
        if(!this.lastPrompt){
          this.shadow.querySelector('.chat').classList.add('active');
        }

        this.lastPrompt = currentState.chat.prompt
        this.createUserMessage(currentState.chat.prompt)
        this.createAssistantResponse(currentState.chat.prompt)
      }
    })

    this.socket.addEventListener('message', event => {
      
      const { channel, data } = JSON.parse(event.data);

      if (channel === 'responseState') {
        this.updateState(data);
      }
    });

    this.render()
  }

  render () {

    this.shadow.innerHTML =
      /*html*/`
      <style>
        :host{
          width: 100%;
        }

        *{
          box-sizing: border-box;
        }

        img{
          cursor: pointer;
          object-fit: cover;
          width: 100%;
        }

        .chat{
          display: none;
        }

        .chat.active{
          align-items: flex-start;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          justify-content: flex-start;
          min-height: 90vh;
          max-height: 90vh;
          overflow-y: scroll;
          padding: 0 1rem;
          position: relative;
        }

        .chat.active::-webkit-scrollbar {
          display: none;
        }

        .prompt{ 
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .prompt:first-child{
          margin-top: 5rem;
        }

        .prompt:last-child{
          margin-bottom: 3rem;
        }

        .contents{
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .message{
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .message h3{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 0.9rem;
          margin: 0;
        }

        .message h4{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
        }

        .message p{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 1rem;
          margin: 0;
        }

        .message a, .message a:visited{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 1rem;
          margin-left: 0.5rem;
          text-decoration: underline;
        }

        .message ol, .message ul{
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 0;
        }

        .message li{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 1rem;
          margin-left: 1rem;
        }

        .message .images{
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          margin: 1rem 0;
        }

        .message .images img{
          width: 150px;
        }

        .state {
          align-items: center;
          display: flex;
          gap: 0.5rem;
        }

        .state-bubble{
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          height: 1rem;
          width: 1rem;
        }

        .state-bubble.active{
          animation: pulse 1s infinite;
        }

        .state-message{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 0.9rem;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.8);
          }
        }

        .avatar{
          align-items: center;
          border: 1px solid hsl(0, 0%, 40%);
          border-radius: 50%;
          display: flex;
          height: 1.5rem;
          justify-content: center;
          min-width: 1.5rem;
          overflow: hidden;
          width: 1.5rem;
        }

        .avatar img{
          width: 100%;
        }

        .to-bottom{
          align-items: center;
          background-color: hsl(235, 7%, 31%, 0.5);
          border-radius: 50%;
          bottom: 1rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          height: 2rem;
          left: calc(50% - 1rem);
          padding: 0.2rem;
          position: absolute;
          visibility: hidden;
          width: 2rem;
          z-index: 1000;
        }

        .to-bottom.active{
          visibility: visible;
        }

        .to-bottom svg{
          height: 1.5rem;
          width: 1.5rem;
        }

        .to-bottom svg path{
          fill: hsl(0, 0%, 100%);
        }

        @media (max-width: 800px) {
          .chat{
            min-height: 55vh;
          }
        }
      </style>
  
      <section class="chat"></section>
    `

    this.shadow.querySelector('.chat').addEventListener('scroll', event => {
      if (this.shadow.querySelector('.chat').scrollTop + this.shadow.querySelector('.chat').clientHeight >= this.shadow.querySelector('.chat').scrollHeight) {
        this.scroll = false;
      } else {
        this.scroll = true;
      }
    });

    this.shadow.querySelector('.chat').addEventListener('click', event => {
      if (event.target.closest('img')) {
        this.showImage(event.target.closest('img'))
      }
    })
  }

  showImage = (currentImage) => {    
    const imagesLoaded = currentImage.parentElement.querySelectorAll('img')
    const imagesSrc = []
    
    imagesLoaded.forEach(image => {
      imagesSrc.push(image.getAttribute('src'))
    })

    const imageIndex = imagesSrc.findIndex(imageSrc => imageSrc === currentImage.src)

    const images = {
      src: imagesSrc,
      index: imageIndex,
    }

    store.dispatch(setImages(images))
  }

  createUserMessage = newPrompt => {
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const userAvatar = document.createElement('img')
    const userName = document.createElement('h3')
    const prompt = document.createElement('p')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    messageContainer.classList.add('message')
    messageContainer.classList.add('user')

    userAvatar.src = `${import.meta.env.VITE_API_URL}/api/customer/images/image/${this.user.images.xs.customerStaffAvatar.filename}`
    userName.textContent = "Tú"
    prompt.textContent = newPrompt

    avatarContainer.appendChild(userAvatar)
    messageContainer.appendChild(userName)
    messageContainer.appendChild(prompt)

    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)

    this.shadow.querySelector('.chat').appendChild(promptContainer)
    this.shadow.querySelector('.chat').scrollTo(0, this.shadow.querySelector('.chat').scrollHeight);
  }

  createAssistantResponse = async () => {
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const modelAvatar = document.createElement('img')
    const modelName = document.createElement('h3')
    const contents = document.createElement('div')
    const state = document.createElement('div')
    const stateBubble = document.createElement('div')
    const stateMessage = document.createElement('span')


    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    messageContainer.classList.add('message')
    messageContainer.classList.add('model')
    contents.classList.add('contents')
    state.classList.add('state')
    stateBubble.classList.add('state-bubble')
    stateBubble.classList.add('active')
    stateMessage.classList.add('state-message')

    modelAvatar.src = `${import.meta.env.VITE_API_URL}/api/customer/images/image/${this.assistant.images.xs.assistantAvatar.filename}`
    modelName.textContent = this.assistant.name

    contents.appendChild(state)
    state.appendChild(stateBubble)
    state.appendChild(stateMessage)
    avatarContainer.appendChild(modelAvatar)
    messageContainer.appendChild(modelName)
    messageContainer.appendChild(contents)

    promptContainer.appendChild(messageContainer)
    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)

    this.shadow.querySelector('.chat').appendChild(promptContainer)
    this.shadow.querySelector('.chat').scrollTo(0, this.shadow.querySelector('.chat').scrollHeight);
    store.dispatch(setResponseState(true))

    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/customer/assistants/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: this.threadId ? this.threadId : null,
          prompt: this.lastPrompt,
          assistant: this.assistant
        })
      })

      const response = await result.json()

      this.shadow.querySelector('.state').remove()
      await this.writeNewAnswer(response.answer, contents)

      if(!this.threadId){
        store.dispatch(setThread(response.threadId))
      }
    } catch (error) {
      console.log(error)
    }
  }

  writeNewAnswer = async (answer, container) => {

    let i = 0 
    let html = ''
    let tag = ''

    const interval = setInterval(() => {
      if (i >= answer.length) {
        clearInterval(interval);
        return;
      }

      const char = answer[i++];

      if (char === '<') {
        tag = char;
      } else if (tag) {
        tag += char;
        if (char === '>') {
          html += tag;
          tag = '';
          container.innerHTML = html;
        }
      } else {
        html += char;
        container.innerHTML = html;
      }

      this.shadow.querySelector('.chat').scrollTo(0, this.shadow.querySelector('.chat').scrollHeight);
    }, 1); 

    store.dispatch(setResponseState(false))      
  }

  updateState = (message) => {
    const stateMessage = this.shadow.querySelector('.state-message')
    stateMessage.innerHTML = ''
    stateMessage.textContent = message
  }
}

customElements.define('chat-component', Chat)