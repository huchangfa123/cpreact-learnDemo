import Component from './component'
import diff from './diff'

// <div className="container">
//   <h1 title="hello" className="a">hello</h1>
//   <h1>world</h1>
// </div>

// 上面的dom经过babel解析之后返回的结果是:
// React.createElement(
//     "div",
//     { className: "container" },
//     React.createElement(
//       "h1",
//       { title: "hello", className: "a" },
//       "hello"
//     ),
//     React.createElement(
//       "h1",
//       null,
//       "world"
//     )
// );

// 所以要实现的是一个React对象，里面有一个createElement的函数，传入的参数是 tagName domAttributes children, 返回加工信息

const React = {
    createElement,
    Component
}

function createElement(tag, attrs, ...children) {
    return {
        tag,
        attrs,
        children
    }
}

// 再来看下react的render..render是从react-dom提取出来的方法 所以要在reactDom中实现一个render函数 render时候就能看到渲染后的html了
// render的参数有两个 一个是render的vnode（会被babel转化成一个React.createElement的对象） 一个是包容这个vnode的容器

const reactDom = {
    render
}

function render(vnode, container, dom) {
    // 不做比较直接全部重新渲染
    // return _render(vnode, container)

    // diff计算过后再重新渲染
    return diff(dom, vnode, container)
}

// 解析reactDom转换成真实的Dom 这是直接appendChild全部重新渲染的方法
// function _render(vnode, container) {
//     console.log(vnode);
//     // 根据vnode的类型返回不同的渲染结果
//     if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = '';

//     if (typeof vnode === 'number') vnode = String(vnode);

//     if (typeof vnode === 'string') {
//         let textNode = document.createTextNode(vnode);
//         return textNode;
//     }

//     if (typeof vnode.tag === 'function') {
//         // TODO 不能全部当成props
//         const component = createComponent(vnode.tag, vnode.attrs)
//         setComponentProps(component, vnode.attrs)
//         return component.base
//     }

//     const dom = document.createElement(vnode.tag)

//     if (vnode.attrs) {
//         Object.keys(vnode.attrs).forEach(key => {
//             const value = vnode.attrs[key]
//             setAttribute(dom, key, value)
//         })
//     }

//     vnode.children.forEach(child => render(child, dom))
//     return container.appendChild(dom);
// }
class TText extends React.Component {
    render() {
        return (
            <div>
                <h2>test text2</h2>
                <h2>test text</h2>
            </div>
        );
    }
}

class Tbutton extends React.Component {
    render() {
        return (
            <button>add</button>
        )
    }
}

class Counter extends React.Component {
    constructor( props ) {
        super( props );
        this.state = {
            num: 0
        }
    }

    componentWillUpdate() {
        console.log( 'update' );
    }

    componentWillMount() {
        console.log( 'mount' );
    }

    onClick() {
        this.setState( { num: this.state.num + 1 } );
    }

    render() {
        return (
            <div onClick={ () => this.onClick() }>
                <TText></TText>
                <h1>number: {this.state.num}</h1>
                <Tbutton></Tbutton>
            </div>
        );
    }
}

let element = <Counter><div>123</div></Counter>
reactDom.render(
    element,
    document.getElementById('root')
)
