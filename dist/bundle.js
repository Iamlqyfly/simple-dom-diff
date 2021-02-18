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
        node.setAttribute(key, value);
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
    setAttr(el, key, eleObj.props[key]); // 设置属性值
  }
  // 遍历子节点
  eleObj.children.forEach((child) => {
    // 子元素是否是Element类型，是则递归，不是则创建文本节点
    child = (child instanceof Element) ? render(child) : document.createTextNode(child);
    el.appendChild(child);
  });
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

/**
 * 判断是否是字符串
 * @param {*} node 
 */
const isString = function (node) {
  return Object.prototype.toString.call(node) === '[object String]'
};

const ATTRS = 'ATTRS';
const TEXT = 'TEXT';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
let INDEX = 0;

/**
 * diff算法 规则： 同层比较
  1. 新的DOM节点不存在{type: 'REMOVE', index}
  2. 文本的变化{type: 'TEXT', text: 1}
  3. 当节点类型相同时，去看一下属性是否相同，产生一个属性的补丁包{type: 'ATTR', attr: {class: 'list-group'}}
  4. 节点类型不相同，直接采用替换模式{type: 'REPLACE', newNode}
 * 
 * @param {*} oldTree 
 * @param {*} newTree 
 */
function diff(oldTree, newTree) {
  let patches = {};
  let index = 0; // 默认比较树的第一层
  walk(oldTree, newTree, index, patches); // 递归树，比较后的节点放到补丁包中
  return patches;
}

/**
 * 比较属性: 比较两个节点数的属性是否相同，把不同的存放在patch对象中
 * @param {*} oldAtrrs 
 * @param {*} newAttrs 
 */
function diffAttr(oldAtrrs, newAttrs) {
  let patch = {};
  for (let key in oldAtrrs) {
    // 判断新老属性值 将新属性存放在patch中
    if (oldAtrrs[key] != newAttrs[key]) {
      patch[key] = newAttrs[key];
    }
  }
  for (let key in newAttrs) {
    // 老的节点中没新节点中的属性
    if (!oldAtrrs.hasOwnProperty(key)) {
      patch[key] = newAttrs[key];
    }
  }
  return patch;
}

/**
 * 遍历👦节点
 * @param {*} oldChildren 老的👦节点
 * @param {*} newChildren 新的👦节点
 * @param {*} patches 
 */
function diffChildren(oldChildren, newChildren, patches) {
  oldChildren.forEach((child, idx) => {
    walk(child, newChildren[idx], ++INDEX, patches);
  });
}

/**
 * 递归🌲
 * @param {*} oldNode 老节点
 * @param {*} newNode 新节点
 * @param {*} index 比较层数
 * @param {*} patches 补丁包
*/

function walk(oldNode, newNode, index, patches) {
  let currentPatch = []; // 每个元素都有一个补丁对象
  if (!newNode) { // 新节点中删除了子节点
    currentPatch.push({type: REMOVE, index: index});
  } else if (isString(oldNode) && isString(newNode)) {
    if (oldNode !== newNode) { // 判断两个文本是否一样
      currentPatch.push({ type: TEXT, text: newNode });
    }
  } else if (oldNode.type == newNode.type) { // 判断两个节点数的元素类型相同，就比较属性
    let attrs = diffAttr(oldNode.props, newNode.props); // 比较属性是否有更新
    if (Object.keys(attrs).length > 0) { // 属性有更改
      currentPatch.push({ type: ATTRS, attrs});
    }
    diffChildren(oldNode.children, newNode.children, patches); // 遍历👦节点
  } else {
    // 节点被替换了
    currentPatch.push({type: REPLACE, newNode });
  }

  if (currentPatch.length > 0) {
    patches[index] = currentPatch; // 将元素和补丁对应起来，放到大补丁包中
  }
}

let allPatches; 
let index = 0;
/**
 * 给元素打补丁，重新更新视图
 * @param {*} node 
 * @param {*} patches 
 */
function patch(node, patches) {
  allPatches = patches; // 存储传递过来的所有补丁
  walk$1(node); // 给某个元素打补丁
}

/**
 * 给那个节点打那个补丁，后续遍历
 * @param {*} node 那个节点
 * @param {*} patches 那个补丁
 */
function doPatch(node, patches) {
  patches.forEach(patch => {
    switch (patch.type) {
      case 'ATTRS':
        for (let key in patch.attrs) {
          let value = patch.attrs[key];
          if (value) {
            setAttr(node, key, value);
          } else {
            node.removeAttribute(key);
          }
        }
        break;
      case 'TEXT':
        node.textContext = patch.text;
        break;
      case 'REMOVE':
        node.parentNode.removeChild(node);
        break;
      case 'REPLACE':
        // 新节点替换老节点，需要先判断新节点是不是Element的实例，是的话调用render方法渲染新节点；
        let newNode = (patch.newNode instanceof Element) ? render(patch.newNode) : document.createTextNode(patch.newNode);
        node.parentNode.replaceChild(newNode, node);
        break;
    }
  });
}

/**
 * 获取所有的子节点
 * 给子节点也进行先序深度优先遍历，递归walk
  如果当前的补丁是存在的，那么就对其打补丁(doPatch)
 * @param {*} node 
 */
function walk$1(node) {
  let currentPatch = allPatches[index++];
  let childNodes = node.childNodes;
  childNodes.forEach(child => walk$1(child));
  if (currentPatch) {
    doPatch(node, currentPatch);
  }
}

let virtualDom = createElement('ul', { class: 'list' }, [
  createElement('li', { class: 'item' }, ['a']),
  createElement('li', { class: 'item' }, ['b']),
  createElement('li', { class: 'item' }, ['c'])
]);

let virtualDom2 = createElement('ul', { class: 'list-group' }, [
  createElement('li', { class: 'item' }, ['1']),
  createElement('li', { class: 'item' }, ['b']),
  createElement('p', { class: 'page' }, [
    createElement('a', { class: 'link', href: 'https://www.baidu.com/', target: '_blank' }, ['baidu'])
  ]),
  createElement('li', { class: 'wkk' }, ['wkk'])
]);

// 如果平级元素有互换，那会导致重新渲染
// 新增节点也不会被更新

// 将虚拟dom转化成了真实dom并渲染到页面
let el = render(virtualDom);

renderDom(el, window.document.body);

let patches = diff(virtualDom, virtualDom2);
console.log(patches);

// 给元素打补丁，重新更新视图
patch(el, patches);
