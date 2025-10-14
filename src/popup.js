// popup.js - the UI scripts running each time the sidepanel is opened. When sidepanel is closed script context is destroyed.
const IndexingStatus = Object.freeze({
  NOT_LOADED: Symbol('NOT_LOADED'),
  LOADING: Symbol('LOADING'),
  LOADED: Symbol('LOADED'),
});

document.getElementById("query-button").addEventListener("click", searchPage);
async function searchPage() {
  if (await isIndexingDone() === IndexingStatus.NOT_LOADED) {
    const message = {
      action: 'trigger-index'
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  
    while (await isIndexingDone() !== IndexingStatus.LOADED) {}
  }

  const resultsElement = document.getElementById('results');
  resultsElement.innerHTML = '';

  const queryInputElement = document.getElementById('query-input');
  const query = queryInputElement.value;
  if (query.length === 0) return;

  const message = {
    action: 'query',
    text: query
  }

  chrome.runtime.sendMessage(message, (searchResults) => {
    const selectedResultsNumber = document.getElementById('result-number').value;
    if (selectedResultsNumber !== 'all') {
      searchResults = searchResults.slice(0, parseInt(selectedResultsNumber));
    }

    for (let result of searchResults) {
      const div = document.createElement('div');
      div.classList.add('md-result-card');
      resultsElement.appendChild(div);

      const scoreElement = document.createElement('span');
      scoreElement.classList.add('md-badge');
      scoreElement.textContent = (Math.round(result.score * 100) / 100).toFixed(2);
      div.appendChild(scoreElement);

      const mainText = document.createElement('span');
      mainText.addEventListener("click", findTextOnPage);
      div.appendChild(mainText);

      let selectedTextLength = document.getElementById('result-length').value;
      if (selectedTextLength === 'all') {
        mainText.appendChild(document.createTextNode(result.text));
      } else {
        selectedTextLength = parseInt(selectedTextLength);
        const textToDisplay = result.text.slice(0, selectedTextLength);
        mainText.appendChild(document.createTextNode(textToDisplay));
        if (result.text.length > selectedTextLength) {
          const dots = document.createElement('span');
          dots.appendChild(document.createTextNode('...'));
          div.appendChild(dots);
        }
      }
    }
  });
}

document.getElementById("query-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchPage();
  }
});

function findTextOnPage(event) {
  const text = event.target.textContent;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'find-highlight', text: text });
  });
}

async function isModelLoaded() {
  const data = await chrome.storage.local.get("modelInit");
  const progressData = data.modelInit;
  const modelStatusElement = document.getElementById('model-status');

  switch (progressData.status) {
    case 'initiate':
      modelStatusElement.textContent = 'Initialisiere KI Modell...';
      return false;
    case 'download':
      modelStatusElement.textContent = 'Lade KI Modell runter...';
      return false;
    case 'progress':
      modelStatusElement.textContent = `Bereite KI Modell vor: ${Math.round(progressData.progress)}%`;
      return false;
    case 'ready':
      modelStatusElement.textContent = 'KI Modell ist bereit';
      return true;
  }
}

async function isIndexingDone() {
  const data = await chrome.storage.local.get("indexingStatus");
  const indexing = data.indexingStatus;
  const indexingStatusElement = document.getElementById('indexing-status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (indexing.url !== tab.url) {
    indexingStatusElement.textContent = `Seite ist nicht indexiert`;
    return IndexingStatus.NOT_LOADED;
  }

  if (indexing.total > indexing.indexed) {
    indexingStatusElement.textContent = `${indexing.indexed} von ${indexing.total} Texten sind indexiert`;
    return IndexingStatus.LOADING;
  } else {
    indexingStatusElement.textContent = `Seite ist indexiert`;
    return IndexingStatus.LOADED;
  }
}

chrome.tabs.onActivated.addListener(async (tabId, info, tab) => {
  isIndexingDone();
});

async function init() {
  while (!(await isModelLoaded())) {}
  const indexingStatus = await isIndexingDone();

  const searchContainerElement = document.getElementById('search-container');
  const searchOptionsElement = document.getElementById('search-options');
  searchContainerElement.style.display = 'flex';
  searchOptionsElement.style.display = 'flex';

  if (indexingStatus === IndexingStatus.LOADING) {
    while (await isIndexingDone() !== IndexingStatus.LOADED) {}
  }
};

init();