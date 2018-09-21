// 用类似vue的异步更新队列来实现react setState的异步效果
/* 
  先明确几个事情:
  a. react的setState实现了什么事情？
    1. setState不会立刻改变React组件中state的值；
    2. setState通过引发一次组件的更新过程来引发重新绘制；
    3. 多次setState函数调用产生的效果会合并。
    4. 为了解决异步更新导致的问题，增加另一种形式的setState：接受一个函数作为参数
       在函数中可以得到前一个状态并返回下一个状态,就像下面的例子，
      eg . componentDidMount() {
            for ( let i = 0; i < 100; i++ ) {
                this.setState( prevState => {
                    console.log( prevState.num );
                    return {
                        num: prevState.num + 1
                    }
                } );
            }
          }

  b. 原生react实现setState的方式:
    主要是下面这一段函数，判断isBatchingUpdates的值，该值默认为false，
    当值为false的时候就执行batchedUpdates，直接触发队列更新并把isBatchingUpdates设置为true,
    此时的setState都放进dirtyComponents队列当中等待下次统一处理

    function enqueueUpdate(component) {
      if (!batchingStrategy.isBatchingUpdates) {
          batchingStrategy.batchedUpdates(enqueueUpdate, component);
          return;
      }

      dirtyComponents.push(component);
    }
    batchedUpdates的处理过程也不简单，涉及到react的transaction事务流，这里不详谈，只要知道在处理完之后会
    把isBatchingUpdates设置回false, 表示当前批量处理流结束

  c. 这里用简单点的做法，类似vue的异步更新队列， 通过js的eventLoop达到异步的效果
*/
import { renderComponent } from './diff'

const stateChangeQueue = []
const renderQueue = []

function defer(fn) {
  return Promise.resolve().then(fn)
}

export function enqueueSetState(stateChange, component) {
  // 做法就是先在微任务等待队列栈预设置一个批处理renderQueue的函数 然后在当前执行栈中，往renderQueue添加对应的任务
  // 如此即可在一次执行栈处理完成后 做一次渲染 达到合并多个setState的效果
  if (stateChangeQueue.length === 0) {
    defer(flushQueue);
  }

  stateChangeQueue.push({
    stateChange,
    component
  })
  // 保证同个组件只重新渲染一次
  if (renderQueue.indexOf(component) === -1) {
    renderQueue.push(component)
  }
}

// 按照渲染队列执行所有setState
function flushQueue() {
  let item, component;
  // 合并多次的setState 传进来的时候state对应的值还没有发生改变
  // 批处理的时候 对应的还是原来的值，所以多次setState +1 只会触发一次 +1
  while (item = stateChangeQueue.shift()) {
    const { stateChange, component } = item;
    console.log(component);
    // 如果没有prevState，则将当前的state作为初始的prevState
    if (!component.prevState) {
      component.prevState = Object.assign({}, component.state)
    }

    // 如果stateChange是一个方法，则调用该方法 否则正常assign合并
    if (typeof stateChange === 'function') {
      Object.assign(component.state, stateChange(component.prevState, component.props))
    } else {
      Object.assign(component.state, stateChange)
    }
    // 保证如果stateChange是function的时候 每次的prevState是更新后的值
    component.prevState = component.state;
  }
  // 重新渲染组件
  while(component = renderQueue.shift()) {
    renderComponent(component)
  }
}