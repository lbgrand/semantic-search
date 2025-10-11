// content.js - the content scripts which is run in the context of web pages, and has access to the DOM and other web APIs.
class PageIndexer {
  static indexed = 0;
}

async function indexPage() {
  PageIndexer.indexed = 0;
  const paragraphs = document.querySelectorAll('p');
  const paragraphsCount = paragraphs.length;
  if (paragraphs.length === 0) return;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    console.log(`content.js - Starting indexing paragraph: `, paragraph);
    if (!paragraph.textContent.trim()) continue;

    const message = {
      action: 'index',
      text: paragraph.textContent
    }

    const embedding = await chrome.runtime.sendMessage(message);
    console.log(`content.js - Indexed paragraph: `, embedding);
    PageIndexer.indexed++;
    chrome.storage.local.set({ indexingStatus: { 
      indexed: PageIndexer.indexed, 
      total: paragraphsCount, 
      url: window.location.href 
    } });
  }
}

async function clearIndex() {
  const result = await chrome.runtime.sendMessage({ action: 'clear-index' });
  console.log(`content.js - Cleared index: `, result);
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == 'trigger-index') {
    (async function () {
      if (await clearIndex()) await indexPage();
    })();
  }

  if (message.action == 'find-highlight') {
    const existingHighlight = document.getElementById('semantic-search-highlight');
    if (existingHighlight) {
      const parent = existingHighlight.parentNode;
      const text = existingHighlight.textContent;
      parent.removeChild(existingHighlight);
      parent.insertAdjacentText('afterbegin', text);
    }

    const textToFind = message.text;
    const paragraphs = document.querySelectorAll('p');
    const firstMatchingParagraph = Array.from(paragraphs).find(paragraph => paragraph.textContent.indexOf(textToFind) !== -1);
    if (firstMatchingParagraph) {
      const textContent = firstMatchingParagraph.textContent;
      const index = textContent.indexOf(textToFind);
      const newText = textContent.substring(0, index) + '<span id="semantic-search-highlight" style="background-color: #B2DFDB">' 
        + textContent.substring(index, index + textToFind.length) + '</span>' + textContent.substring(index + textToFind.length);
      firstMatchingParagraph.innerHTML = newText;
      firstMatchingParagraph.scrollIntoView({ block: 'center' });
    }
  }
  
  return false;
});
