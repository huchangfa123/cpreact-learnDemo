// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"src/diff.js":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = diff;
exports.renderComponent = renderComponent;

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function diff(dom, vnode, container) {
  var ret = diffNode(dom, vnode);
  // 这里是把计算完的真实dom的结果添加到视图当中
  if (container && ret.parentNode !== container) {
    container.appendChild(ret);
  }
  return ret;
}

// diff算法 比较两颗dom树 返回更新后的新树
// 两个参数 dom为当前dom结构 vnode是重新计算出来的虚拟dom结构
// 返回新的dom结构
function diffNode(dom, vnode) {
  var out = dom; // 最终返回的dom结构

  if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = '';

  if (typeof vnode === 'number') vnode = String(vnode);

  // 判断当前节点是不是文本节点
  if (typeof vnode === 'string') {
    // 如果原节点也是文本节点就直接替换
    if (dom && dom.nodeType === 3) {
      if (dom.textContent !== vnode) {
        dom.textContent = vnode;
      }
    } else {
      // 否则就直接替换该节点
      out = document.createTextNode(vnode);
      if (dom && dom.parentNode) {
        dom.parentNode.replaceChild(out, dom);
      }
    }
    return out;
  }

  // 如果该节点是组件
  if (typeof vnode.tag === 'function') {
    // 这里之所以能直接return 是因为最外层永远只有一个标签 组件内部的children在递归的时候就会往下走
    // 即使children里面有组件 return的时候也是回到处理children的阶段
    return diffComponent(dom, vnode);
  }

  // 如果该节点是正常dom
  if (!dom || !isSameNodeType(dom, vnode)) {
    out = document.createElement(vnode.tag);
    // 如果当前位置存在节点的话 就把节点的子节点全部转移到新的dom节点上 这里保证了同层比较
    if (dom) {
      [].concat(_toConsumableArray(dom.childNodes)).map(out.appendChild);
      if (dom.parentNode) {
        // 把dom替代成out
        dom.parentNode.replaceChild(out, dom);
      }
    }
  }

  // 只要有子节点就要比较一下子节点是否发生变化
  if (vnode.children && vnode.children.length > 0 || out.childNodes && out.childNodes.length > 0) {
    // out为当前节点的标签 vnode是当前节点的ast
    diffChildren(out, vnode.children);
  }

  diffAttributes(out, vnode);
  // 直接返回修改后的dom
  return out;
}

// 创建Component component为组件的tag，即组件的构造函数
function createComponent(component, props) {
  var inst = void 0;
  if (component.prototype && component.prototype.render) {
    // 如果已经创建 则重新传递props
    inst = new component(props);
  } else {
    // 没有就new一个新的组件
    inst = new _component2.default(props);
    inst.constructor = component;
    inst.render = function () {
      return this.constructor(props);
    };
  }
  return inst;
}

// 设置组件的props 跑两个生命周期
function setComponentProps(component, props) {
  if (!component.base) {
    if (component.componentWillMount) {
      component.componentWillMount();
    } else if (component.componentWillReceiveProps) {
      component.componentWillReceiveProps(props);
    }
  }

  component.props = props;
  // 获取真实的dom结构
  renderComponent(component);
}

function unmountComponent(component) {
  if (component.componentWillUnmount) component.componentWillUnmount();
  removeNode(component.base);
}

function renderComponent(component) {
  var base = void 0;
  // 提取render方法 render返回dom结构 被babel转成对应的ast
  var renderer = component.render();
  // 存在base的才触发
  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate();
  }

  // 对组件进行递归遍历 深度遍历 同时进行更新
  base = diffNode(component.base, renderer);

  // 如果组件已经创建了就要重新触发两个生命周期
  if (component.base) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate();
    }
  } else if (component.componentDidMount) {
    component.componentDidMount();
  }

  component.base = base;
  base._component = component;
}

// 如果当前节点是组件的话
function diffComponent(dom, vnode) {
  var curDom = dom && dom._component;
  var oldDom = dom;
  // 如果是组件的话，虚拟dom的tag就是组件的构造函数 当前dom与vnode是同一个组件的时候
  if (curDom && curDom.constructor === vnode.tag) {
    // 重新赋值props
    setComponentProps(curDom, vnode.attrs);
    dom = curDom.base; // 最终返回结果
  } else {
    // 当前dom与vnode不相等的时
    // 如果当前节点是组件先取消之前的组件的挂载
    if (curDom) {
      unmountComponent(curDom);
      oldDom = null;
    }
    // 再挂载对应的组件
    curDom = createComponent(vnode.tag, vnode.attrs);

    setComponentProps(curDom, vnode.attrs);
    // 返回处理完的真实dom结构
    dom = curDom.base;

    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      removeNode(oldDom);
    }
  }
  return dom;
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
    } else if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
      for (var _name in value) {
        // 可以通过style={ width: 20 }这种形式来设置样式，可以省略掉单位px
        dom.style[_name] = typeof value[_name] === 'number' ? value[_name] + 'px' : value[_name];
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
  var old = {}; // 
  var attrs = vnode.attrs;
  for (var i = 0; i < dom.attributes.length; i++) {
    var attr = dom.attributes[i];
    old[attr.name] = attr.value;
  }

  for (var name in old) {
    if (!(name in attrs)) {
      setAttribute(dom, name, undefined);
    }
  }

  for (var _name2 in attrs) {
    if (old[_name2] !== attrs[_name2]) {
      setAttribute(dom, _name2, attrs[_name2]);
    }
  }
}

// 对比子节点 dom为当前节点 vchildren是新dom树的子节点
function diffChildren(dom, vchildren) {
  var domChildren = dom.childNodes; // 实现预存当前真实节点的子节点
  console.log(domChildren);
  var children = [];
  var keyed = {}; // 用来保存key和对应dom的一个map

  // 把domChildren中带key的节点和不带key的节点分开
  if (domChildren.length > 0) {
    for (var i = 0; i < domChildren.length; i++) {
      var child = domChildren[i];
      // 这个key 是自己设置的key eg.在map的时候 把entity的id做key
      var key = child.key;
      if (key) {
        keyed[key] = child; // 如果存在key就把节点存放到keyMap当中
      } else {
        children.push(child); // 把当前子节点存放到chlidren当中
      }
    }
  }

  // 如果虚拟dom的ast存在子节点
  if (vchildren && vchildren.length > 0) {
    var min = 0;
    var childrenLen = children.length; // 当前子节点个数

    // 遍历计算出来的新的子节点
    for (var _i = 0; _i < vchildren.length; _i++) {
      var vchild = vchildren[_i]; // 新的子节点
      var _key = vchild.key;
      var _child = void 0; // 旧的子节点
      // 这个if else主要目的是找出对应的旧节点 如果不存在对应的旧节点 则为undefined
      if (_key) {
        // 新节点存在key的时候 直接在keyMap中找出之前对应的值 并清空该值
        if (keyed[_key]) {
          _child = keyed[_key];
          keyed[_key] = undefined;
        }
      } else if (min < childrenLen) {
        // 新节点不存在key的时候 遍历没有key值的当前节点数组children
        for (var j = min; j < childrenLen; j++) {
          var c = children[j];
          // 判断新子节点是否存在于旧子节点当中 存在旧节点child就赋值并清空数组对应的值
          if (c && isSameNodeType(c, vchild)) {
            _child = c;
            children[j] = undefined;
            if (j === childrenLen - 1) childrenLen--; // 记录数组最大长度 减少遍历长度
            if (j === min) min++; // 记录起始位置 减少遍历长度
            break;
          }
        }
      }
      // 对比新旧两个子节点获取最新的节点 child为更新后的新当前节点 有可能部分替换 也有可能创建出一个新节点
      _child = diffNode(_child, vchild);
      // former为旧的当前位置的节点
      var former = domChildren[_i];

      // 这里是在比较子节点变化之后触发重新渲染的关键 如果child == former即没发生变化的话就直接不处理 否则做相应的变化处理
      if (_child && _child !== dom && _child !== former) {
        if (!former) {
          // 当前位置节点为空 直接增加新节点即可
          dom.appendChild(_child);
        } else if (_child === former.nextSibling) {
          // 如果新节点与旧节点的下一个节点相同 相当于删除旧节点 nextSibling用于获取当前dom节点的下一个节点
          removeNode(former);
        } else {
          // 其他情况下把新节点加到旧节点前面
          dom.insertBefore(_child, former);
        }
      }
    }
  }
}

function isSameNodeType(dom, vnode) {
  // vnode是文本节点的时候
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return dom.nodeType === 3;
  }
  // vnode是正常节点的时候
  if (typeof vnode.tag === 'string') {
    return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase();
  }
  // vnode是组件的时候
  return dom && dom._component && dom._component.constructor === vnode.tag;
}

function removeNode(dom) {
  if (dom && dom.parentNode) {
    dom.parentNode.removeChild(dom);
  }
}
},{"./component":"src/component.js"}],"src/component.js":[function(require,module,exports) {
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _diff = require('./diff');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Component = function () {
  function Component() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Component);

    this.state = {};
    this.props = props;
  }

  _createClass(Component, [{
    key: 'setState',
    value: function setState(stateChange) {
      Object.assign(this.state, stateChange);
      (0, _diff.renderComponent)(this);
    }
  }]);

  return Component;
}();

module.exports = Component;
},{"./diff":"src/diff.js"}],"src/index.js":[function(require,module,exports) {
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _diff = require('./diff');

var _diff2 = _interopRequireDefault(_diff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var React = {
    createElement: createElement,
    Component: _component2.default
};

function createElement(tag, attrs) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        children[_key - 2] = arguments[_key];
    }

    return {
        tag: tag,
        attrs: attrs,
        children: children
    };
}

// 再来看下react的render..render是从react-dom提取出来的方法 所以要在reactDom中实现一个render函数 render时候就能看到渲染后的html了
// render的参数有两个 一个是render的vnode（会被babel转化成一个React.createElement的对象） 一个是包容这个vnode的容器

var reactDom = {
    render: render
};

function render(vnode, container, dom) {
    // 不做比较直接全部重新渲染
    // return _render(vnode, container)

    // diff计算过后再重新渲染
    return (0, _diff2.default)(dom, vnode, container);
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

var TText = function (_React$Component) {
    _inherits(TText, _React$Component);

    function TText() {
        _classCallCheck(this, TText);

        return _possibleConstructorReturn(this, (TText.__proto__ || Object.getPrototypeOf(TText)).apply(this, arguments));
    }

    _createClass(TText, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'h2',
                    null,
                    'test text2'
                ),
                React.createElement(
                    'h2',
                    null,
                    'test text'
                )
            );
        }
    }]);

    return TText;
}(React.Component);

var Tbutton = function (_React$Component2) {
    _inherits(Tbutton, _React$Component2);

    function Tbutton() {
        _classCallCheck(this, Tbutton);

        return _possibleConstructorReturn(this, (Tbutton.__proto__ || Object.getPrototypeOf(Tbutton)).apply(this, arguments));
    }

    _createClass(Tbutton, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'button',
                null,
                'add'
            );
        }
    }]);

    return Tbutton;
}(React.Component);

var Counter = function (_React$Component3) {
    _inherits(Counter, _React$Component3);

    function Counter(props) {
        _classCallCheck(this, Counter);

        var _this3 = _possibleConstructorReturn(this, (Counter.__proto__ || Object.getPrototypeOf(Counter)).call(this, props));

        _this3.state = {
            num: 0
        };
        return _this3;
    }

    _createClass(Counter, [{
        key: 'componentWillUpdate',
        value: function componentWillUpdate() {
            console.log('update');
        }
    }, {
        key: 'componentWillMount',
        value: function componentWillMount() {
            console.log('mount');
        }
    }, {
        key: 'onClick',
        value: function onClick() {
            this.setState({ num: this.state.num + 1 });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this4 = this;

            return React.createElement(
                'div',
                { onClick: function onClick() {
                        return _this4.onClick();
                    } },
                React.createElement(TText, null),
                React.createElement(
                    'h1',
                    null,
                    'number: ',
                    this.state.num
                ),
                React.createElement(Tbutton, null)
            );
        }
    }]);

    return Counter;
}(React.Component);

var element = React.createElement(
    Counter,
    null,
    React.createElement(
        'div',
        null,
        '123'
    )
);
reactDom.render(element, document.getElementById('root'));
},{"./component":"src/component.js","./diff":"src/diff.js"}],"../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '50143' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();

      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';

  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","src/index.js"], null)
//# sourceMappingURL=/src.a305dcc1.map