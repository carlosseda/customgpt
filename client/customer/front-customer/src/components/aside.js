class Aside extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback () {
    this.render()
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
      <style>
        aside{
          background-color: hsl(0, 0%, 0%);
          max-width: 260px;
          min-width: 260px;
          height: 100%;
          overflow-x: hidden;
          position: relative;
          transition: max-width 0.2s ease-in-out, min-width 0.2s ease-in-out;
          z-index: 1001;
        }

        aside.active{
          min-width: 0;
          max-width: 0;
        }

        .toggle-aside-button{
          left: 275px;
          height: 2rem;
          position: fixed;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.2s ease-in-out;
        }

        .toggle-aside-button.active{
          left: 15px;
        }

        .toggle-aside-button button{
          background-color: transparent;
          border: none;
          cursor: pointer;
          outline: none;
        }

        .toggle-aside-button button span{
          background-color: hsl(235, 7%, 31%);
          display: block;
          height: 0.75rem;
          width: 0.25rem;
        }

        .toggle-aside-button:hover button span{
          background-color: hsl(240, 8%, 80%);
        }

        .toggle-aside-button button span:first-child{
          border-radius: 1rem 1rem 0 0;
        }

        .toggle-aside-button button span:last-child{
          border-radius: 0 0 1rem 1rem;
        }

        .toggle-aside-button:hover button span:first-child{
          transform: rotate(15deg);
          transform-origin: 0 0;
        }

        .toggle-aside-button:hover button span:last-child{
          transform: rotate(-15deg);
          transform-origin: 0 100%;
        }

        .toggle-aside-button.active button span:first-child,
        .toggle-aside-button:hover.active button span:first-child{
          transform: rotate(-15deg);
          transform-origin: 100% 0;
        }

        .toggle-aside-button.active button span:last-child,
        .toggle-aside-button:hover.active button span:last-child{
          transform: rotate(15deg);
          transform-origin: 100% 100%;
        }

        .toggle-aside-button .tooltiptext {
          background-color: black;
          border-radius: 0.5rem;
          color: #fff;
          font-family: 'SoehneBuch', sans-serif;
          font-size: 0.8rem;
          margin-top: -0.5rem;
          margin-left: 2rem;
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

        .toggle-aside-button .tooltiptext::after {
          border-color: transparent #000000 transparent transparent;
          border-style: solid;
          border-width: 5px;
          content: " ";
          left: -10px;
          position: absolute;
          top: 45%;
        }

        .toggle-aside-button:hover .tooltiptext.active {
          opacity: 1;
          visibility: visible;
        }

      </style>
    
      <aside>
        <slot></slot>
      </aside>

      <div class="toggle-aside-button">
        <span class="tooltiptext active">Cerrar barra lateral</span>
        <span class="tooltiptext">Abrir barra lateral</span>
        <button>
          <span></span>
          <span></span>
        </button>
      </div>
    `

    this.shadow.querySelector('.toggle-aside-button').addEventListener('click', event => {
      this.toggleAside()
    })
  }

  toggleAside = () => {
    this.shadow.querySelector('.toggle-aside-button').classList.toggle('active')
    this.shadow.querySelector('aside').classList.toggle('active')

    const activeTooltip = this.shadow.querySelector('.toggle-aside-button .tooltiptext.active')
    const hiddenTooltip = this.shadow.querySelector('.toggle-aside-button .tooltiptext:not(.active)')
    activeTooltip.classList.remove('active')
    hiddenTooltip.classList.add('active')
  }
}

customElements.define('aside-component', Aside)
