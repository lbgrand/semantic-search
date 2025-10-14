// background.js - Handles requests from the UI, runs the model, then sends back the response
import { pipeline, cos_sim } from '@huggingface/transformers';

class PipelineSingleton {
    static instance = null;
    static embeddingsMap = new Map();
    static indexedPageUrl = null;
    static initProgress = {
      status: 'initiate',
      progress: 0
    };

    static {
      chrome.storage.local.set({ modelInit: this.initProgress });
      chrome.storage.local.set({ indexingStatus: { 
        indexed: 0, 
        total: null, 
        url: null
      } });
      PipelineSingleton.getInstance(this.trackModelLoadingProgress);
    }

    static async getInstance(progress_callback = null) {
      this.instance ??= pipeline('feature-extraction', 'Xenova/jina-embeddings-v2-base-de', { 
        progress_callback: progress_callback,
        dtype: "fp32"  // Options: "fp32", "fp16", "q8", "q4"
      });

      return this.instance;
    }

    static trackModelLoadingProgress(data) {
      if (data.file === 'onnx/model.onnx') {
        switch (data.status) {
          case 'download':
            if (PipelineSingleton.initProgress.status !== 'download') {
              PipelineSingleton.initProgress.status = 'download';
              chrome.storage.local.set({ modelInit: data });
            }
            return;
          case 'progress':
            PipelineSingleton.initProgress.progress = data.progress;
            PipelineSingleton.initProgress.status = 'progress';
            chrome.storage.local.set({ modelInit: data });
            return;
          default:
            return;
        }
      } else if (data.status === 'ready') {
        chrome.storage.local.set({ modelInit: data });
      }
    }
}

const embed = async (text) => {
    let model = await PipelineSingleton.getInstance(PipelineSingleton.trackModelLoadingProgress);
    return await model(text, { pooling: 'mean', normalize: true });
};

// Listen for messages from the UI, process it, and send results back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == 'clear-index') {
      PipelineSingleton.embeddingsMap.clear();
      PipelineSingleton.indexedPageUrl = null;
      chrome.storage.local.set({ indexingStatus: { 
        indexed: 0, 
        total: null, 
        url: null
      } });
      sendResponse(true);
    }

    if (message.action == 'index') {
      (async function () {
        let result = await embed(message.text);
        PipelineSingleton.embeddingsMap.set(result.data, message.text);
        sendResponse(result);
      })();
    }
    
    if (message.action == 'query') {
      (async function () {
        let result = await embed(message.text);
        let similarityScores = [];
        for (let [embedding, text] of PipelineSingleton.embeddingsMap.entries()) {
          let score = cos_sim(result.data, embedding);
          similarityScores.push({ text, score });
        }
        similarityScores.sort((a, b) => b.score - a.score);
        sendResponse(similarityScores);
      })();
    }

    // return true to indicate we will send a response asynchronously
    return true;
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  await chrome.sidePanel.setOptions({
      tabId,
      path: 'popup.html',
      enabled: true
    });
});

const reloadTabs = async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url) return;
    await chrome.tabs.reload(tab.id);
  }
};
reloadTabs();

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
