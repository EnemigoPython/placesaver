//// globals ////
const buttonEl = document.getElementById('btn');

let oldId;

buttonEl.addEventListener('click', highlightFromSelection);


function generateId() {
    let id = ''
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 16; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        id += chars[idx];
    }
    return id;
}


function getTreeRef(rangeVals) {
    // adjust the range indices based on encounter with old span
    const nodeTreeRecurse = (node, idx, rangeIdx) => {
        let incrRange = false;
        const posArr = [];
        if (node.parentNode.className === 'placeSaverHighlight') {
            node = node.parentNode.previousSibling;
            rangeVals.rangeIndices[rangeIdx] += node.textContent.length;
        }
        // we find an ID to hook onto, and it isn't the span we created
        if (node.id) {
            posArr.push(idx, node.id);
            return posArr;
        }

        let previousSibling = node.previousSibling;
        if (previousSibling && previousSibling.className === 'placeSaverHighlight') {
                rangeVals.rangeIndices[rangeIdx] += previousSibling.textContent.length;
                previousSibling = previousSibling.previousSibling;
                idx--;
                incrRange = true;
        }
        if (previousSibling) {
            if (incrRange) {
                rangeVals.rangeIndices[rangeIdx] += previousSibling.textContent.length;
            }
            posArr.push(...nodeTreeRecurse(previousSibling, idx+1, rangeIdx));
            return posArr;
        }
        posArr.push(idx); 
        const parent = node.parentNode;
        // we will stop zooming out if we hit the body, else continue searching
        if (parent.nodeName !== 'BODY') {
            posArr.push(...nodeTreeRecurse(parent, 0, rangeIdx));
        }
        // we hit the body without finding an ID, so end at the body
        return posArr;
    }
    const startPos = nodeTreeRecurse(rangeVals.startNode, 0, 0).reverse();
    const endPos = nodeTreeRecurse(rangeVals.endNode, 0, 1).reverse();
    return { 
        startPos, 
        endPos, 
        rangeIndices: rangeVals.rangeIndices
    };
}

function nodeFromPosArr(posArr) {
    let nodeRes;
    // if the first element is a string, it's an ID
    if (typeof posArr[0] === 'string') {
        nodeRes = document.getElementById(posArr[0]);
    } else {
        nodeRes = document.body.firstChild;
        // we start the walk at the second element, so insert an element at pos 0
        posArr.unshift('BODY');
    }
    posArr.slice(1).forEach((sibling, idx) => {
        for (let i = 0; i < sibling; i++) {
            nodeRes = nodeRes.nextSibling;
        }
        // until we reach the last element, we want to keep zooming in
        if (idx + 2 < posArr.length) {
            nodeRes = nodeRes.firstChild;
        }
    });

    return nodeRes;
}

function highlightFromSelection() {
    const selection = window.getSelection();
    if (!selection) return;

    // a span can't wrap multiple lines, so we need to find the first newline to set
    // the selection extent to.
    const spanFragments = selection.toString().split(/\n|\s{2}/);
    let spanOffset;
    if (spanFragments.length > 1) {
        // check if the user dragged up or down the page; get the first fragment in each case
        if (selection.focusNode.compareDocumentPosition(selection.anchorNode) & 
        Node.DOCUMENT_POSITION_PRECEDING) {
            spanOffset = selection.anchorOffset + spanFragments[0].length;
        } else {
            const idx = spanFragments.length - 1;
            spanOffset = selection.anchorOffset - spanFragments[idx].length;
        }
        selection.setBaseAndExtent(
            selection.anchorNode, 
            selection.anchorOffset, 
            selection.anchorNode, 
            spanOffset
        );
    }

    const range = selection.getRangeAt(0);
    const rangeVals = {
        rangeIndices: [range.startOffset, range.endOffset], 
        startNode: range.startContainer, 
        endNode: range.endContainer
    }
    saveRangeRef(rangeVals);
    createHighlightedSpan(range);
    selection.removeAllRanges();
}

function createHighlightedSpan(range) {
    let span = document.createElement("span");

    const id = generateId();
    span.setAttribute("id", id);
    span.setAttribute("class", "placeSaverHighlight");
    span.appendChild(range.extractContents());

    range.insertNode(span);
    removeOldSpan();

    // the span we had before is cached and the node still believes the old span exists
    // (not good!) Get the span again to change it's mind
    span = document.getElementById(id);
 
    span.scrollIntoView({behavior: "smooth"});
    oldId = id;
}

function spanFromTreeObj(treeObj) {
    // removeOldSpan();
    const startNode = nodeFromPosArr(treeObj['startPos']);
    const endNode = nodeFromPosArr(treeObj['endPos']);
    const rangeVals = treeObj['rangeIndices'];
    const range = document.createRange();
    range.setStart(startNode, rangeVals[0]);
    range.setEnd(endNode, rangeVals[1]);
    createHighlightedSpan(range);
}


function saveRangeRef(rangeVals) {
    const treeObj = getTreeRef(rangeVals);
    const size = new TextEncoder().encode(JSON.stringify(treeObj)).length;
    localStorage.treeObj = JSON.stringify(treeObj);
}

function removeOldSpan() {
    if (oldId) {
        let oldSpan = document.getElementById(oldId);
        oldSpan.outerHTML = oldSpan.innerHTML;
        // when the old and new span overlap, a new tag is created at the intersection and so
        // the span lives on parasitically. By checking twice, we eliminate this case.
        oldSpan = document.getElementById(oldId);
        if (oldSpan) {
            oldSpan.outerHTML = oldSpan.innerHTML;
        }
    }
}


const storedTreeObj = localStorage.getItem("treeObj");
if (storedTreeObj) {
    const lastTreeObj = JSON.parse(storedTreeObj);
    spanFromTreeObj(lastTreeObj)
}
