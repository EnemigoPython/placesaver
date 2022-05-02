// globals
let port; // port to content script
let url;
let pageData // place tags for current url, loaded from storage

// HTML Elements
const btn = document.getElementById('hello');
const input = document.getElementById('tagInput');
const submitBtn = document.getElementById('submitBtn');
const placeTagList = document.getElementById('placeTagList');
const placeholder = document.getElementById('placeholder');
const warning = document.getElementById('warning');
const addNewTag = document.getElementById('addNewTag');


async function getCurrentTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(tabs[0]);
        });
    });
}

function getStrippedURL(tabUrl) {
    strippedUrl = new URL(tabUrl);
    strippedUrl = `${strippedUrl.protocol}//${strippedUrl.host}${strippedUrl.pathname}${strippedUrl.search}`; // strip hash
    return strippedUrl;
}

async function getStorage(key) {
    return new Promise ((resolve, reject) => {
        chrome.storage.sync.get(key, (valueObj) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // the return value is an object but we are only querying one value
            resolve(valueObj[key] ?? null);
        });
    });
}

async function getAllStorage() {
    return new Promise ((resolve, reject) => {
        chrome.storage.sync.get(null, (valueObj) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // return the entire object
            resolve(valueObj);
        });
    });
}

function loadPlaceTags() {
    placeTagList.removeChild(placeholder);
    if (pageData) {
        pageData.forEach(tag => {
            placeTagList.appendChild(newPlaceTagLabel(tag));
        });
    } else {
        placeTagList.appendChild(newPlaceTagLabel({ name: "No Place Tags found." }));
    }
}

function newPlaceTagLabel(tagData) {
    const placeTagLabel = document.createElement("li");
    const text = document.createTextNode(tagData.name);
    placeTagLabel.appendChild(text);
    placeTagLabel.className = "placeTagLabel";
    return placeTagLabel;
}

function savePlaceTag(name, treeRef) {
    const storageObj = { 
        name,
        startPos: treeRef.startPos,
        endPos: treeRef.endPos,
        rangeIndices: treeRef.rangeIndices
    };
    if (pageData) {
        pageData.push(storageObj);
    } else {
        pageData = [storageObj];
    }
    console.log(url, storageObj);
    chrome.storage.sync.set({ [url]: pageData }, () => {
        placeTagList.appendChild(newPlaceTagLabel(name));
    });
}

function showWarning(text='') {
    if (text) {
        warning.innerText = text;
    }
    warning.style.visibility = "visible";
}

function validateTagName(name) {
    // check existing names to see if there is a name conflict
    const existingNames = Array.from(placeTagList.children)
        .map(child => child.textContent);
    return name && !existingNames.includes(name);
}

function listenForSubmit() {
    addNewTag.addEventListener('submit', e => {
        const name = input.value;
        if (validateTagName(name)) {
            port.postMessage({ type: 'addTag', name });
            input.value = '';
        } else {
            showWarning("Place Tag name cannot be blank or duplicate.");
        }
        e.preventDefault();
    });
}

function listenForPortResponse() {
    port.onMessage.addListener(msg => {
        switch (msg.type) {
            case "addRes":
                if (msg.success) {
                    const treeRef = msg.treeRef;
                    savePlaceTag(msg.name, treeRef);
                } else {
                    showWarning(msg.text);
                }
                break;
        }
    });
}

// anonymous async function to call await
(async () => {
    const tab = await getCurrentTab();
    // the content script is not loaded on chrome pages, not entirely sure why...
    const isChromePage = tab.url.startsWith("chrome://");
    if (isChromePage) {
        // this has to be set in the js or it will override autofocus
        input.disabled = true;
        submitBtn.disabled = true;
    } else {
        url = getStrippedURL(tab.url);
        pageData = await getStorage(url);
        // console.log(url);
        // console.log(urlData);
        loadPlaceTags();
        warning.style.visibility = "hidden"; // hide the default warning
        port = chrome.tabs.connect(tab.id); // initialise port connection
        listenForSubmit(); // we only want to do this if the content script can be reached
        listenForPortResponse();
    }
})();
