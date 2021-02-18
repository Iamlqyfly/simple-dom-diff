import { Element, render, setAttr } from './element.js';

let allPatches; 
let index = 0;
/**
 * 给元素打补丁，重新更新视图
 * @param {*} node 
 * @param {*} patches 
 */
function patch(node, patches) {
  allPatches = patches; // 存储传递过来的所有补丁
  walk(node) // 给某个元素打补丁
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
      default:
        break;
    }
  })
}

/**
 * 获取所有的子节点
 * 给子节点也进行先序深度优先遍历，递归walk
  如果当前的补丁是存在的，那么就对其打补丁(doPatch)
 * @param {*} node 
 */
function walk(node) {
  let currentPatch = allPatches[index++];
  let childNodes = node.childNodes;
  childNodes.forEach(child => walk(child));
  if (currentPatch) {
    doPatch(node, currentPatch);
  }
}

export default patch;