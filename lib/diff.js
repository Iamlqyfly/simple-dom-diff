/**
 * 判断是否是字符串
 * @param {*} node 
 */
const isString = function (node) {
  return Object.prototype.toString.call(node) === '[object String]'
}

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
    walk(child, newChildren[idx], ++INDEX, patches)
  })
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
    currentPatch.push({type: REMOVE, index: index})
  } else if (isString(oldNode) && isString(newNode)) {
    if (oldNode !== newNode) { // 判断两个文本是否一样
      currentPatch.push({ type: TEXT, text: newNode });
    }
  } else if (oldNode.type == newNode.type) { // 判断两个节点数的元素类型相同，就比较属性
    let attrs = diffAttr(oldNode.props, newNode.props); // 比较属性是否有更新
    if (Object.keys(attrs).length > 0) { // 属性有更改
      currentPatch.push({ type: ATTRS, attrs})
    }
    diffChildren(oldNode.children, newNode.children, patches); // 遍历👦节点
  } else {
    // 节点被替换了
    currentPatch.push({type: REPLACE, newNode })
  }

  if (currentPatch.length > 0) {
    patches[index] = currentPatch; // 将元素和补丁对应起来，放到大补丁包中
  }
}

export default diff;