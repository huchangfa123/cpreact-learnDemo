import Component from './component'

export default function diff(dom, vnode, container) {
  const ret = diffNode(dom, vnode)
  // 这里是把计算完的真实dom的结果添加到视图当中
  if (container && ret.parentNode !== container) {
    container.appendChild(ret)
  }
  return ret
}

// diff算法 比较两颗dom树 返回更新后的新树
// 两个参数 dom为当前dom结构 vnode是重新计算出来的虚拟dom结构
// 返回新的dom结构
function diffNode(dom, vnode) {
  let out = dom // 最终返回的dom结构

  if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = ''

  if (typeof vnode === 'number') vnode = String(vnode)

  // 判断当前节点是不是文本节点
  if (typeof vnode === 'string') {
    // 如果原节点也是文本节点就直接替换
    if (dom && dom.nodeType === 3) {
      if (dom.textContent !== vnode) {
        dom.textContent = vnode
      }
    } else {
      // 否则就直接替换该节点
      out = document.createTextNode(vnode)
      if (dom && dom.parentNode) {
        dom.parentNode.replaceChild(out, dom)
      }
    }
    return out
  }

  // 如果该节点是组件
  if (typeof vnode.tag === 'function') {
    // 这里之所以能直接return 是因为最外层永远只有一个标签 组件内部的children在递归的时候就会往下走
    // 即使children里面有组件 return的时候也是回到处理children的阶段
    return diffComponent(dom, vnode)
  }

  // 如果该节点是正常dom
  if (!dom || !isSameNodeType(dom, vnode)) {
    out = document.createElement(vnode.tag)
    // 如果当前位置存在节点的话 就把节点的子节点全部转移到新的dom节点上 这里保证了同层比较
    if (dom) {
      [...dom.childNodes].map(out.appendChild)
      if (dom.parentNode) {
        // 把dom替代成out
        dom.parentNode.replaceChild(out, dom)
      }
    }
  }

  // 只要有子节点就要比较一下子节点是否发生变化
  if (vnode.children && vnode.children.length > 0 || (out.childNodes && out.childNodes.length > 0)) {
    // out为当前节点的标签 vnode是当前节点的ast
    diffChildren(out, vnode.children);
  }

  diffAttributes(out, vnode)
  // 直接返回修改后的dom
  return out
}

// 创建Component component为组件的tag，即组件的构造函数
function createComponent(component, props) {
  let inst;
  if (component.prototype && component.prototype.render) {
      // 如果已经创建 则重新传递props
      inst = new component(props)
  } else {
      // 没有就new一个新的组件
      inst = new Component(props)
      inst.constructor = component
      inst.render = function() {
          return this.constructor(props)
      }
  }
  return inst
}

// 设置组件的props 跑两个生命周期
function setComponentProps(component, props) {
  if(!component.base) {
      if (component.componentWillMount) {
          component.componentWillMount()
      } else if (component.componentWillReceiveProps) {
          component.componentWillReceiveProps(props)
      }
  }

  component.props = props
  // 获取真实的dom结构
  renderComponent(component)
}

function unmountComponent(component) {
  if (component.componentWillUnmount) component.componentWillUnmount();
  removeNode(component.base);
}

export function renderComponent(component) {
  let base;
  // 提取render方法 render返回dom结构 被babel转成对应的ast
  const renderer = component.render()
  // 存在base的才触发
  if (component.base && component.componentWillUpdate) {
      component.componentWillUpdate()
  }

  // 对组件进行递归遍历 深度遍历 同时进行更新
  base = diffNode(component.base, renderer)

  // 如果组件已经创建了就要重新触发两个生命周期
  if (component.base) {
      if (component.componentDidUpdate) { component.componentDidUpdate(); }
  } else if (component.componentDidMount) {
      component.componentDidMount()
  }

  component.base = base;
  base._component = component;
}

// 如果当前节点是组件的话
function diffComponent(dom, vnode) {
  let curDom = dom && dom._component
  let oldDom = dom
  // 如果是组件的话，虚拟dom的tag就是组件的构造函数 当前dom与vnode是同一个组件的时候
  if (curDom && curDom.constructor === vnode.tag) {
    // 重新赋值props
    setComponentProps(curDom, vnode.attrs)
    dom = curDom.base // 最终返回结果
  } else {
    // 当前dom与vnode不相等的时
    // 如果当前节点是组件先取消之前的组件的挂载
    if (curDom) {
      unmountComponent(curDom)
      oldDom = null
    }
    // 再挂载对应的组件
    curDom = createComponent(vnode.tag, vnode.attrs)

    setComponentProps(curDom, vnode.attrs)
    // 返回处理完的真实dom结构
    dom = curDom.base

    if (oldDom && dom !== oldDom) {
      oldDom._component = null
      removeNode(oldDom)
    }
  }
  return dom
}

function setAttribute(dom, name, value) {
  // 如果属性名是className，则改回class
  if (name === 'className') name = 'class';

  // 如果属性名是onXXX，则是一个事件监听方法
  if (/on\w+/.test(name)) {
      name = name.toLowerCase();
      dom[name] = value || '';
  // 如果属性名是style，则更新style对象
  } else if (name === 'style') {
      if (!value || typeof value === 'string') {
          dom.style.cssText = value || '';
      } else if (value && typeof value === 'object') {
          for (let name in value) {
              // 可以通过style={ width: 20 }这种形式来设置样式，可以省略掉单位px
              dom.style[name] = typeof value[name] === 'number' ? value[name] + 'px' : value[name];
          }
      }
  // 普通属性则直接更新属性
  } else {
      if (name in dom) {
          dom[name] = value || '';
      }
      if (value) {
          dom.setAttribute(name, value);
      } else {
          dom.removeAttribute(name, value);
      }
  }
}

// dom是真实dom vnode是虚拟dom
function diffAttributes(dom, vnode) {
  const old = {} // 
  const attrs = vnode.attrs
  for (let i = 0; i < dom.attributes.length; i++) {
    const attr = dom.attributes[i]
    old[attr.name] = attr.value
  }

  for(let name in old) {
    if (!(name in attrs)) {
      setAttribute(dom, name, undefined)
    }
  }

  for(let name in attrs) {
    if (old[name] !== attrs[name]) {
      setAttribute(dom, name, attrs[name])
    }
  }
}

// 对比子节点 dom为当前节点 vchildren是新dom树的子节点
function diffChildren(dom, vchildren) {
  const domChildren = dom.childNodes // 实现预存当前真实节点的子节点
  console.log(domChildren);
  const children = []
  const keyed = {} // 用来保存key和对应dom的一个map

  // 把domChildren中带key的节点和不带key的节点分开
  if (domChildren.length > 0) {
    for (let i = 0; i < domChildren.length; i++) {
        const child = domChildren[i]
        // 这个key 是自己设置的key eg.在map的时候 把entity的id做key
        const key = child.key
        if (key) {
            keyed[key] = child // 如果存在key就把节点存放到keyMap当中
        } else {
            children.push(child) // 把当前子节点存放到chlidren当中
        }
    }
  }

  // 如果虚拟dom的ast存在子节点
  if (vchildren && vchildren.length > 0) {
    let min = 0
    let childrenLen = children.length // 当前子节点个数

    // 遍历计算出来的新的子节点
    for (let i = 0; i < vchildren.length; i ++) {
      const vchild = vchildren[i] // 新的子节点
      const key = vchild.key
      let child; // 旧的子节点
      // 这个if else主要目的是找出对应的旧节点 如果不存在对应的旧节点 则为undefined
      if (key) {
        // 新节点存在key的时候 直接在keyMap中找出之前对应的值 并清空该值
        if (keyed[key]) {
          child = keyed[key]
          keyed[key] = undefined
        }
      } else if (min < childrenLen) {
        // 新节点不存在key的时候 遍历没有key值的当前节点数组children
        for(let j = min; j < childrenLen; j++) {
          let c = children[j]
          // 判断新子节点是否存在于旧子节点当中 存在旧节点child就赋值并清空数组对应的值
          if (c && isSameNodeType(c, vchild)) {
            child = c
            children[j] = undefined
            if (j === childrenLen - 1) childrenLen-- // 记录数组最大长度 减少遍历长度
            if (j === min) min++ // 记录起始位置 减少遍历长度
            break
          }
        }
      }
      // 对比新旧两个子节点获取最新的节点 child为更新后的新当前节点 有可能部分替换 也有可能创建出一个新节点
      child = diffNode(child, vchild)
      // former为旧的当前位置的节点
      const former = domChildren[i]

      // 这里是在比较子节点变化之后触发重新渲染的关键 如果child == former即没发生变化的话就直接不处理 否则做相应的变化处理
      if (child && child !== dom && child !== former) {
        if (!former) {
          // 当前位置节点为空 直接增加新节点即可
          dom.appendChild(child)
        } else if (child === former.nextSibling) {
          // 如果新节点与旧节点的下一个节点相同 相当于删除旧节点 nextSibling用于获取当前dom节点的下一个节点
          removeNode(former)
        } else {
          // 其他情况下把新节点加到旧节点前面
          dom.insertBefore(child, former)
        }
      }
    }
  }
}

function isSameNodeType(dom, vnode) {
  // vnode是文本节点的时候
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return dom.nodeType === 3
  }
  // vnode是正常节点的时候
  if (typeof vnode.tag === 'string') {
    return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase()
  }
  // vnode是组件的时候
  return dom && dom._component && dom._component.constructor === vnode.tag
}

function removeNode(dom) {
  if (dom && dom.parentNode) {
    dom.parentNode.removeChild(dom)
  }
}
