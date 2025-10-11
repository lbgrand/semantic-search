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
    // Get the pipeline instance. This will load and build the model when run for the first time.
    let model = await PipelineSingleton.getInstance(PipelineSingleton.trackModelLoadingProgress);

    // Actually run the model on the input
    return await model(text, { pooling: 'mean', normalize: true });
};

// Listen for messages from the UI, process it, and send results back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log('background.js: message received: ', message);
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
      // Run model prediction asynchronously
      (async function () {
        // Perform embedding
        console.log(`background.js - Got text to index: `, message);
        let result = await embed(message.text);
        PipelineSingleton.embeddingsMap.set(result.data, message.text);

        // Send response back to UI
        console.log(`background.js - Indexed text: `, result);
        sendResponse(result);
      })();
    }
    
    if (message.action == 'query') {
      // Run model prediction asynchronously
      (async function () {
        // Perform embedding
        let result = await embed(message.text);
        let similarityScores = [];
        for (let [embedding, text] of PipelineSingleton.embeddingsMap.entries()) {
          let score = cos_sim(result.data, embedding);
          let insertIndex = similarityScores.findIndex(item => item.score < score);
          insertIndex === -1 ? similarityScores.push({score, text}) : similarityScores.splice(insertIndex, 0, {score, text});
        }
        similarityScores.sort((a, b) => b.score - a.score);
        sendResponse(similarityScores);
      })();
    }

    // return true to indicate we will send a response asynchronously
    return true;
});

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
