import { renderComponent } from './diff'

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(stateChange) {
    Object.assign(this.state, stateChange)
    renderComponent(this)
  }
}

module.exports = Component