import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('Jobs Optima Extension: Background script loaded');

  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    
    chrome.storage.local.get(['token', 'user'], (result) => {
      if (result.token) {
        console.log('User already authenticated');
      } else {
        console.log('User needs to authenticate');
      }
    });
  });

  // Open side panel when extension icon is clicked
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});