document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('url');
  const shortenButton = document.getElementById('shorten');
  const resultDiv = document.getElementById('result');
  const shortUrlInput = document.getElementById('shortUrl');
  const copyButton = document.getElementById('copy');
  const errorElement = document.getElementById('error');
  
  // 存储设置的键名
  const SETTINGS_STORAGE_KEY = 'susu_shortlink_settings';
  // API端点
  const API_ENDPOINT = 'https://s.brmys.cn/api/link/create';
  
  // 导入加密辅助函数
  import('./crypto-helper.js')
    .then(module => {
      window.cryptoHelper = module;
    })
    .catch(error => {
      console.error('加载加密模块失败', error);
    });
  
  // 获取当前标签页的URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    urlInput.value = currentUrl;
  });
  
  // 缩短URL按钮点击事件
  shortenButton.addEventListener('click', function() {
    const url = urlInput.value;
    if (!url) {
      showError('URL不能为空');
      return;
    }
    
    // 获取Sink Site Token
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], function(result) {
      const settings = result[SETTINGS_STORAGE_KEY] || { sinkSiteToken: '' };
      
      // 使用加密辅助模块获取Token
      let siteToken = '';
      
      if (window.cryptoHelper) {
        // 如果加密模块已加载，使用它获取Token
        siteToken = window.cryptoHelper.getToken(settings);
      } else {
        // 如果加密模块未加载，使用备用方法
        siteToken = settings.sinkSiteToken || '';
        // 如果没有设置Token，尝试使用匿名API
        if (!siteToken) {
          console.log('加密模块未加载且未设置Token，将尝试使用匿名API');
        }
      }
      
      // 禁用按钮，显示加载状态
      shortenButton.disabled = true;
      shortenButton.textContent = '处理中...';
      
      // 设置请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${siteToken}`
      };
      
      // 调用API创建短链接
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          url: url
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || data.statusText || '创建短链接失败');
          }).catch(e => {
            // 如果解析JSON失败，返回一个通用错误
            throw new Error('创建短链接失败，请检查网络连接或联系管理员');
          });
        }
        return response.json();
      })
      .then(data => {
        // 显示结果
        const shortLink = data.shortLink || `https://s.brmys.cn/${data.link.slug}`;
        shortUrlInput.value = shortLink;
        resultDiv.style.display = 'block';
        errorElement.style.display = 'none';
      })
      .catch(error => {
        showError(error.message);
      })
      .finally(() => {
        // 恢复按钮状态
        shortenButton.disabled = false;
        shortenButton.textContent = '缩短';
      });
    });
  });
  
  // 复制按钮点击事件
  copyButton.addEventListener('click', function() {
    shortUrlInput.select();
    document.execCommand('copy');
    copyButton.textContent = '已复制';
    setTimeout(() => {
      copyButton.textContent = '复制';
    }, 2000);
  });
  
  // 显示错误信息
  function showError(message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    resultDiv.style.display = 'none';
  }
}); 