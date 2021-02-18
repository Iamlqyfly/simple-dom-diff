
class Element {
  constructor(type, props, children) {
    this.type = type;
    this.props = props;
    this.children = children;
  }
}

/**
 * 创建元素
 * @param {*} type 类型
 * @param {*} props 属性
 * @param {*} children 子节点
 */
function createElement(type, props, children) {
  return new Element(type, props, children);
}

/**
 * 给元素设置属性 value style
 * @param {*} node 节点
 * @param {*} key 属性名
 * @param {*} value 属性值
 */
function setAttr(node, key, value) {
  switch(key) {
    case 'value': 
      // node 是input或者textarea
      if (node.tagName.toUpperCase() === 'INPUT' || node.tagName.toUpperCase() === 'TEXTAREA') {
        node.value = value;
      } else {
        node.setAttribute(key, value)
      }
      break;
    case 'style': 
      node.style.cssText = value;  
      break;
    default: 
      node.setAttribute(key, value);
      break;
  }
}

/**
 * 将虚拟dom转为真实dom
 * @param {*} eleOBj 
 */
function render(eleObj) {
  let el = document.createElement(eleObj.type); // 创建元素
  for (let key in eleObj.props) {
    setAttr(el, key, eleObj.props[key]) // 设置属性值
  }
  // 遍历子节点
  eleObj.children.forEach((child) => {
    // 子元素是否是Element类型，是则递归，不是则创建文本节点
    child = (child instanceof Element) ? render(child) : document.createTextNode(child);
    el.appendChild(child);
  })
  return el;
}

/**
 * 将真实DOM渲染到浏览器上
 * @param {*} el 真实DOM
 * @param {*} target 渲染目标
 */

function renderDom(el, target) {
  target.appendChild(el);
}

export {
  Element,
  createElement,
  render,
  renderDom,
  setAttr
}