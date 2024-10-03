import { store } from '../redux/store.js'
import { setUser } from '../redux/chat-slice.js'

class User extends HTMLElement {

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback () {    
    this.loadData().then(() => this.render())
  }

  async loadData () {
    const url = `${import.meta.env.VITE_API_URL}/api/customer/customer-staff/findOne`

    try {
      const response = await fetch(url)
      this.data = await response.json()
      store.dispatch(setUser(this.data))
    } catch (error) {
      console.log(error)
    }
  }

  render () {

    this.shadow.innerHTML =
      /*html*/`
      <style>
        .user{
          bottom: 0;
          cursor: pointer;
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          position: absolute;
        }

        .user-logo{
          align-items: center;
          border-radius: 50%;
          display: flex;
          height: 2rem;
          justify-content: center;
          overflow: hidden;
          width: 2rem;
        }

        .user-logo img{
          width: 100%;
        }

        .user-name{
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .user-name h3{
          color: hsl(0, 0%, 100%);
          font-family: 'SoehneBuch', sans-serif;
          font-size: 0.9rem;
          margin: 0;
          overflow: hidden;
          white-space: nowrap;
        }
      </style>
    
      <section class="user">
        <div class="user-logo">
          <img src="${import.meta.env.VITE_API_URL}/api/customer/images/image/${this.data.images.xs.customerStaffAvatar.filename}" alt="${this.data.images.xs.customerStaffAvatar.alt}" title="${this.data.images.xs.customerStaffAvatar.title}">
        </div>
        <div class="user-name">
          <h3>${this.data.name} ${this.data.surname}</h3>
        </div>
      </section>
    `
  }
}

customElements.define('user-component', User)