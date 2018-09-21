import { enqueueSetState } from './vueSetState'

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(stateChange) {
    enqueueSetState(stateChange, this)
  }
}

module.exports = Component