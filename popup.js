document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('url');
  const shortenButton = document.getElementById('shorten');
  const resultDiv = document.getElementById('result');
  const shortUrlInput = document.getElementById('shortUrl');
  const copyButton = document.getElementById('copy');
  const errorDiv = document.getElementById('error');
  const useCustomSlugCheckbox = document.getElementById('useCustomSlug');
  const customSlugContainer = document.getElementById('customSlugContainer');
  const customSlugInput = document.getElementById('customSlug');
  const tabCreate = document.getElementById('tab-create');
  const tabHistory = document.getElementById('tab-history');
  const tabSettings = document.getElementById('tab-settings');
  const createSection = document.getElementById('create-section');
  const historySection = document.getElementById('history-section');
  const settingsSection = document.getElementById('settings-section');
  const historyList = document.getElementById('historyList');
  const emptyHistory = document.getElementById('emptyHistory');
  const saveSettingsButton = document.getElementById('save-settings');
  const dubcoApiKeyInput = document.getElementById('dubco-api-key');
  const tinyurlApiKeyInput = document.getElementById('tinyurl-api-key');
  const sinkSiteTokenInput = document.getElementById('sink-site-token');
  const settingsErrorDiv = document.getElementById('settings-error');
  const serviceSinkRadio = document.getElementById('service-sink');
  const serviceDubcoRadio = document.getElementById('service-dubco');
  const serviceTinyurlRadio = document.getElementById('service-tinyurl');
  const serviceWzmyRadio = document.getElementById('service-wzmy');
  const defaultServiceSinkRadio = document.getElementById('default-service-sink');
  const defaultServiceDubcoRadio = document.getElementById('default-service-dubco');
  const defaultServiceTinyurlRadio = document.getElementById('default-service-tinyurl');
  const defaultServiceWzmyRadio = document.getElementById('default-service-wzmy');
  const serviceInfoDiv = document.getElementById('serviceInfo');
  
  // 确认对话框元素
  const confirmDialog = document.getElementById('confirm-dialog');
  const confirmOkButton = document.getElementById('confirm-ok');
  const confirmCancelButton = document.getElementById('confirm-cancel');
  
  // 当前要删除的历史记录索引
  let currentDeleteIndex = -1;
  
  // API端点
  const SINK_API_ENDPOINT = 'https://s.brmys.cn/api/link/create';
  const SINK_API_FALLBACK_ENDPOINT = 'https://s.brmys.cn/api/link/create/anonymous';
  const DUBCO_API_ENDPOINT = 'https://api.dub.co/links';
  const TINYURL_API_ENDPOINT = 'https://api.tinyurl.com/create';
  const WZMY_API_ENDPOINT = 'https://wz.my/';
  // 存储历史记录的键名
  const HISTORY_STORAGE_KEY = 'susu_shortlink_history';
  // 存储设置的键名
  const SETTINGS_STORAGE_KEY = 'susu_shortlink_settings';
  
  // 导入加密辅助函数
  import('./crypto-helper.js')
    .then(module => {
      window.cryptoHelper = module;
    })
    .catch(error => {
      console.error('加载加密模块失败', error);
    });
  
  // 加载设置
  loadSettings();
  
  // 加载历史记录
  loadHistory();
  
  // 获取当前标签页的URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    urlInput.value = currentUrl;
  });
  
  // 自定义短码复选框事件
  useCustomSlugCheckbox.addEventListener('change', function() {
    customSlugContainer.style.display = this.checked ? 'block' : 'none';
    if (this.checked) {
      customSlugInput.focus();
    }
  });
  
  // 标签切换事件
  tabCreate.addEventListener('click', function() {
    tabCreate.classList.add('active');
    tabHistory.classList.remove('active');
    tabSettings.classList.remove('active');
    createSection.style.display = 'block';
    historySection.style.display = 'none';
    settingsSection.style.display = 'none';
  });
  
  tabHistory.addEventListener('click', function() {
    tabHistory.classList.add('active');
    tabCreate.classList.remove('active');
    tabSettings.classList.remove('active');
    historySection.style.display = 'block';
    createSection.style.display = 'none';
    settingsSection.style.display = 'none';
    loadHistory();
  });
  
  tabSettings.addEventListener('click', function() {
    tabSettings.classList.add('active');
    tabCreate.classList.remove('active');
    tabHistory.classList.remove('active');
    settingsSection.style.display = 'block';
    createSection.style.display = 'none';
    historySection.style.display = 'none';
    loadSettings();
  });
  
  // 加载设置
  function loadSettings() {
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], function(result) {
      const settings = result[SETTINGS_STORAGE_KEY] || { defaultService: 'wzmy', dubcoApiKey: '', tinyurlApiKey: '', sinkSiteToken: '' };
      
      // 设置默认服务
      if (settings.defaultService === 'sink') {
        defaultServiceSinkRadio.checked = true;
      } else if (settings.defaultService === 'dubco') {
        defaultServiceDubcoRadio.checked = true;
      } else if (settings.defaultService === 'tinyurl') {
        defaultServiceTinyurlRadio.checked = true;
      } else {
        defaultServiceWzmyRadio.checked = true;
      }
      
      // 设置API密钥
      dubcoApiKeyInput.value = settings.dubcoApiKey || '';
      tinyurlApiKeyInput.value = settings.tinyurlApiKey || '';
      sinkSiteTokenInput.value = settings.sinkSiteToken || '';
      
      // 根据默认设置选择当前服务
      if (settings.defaultService === 'sink') {
        serviceSinkRadio.checked = true;
      } else if (settings.defaultService === 'dubco') {
        serviceDubcoRadio.checked = true;
      } else if (settings.defaultService === 'tinyurl') {
        serviceTinyurlRadio.checked = true;
      } else {
        serviceWzmyRadio.checked = true;
      }
    });
  }
  
  // 保存设置
  saveSettingsButton.addEventListener('click', function() {
    let defaultService = 'sink';
    if (defaultServiceDubcoRadio.checked) {
      defaultService = 'dubco';
    } else if (defaultServiceTinyurlRadio.checked) {
      defaultService = 'tinyurl';
    } else if (defaultServiceWzmyRadio.checked) {
      defaultService = 'wzmy';
    }
    
    const dubcoApiKey = dubcoApiKeyInput.value.trim();
    const tinyurlApiKey = tinyurlApiKeyInput.value.trim();
    const sinkSiteToken = sinkSiteTokenInput.value.trim();
    
    // 如果选择了Dub.co作为默认服务，但没有提供API密钥
    if (defaultService === 'dubco' && !dubcoApiKey) {
      showSettingsError('使用Dub.co服务需要提供API密钥');
      return;
    }
    
    // 如果选择了TinyURL作为默认服务，但没有提供API密钥
    if (defaultService === 'tinyurl' && !tinyurlApiKey) {
      showSettingsError('使用TinyURL服务需要提供API密钥');
      return;
    }
    
    // 不再要求Sink服务必须提供Token
    // if (defaultService === 'sink' && !sinkSiteToken) {
    //   showSettingsError('使用Sink服务需要提供Site Token');
    //   return;
    // }
    
    // 保存设置
    const settings = {
      defaultService: defaultService,
      dubcoApiKey: dubcoApiKey,
      tinyurlApiKey: tinyurlApiKey,
      sinkSiteToken: sinkSiteToken
    };
    
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings }, function() {
      // 更新当前服务选择
      if (defaultService === 'dubco') {
        serviceDubcoRadio.checked = true;
      } else if (defaultService === 'tinyurl') {
        serviceTinyurlRadio.checked = true;
      } else if (defaultService === 'wzmy') {
        serviceWzmyRadio.checked = true;
      } else {
        serviceSinkRadio.checked = true;
      }
      
      // 显示保存成功提示
      settingsErrorDiv.textContent = '设置已保存';
      settingsErrorDiv.style.color = '#10b981';
      settingsErrorDiv.style.backgroundColor = '#d1fae5';
      settingsErrorDiv.style.display = 'block';
      
      setTimeout(() => {
        settingsErrorDiv.style.display = 'none';
      }, 2000);
    });
  });
  
  // 缩短URL按钮点击事件
  shortenButton.addEventListener('click', function() {
    const url = urlInput.value;
    if (!url) {
      showError('URL不能为空');
      return;
    }
    
    // 禁用按钮，显示加载状态
    shortenButton.disabled = true;
    shortenButton.textContent = '处理中...';
    
    // 获取当前选择的服务
    let selectedService = 'sink';
    if (serviceDubcoRadio.checked) {
      selectedService = 'dubco';
    } else if (serviceTinyurlRadio.checked) {
      selectedService = 'tinyurl';
    } else if (serviceWzmyRadio.checked) {
      selectedService = 'wzmy';
    }
    
    // 根据选择的服务调用不同的API
    if (selectedService === 'dubco') {
      createDubcoShortLink(url);
    } else if (selectedService === 'tinyurl') {
      createTinyurlShortLink(url);
    } else if (selectedService === 'wzmy') {
      createWzmyShortLink(url);
    } else {
      createSinkShortLink(url);
    }
  });
  
  // 创建Sink短链接
  function createSinkShortLink(url) {
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
      
      // 准备请求数据
      const requestData = {
        url: url
      };
      
      // 如果使用自定义短码且输入了内容
      if (useCustomSlugCheckbox.checked && customSlugInput.value.trim()) {
        requestData.slug = customSlugInput.value.trim();
      }
      
      // 设置请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${siteToken}`
      };
      
      // 调用API创建短链接
      fetch(SINK_API_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            // 如果是401错误，尝试使用备用API
            console.log('主API需要授权，尝试使用备用API...');
            return fetch(SINK_API_FALLBACK_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestData)
            }).then(fallbackResponse => {
              if (!fallbackResponse.ok) {
                return fallbackResponse.json().then(data => {
                  throw new Error(data.message || data.statusText || '创建短链接失败');
                }).catch(e => {
                  throw new Error('创建短链接失败，请检查网络连接或联系管理员');
                });
              }
              return fallbackResponse.json();
            });
          }
          
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
        const slug = data.link.slug;
        shortUrlInput.value = shortLink;
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // 显示服务信息
        serviceInfoDiv.textContent = '由 Sink 提供服务';
        
        // 创建历史记录数据
        const historyData = {
          originalUrl: url,
          shortUrl: shortLink,
          slug: slug,
          service: 'sink',
          createdAt: new Date().toISOString()
        };
        
        console.log('准备保存Sink历史记录:', JSON.stringify(historyData));
        
        // 直接操作存储，不使用saveToHistory函数
        chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
          let history = result[HISTORY_STORAGE_KEY] || [];
          
          // 确保history是数组
          if (!Array.isArray(history)) {
            console.warn('历史记录不是数组，重置为空数组');
            history = [];
          }
          
          console.log('当前历史记录数量:', history.length);
          
          // 检查是否已存在相同的短链接
          const existingIndex = history.findIndex(item => item && item.shortUrl === shortLink);
          if (existingIndex !== -1) {
            // 如果存在，更新记录
            console.log('更新已存在的Sink历史记录:', existingIndex);
            history[existingIndex] = historyData;
          } else {
            // 如果不存在，添加到历史记录
            console.log('添加新的Sink历史记录');
            history.unshift(historyData);
          }
          
          // 限制历史记录数量，最多保存20条
          if (history.length > 20) {
            history = history.slice(0, 20);
          }
          
          console.log('保存Sink历史记录，数量:', history.length);
          
          // 保存到本地存储
          chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
            console.log('Sink历史记录保存成功');
            
            // 如果当前在历史记录页面，重新加载历史记录
            if (historySection.style.display === 'block') {
              loadHistory();
            }
          });
        });
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
  }
  
  // 创建Dub.co短链接
  function createDubcoShortLink(url) {
    // 获取Dub.co API密钥
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], function(result) {
      const settings = result[SETTINGS_STORAGE_KEY] || { dubcoApiKey: '' };
      const apiKey = settings.dubcoApiKey;
      
      if (!apiKey) {
        showError('请先在设置中配置Dub.co API密钥');
        shortenButton.disabled = false;
        shortenButton.textContent = '缩短';
        return;
      }
      
      // 准备请求数据
      const requestData = {
        url: url,
        domain: 'dub.sh' // 使用默认域名，也可以根据需要修改
      };
      
      // 如果使用自定义短码且输入了内容
      if (useCustomSlugCheckbox.checked && customSlugInput.value.trim()) {
        requestData.key = customSlugInput.value.trim();
      }
      
      // 调用Dub.co API创建短链接
      fetch(DUBCO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || data.message || '创建Dub.co短链接失败');
          });
        }
        return response.json();
      })
      .then(data => {
        // 详细记录API响应，用于调试
        console.log('Dub.co API完整响应:', JSON.stringify(data));
        
        // 确保我们获取正确的短链接URL
        let shortLink;
        let key = data.key || '';
        let domain = data.domain || 'dub.sh';
        let linkId = data.id || '';
        
        // 尝试多种可能的字段名称
        if (data.shortUrl) {
          shortLink = data.shortUrl;
        } else if (data.url && data.url !== url) {
          // 如果返回的URL与原始URL不同，可能是短链接
          shortLink = data.url;
        } else if (data.link && data.link.url) {
          shortLink = data.link.url;
        } else if (key) {
          // 如果有key，我们可以构建短链接
          shortLink = `https://${domain}/${key}`;
        } else {
          // 如果无法确定短链接，尝试从其他字段提取
          for (const prop in data) {
            if (typeof data[prop] === 'string' && 
                data[prop].startsWith('http') && 
                data[prop] !== url &&
                (data[prop].includes('dub.sh') || data[prop].includes('dub.co'))) {
              shortLink = data[prop];
              break;
            }
          }
          
          // 如果仍然找不到，使用默认构建方式
          if (!shortLink) {
            // 尝试从响应中找到key
            if (data.id) key = data.id;
            else if (data.slug) key = data.slug;
            
            shortLink = `https://${domain}/${key}`;
          }
        }
        
        console.log('提取的短链接:', shortLink);
        console.log('原始URL:', url);
        
        // 确保我们不会显示原始URL作为短链接
        if (shortLink === url || !shortLink) {
          // 如果无法从响应中获取短链接，尝试通过查询API获取
          if (linkId || key) {
            return fetchDubcoLinkDetails(apiKey, linkId || key)
              .then(linkData => {
                if (linkData && linkData.url) {
                  return linkData.url;
                }
                // 如果单个链接查询失败，尝试查询所有链接
                return fetchRecentDubcoLinks(apiKey, url)
                  .then(recentLink => {
                    if (recentLink) {
                      return recentLink;
                    }
                    return `https://${domain}/${key}`;
                  })
                  .catch(err => {
                    console.error('获取最近链接失败:', err);
                    return `https://${domain}/${key}`;
                  });
              })
              .catch(err => {
                console.error('获取链接详情失败:', err);
                // 如果单个链接查询失败，尝试查询所有链接
                return fetchRecentDubcoLinks(apiKey, url)
                  .then(recentLink => {
                    if (recentLink) {
                      return recentLink;
                    }
                    return `https://${domain}/${key}`;
                  })
                  .catch(err => {
                    console.error('获取最近链接失败:', err);
                    return `https://${domain}/${key}`;
                  });
              });
          }
          shortLink = `https://${domain}/${key}`;
        }
        
        return shortLink;
      })
      .then(shortLink => {
        shortUrlInput.value = shortLink;
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // 显示服务信息
        serviceInfoDiv.textContent = '由 Dub.co 提供服务';
        
        // 提取key部分
        let key = shortLink.split('/').pop();
        
        // 创建历史记录数据
        const historyData = {
          originalUrl: url,
          shortUrl: shortLink,
          slug: key,
          service: 'dubco',
          createdAt: new Date().toISOString()
        };
        
        console.log('准备保存Dub.co历史记录:', JSON.stringify(historyData));
        
        // 直接操作存储，不使用saveToHistory函数
        chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
          let history = result[HISTORY_STORAGE_KEY] || [];
          
          // 确保history是数组
          if (!Array.isArray(history)) {
            console.warn('历史记录不是数组，重置为空数组');
            history = [];
          }
          
          console.log('当前历史记录数量:', history.length);
          
          // 检查是否已存在相同的短链接
          const existingIndex = history.findIndex(item => item && item.shortUrl === shortLink);
          if (existingIndex !== -1) {
            // 如果存在，更新记录
            console.log('更新已存在的Dub.co历史记录:', existingIndex);
            history[existingIndex] = historyData;
          } else {
            // 如果不存在，添加到历史记录
            console.log('添加新的Dub.co历史记录');
            history.unshift(historyData);
          }
          
          // 限制历史记录数量，最多保存20条
          if (history.length > 20) {
            history = history.slice(0, 20);
          }
          
          console.log('保存Dub.co历史记录，数量:', history.length);
          
          // 保存到本地存储
          chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
            console.log('Dub.co历史记录保存成功');
            
            // 如果当前在历史记录页面，重新加载历史记录
            if (historySection.style.display === 'block') {
              loadHistory();
            }
          });
        });
      })
      .catch(error => {
        console.error('Dub.co API错误:', error);
        showError(error.message);
      })
      .finally(() => {
        // 恢复按钮状态
        shortenButton.disabled = false;
        shortenButton.textContent = '缩短';
      });
    });
  }
  
  // 获取Dub.co链接详情
  function fetchDubcoLinkDetails(apiKey, linkId) {
    return fetch(`https://api.dub.co/links/${linkId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('获取链接详情失败');
      }
      return response.json();
    });
  }
  
  // 获取最近创建的Dub.co链接
  function fetchRecentDubcoLinks(apiKey, originalUrl, retryCount = 0) {
    return fetch('https://api.dub.co/links?sort=createdAt&direction=desc&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('获取链接列表失败');
      }
      return response.json();
    })
    .then(data => {
      console.log('最近链接列表:', data);
      
      // 查找匹配原始URL的链接
      if (data && data.links && Array.isArray(data.links)) {
        // 首先尝试精确匹配
        const exactMatch = data.links.find(link => link.url === originalUrl);
        if (exactMatch) {
          const domain = exactMatch.domain || 'dub.sh';
          return `https://${domain}/${exactMatch.key}`;
        }
        
        // 如果没有精确匹配，返回最近创建的链接
        if (data.links.length > 0) {
          const mostRecent = data.links[0];
          const domain = mostRecent.domain || 'dub.sh';
          return `https://${domain}/${mostRecent.key}`;
        }
      }
      
      // 如果没有找到匹配的链接，并且重试次数小于3，则延迟后重试
      if (retryCount < 3) {
        console.log(`未找到匹配链接，${retryCount + 1}秒后重试...`);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(fetchRecentDubcoLinks(apiKey, originalUrl, retryCount + 1));
          }, (retryCount + 1) * 1000); // 逐渐增加延迟时间
        });
      }
      
      return null;
    });
  }
  
  // 创建TinyURL短链接
  function createTinyurlShortLink(url) {
    // 获取TinyURL API密钥
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], function(result) {
      const settings = result[SETTINGS_STORAGE_KEY] || { tinyurlApiKey: '' };
      const apiKey = settings.tinyurlApiKey;
      
      if (!apiKey) {
        showError('请先在设置中配置TinyURL API密钥');
        shortenButton.disabled = false;
        shortenButton.textContent = '缩短';
        return;
      }
      
      // 准备请求数据
      const requestData = {
        url: url,
        domain: "tinyurl.com"
      };
      
      // 如果使用自定义短码且输入了内容
      if (useCustomSlugCheckbox.checked && customSlugInput.value.trim()) {
        requestData.alias = customSlugInput.value.trim();
      }
      
      console.log('TinyURL请求数据:', JSON.stringify(requestData));
      
      // 调用TinyURL API创建短链接
      fetch(TINYURL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.errors?.[0]?.message || data.message || '创建TinyURL短链接失败');
          }).catch(e => {
            throw new Error('创建TinyURL短链接失败: ' + e.message);
          });
        }
        return response.json();
      })
      .then(data => {
        // 详细记录API响应，用于调试
        console.log('TinyURL API完整响应:', JSON.stringify(data));
        
        // 确保data和data.data存在
        if (!data || !data.data) {
          throw new Error('TinyURL API返回的数据格式不正确');
        }
        
        // 获取短链接URL
        const shortLink = data.data.tiny_url;
        if (!shortLink) {
          throw new Error('TinyURL API返回的数据中没有短链接URL');
        }
        
        const alias = data.data.alias || shortLink.split('/').pop();
        
        console.log('TinyURL生成的短链接:', shortLink);
        console.log('TinyURL生成的短码:', alias);
        
        shortUrlInput.value = shortLink;
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // 显示服务信息
        serviceInfoDiv.textContent = '由 TinyURL 提供服务';
        
        // 记录历史数据
        const historyData = {
          originalUrl: url,
          shortUrl: shortLink,
          slug: alias,
          service: 'tinyurl',
          createdAt: new Date().toISOString()
        };
        
        console.log('准备保存TinyURL历史记录:', JSON.stringify(historyData));
        
        // 直接操作存储，不使用saveToHistory函数
        chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
          let history = result[HISTORY_STORAGE_KEY] || [];
          
          // 确保history是数组
          if (!Array.isArray(history)) {
            console.warn('历史记录不是数组，重置为空数组');
            history = [];
          }
          
          console.log('当前历史记录数量:', history.length);
          
          // 检查是否已存在相同的短链接
          const existingIndex = history.findIndex(item => item && item.shortUrl === shortLink);
          if (existingIndex !== -1) {
            // 如果存在，更新记录
            console.log('更新已存在的TinyURL历史记录:', existingIndex);
            history[existingIndex] = historyData;
          } else {
            // 如果不存在，添加到历史记录
            console.log('添加新的TinyURL历史记录');
            history.unshift(historyData);
          }
          
          // 限制历史记录数量，最多保存20条
          if (history.length > 20) {
            history = history.slice(0, 20);
          }
          
          console.log('保存TinyURL历史记录，数量:', history.length);
          console.log('TinyURL历史记录详情:', JSON.stringify(history.slice(0, 3)));
          
          // 保存到本地存储
          chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
            console.log('TinyURL历史记录保存成功');
            
            // 强制重新加载历史记录
            loadHistory();
            
            // 如果当前在历史记录页面，显示提示
            if (historySection.style.display === 'block') {
              console.log('当前在历史记录页面，已重新加载');
            } else {
              console.log('当前不在历史记录页面');
            }
          });
        });
      })
      .catch(error => {
        console.error('TinyURL API错误:', error);
        showError(error.message);
      })
      .finally(() => {
        // 恢复按钮状态
        shortenButton.disabled = false;
        shortenButton.textContent = '缩短';
      });
    });
  }
  
  // 创建WZ.my短链接
  function createWzmyShortLink(url) {
    // 准备请求数据
    const formData = new FormData();
    formData.append('url', url);
    
    // 如果使用自定义短码且输入了内容
    let customSlug = '';
    if (useCustomSlugCheckbox.checked && customSlugInput.value.trim()) {
      customSlug = customSlugInput.value.trim();
      formData.append('keyword', customSlug);
    }
    
    // 调用WZ.my创建短链接
    fetch(WZMY_API_ENDPOINT, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('创建WZ.my短链接失败');
      }
      return response.text();
    })
    .then(html => {
      // 从HTML响应中提取短链接
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const shortLinkInput = doc.getElementById('copylink');
      
      if (!shortLinkInput || !shortLinkInput.value) {
        throw new Error('无法从响应中获取短链接');
      }
      
      const shortLink = shortLinkInput.value;
      console.log('WZ.my原始响应中的短链接:', shortLink);
      
      // 确保短链接是完整的URL
      let fullShortLink = shortLink;
      if (!shortLink.startsWith('http')) {
        fullShortLink = 'https://wz.my/' + shortLink;
      }
      
      // 确保正确提取短码
      let slug = '';
      if (customSlug) {
        // 如果使用了自定义短码，直接使用
        slug = customSlug;
      } else {
        // 否则从短链接中提取
        slug = shortLink.split('/').pop();
        // 如果短链接本身就是短码（没有/），直接使用
        if (slug === shortLink) {
          slug = shortLink;
        }
      }
      
      console.log('WZ.my生成的短链接:', fullShortLink);
      console.log('WZ.my生成的短码:', slug);
      
      shortUrlInput.value = fullShortLink;
      resultDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      
      // 显示服务信息
      serviceInfoDiv.textContent = '由 WZ.my 提供服务';
      
      // 创建历史记录数据
      const historyData = {
        originalUrl: url,
        shortUrl: fullShortLink,
        slug: slug,
        service: 'wzmy',
        createdAt: new Date().toISOString()
      };
      
      console.log('准备保存WZ.my历史记录:', JSON.stringify(historyData));
      
      // 直接操作存储，不使用saveToHistory函数
      chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
        let history = result[HISTORY_STORAGE_KEY] || [];
        
        // 确保history是数组
        if (!Array.isArray(history)) {
          console.warn('历史记录不是数组，重置为空数组');
          history = [];
        }
        
        console.log('当前历史记录数量:', history.length);
        
        // 检查是否已存在相同的短链接
        const existingIndex = history.findIndex(item => item && item.shortUrl === fullShortLink);
        if (existingIndex !== -1) {
          // 如果存在，更新记录
          console.log('更新已存在的WZ.my历史记录:', existingIndex);
          history[existingIndex] = historyData;
        } else {
          // 如果不存在，添加到历史记录
          console.log('添加新的WZ.my历史记录');
          history.unshift(historyData);
        }
        
        // 限制历史记录数量，最多保存20条
        if (history.length > 20) {
          history = history.slice(0, 20);
        }
        
        console.log('保存WZ.my历史记录，数量:', history.length);
        
        // 保存到本地存储
        chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
          console.log('WZ.my历史记录保存成功');
          
          // 如果当前在历史记录页面，重新加载历史记录
          if (historySection.style.display === 'block') {
            loadHistory();
          }
        });
      });
    })
    .catch(error => {
      console.error('WZ.my错误:', error);
      showError(error.message);
    })
    .finally(() => {
      // 恢复按钮状态
      shortenButton.disabled = false;
      shortenButton.textContent = '缩短';
    });
  }
  
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
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    resultDiv.style.display = 'none';
  }
  
  // 显示确认对话框
  function showConfirmDialog(index) {
    currentDeleteIndex = index;
    confirmDialog.classList.add('show');
  }
  
  // 隐藏确认对话框
  function hideConfirmDialog() {
    confirmDialog.classList.remove('show');
    currentDeleteIndex = -1;
  }
  
  // 确认按钮点击事件
  confirmOkButton.addEventListener('click', function() {
    if (currentDeleteIndex !== -1) {
      deleteHistoryItem(currentDeleteIndex);
    }
    hideConfirmDialog();
  });
  
  // 取消按钮点击事件
  confirmCancelButton.addEventListener('click', function() {
    hideConfirmDialog();
  });
  
  // 点击对话框外部关闭对话框
  confirmDialog.addEventListener('click', function(e) {
    if (e.target === confirmDialog) {
      hideConfirmDialog();
    }
  });
  
  // 删除历史记录项
  function deleteHistoryItem(index) {
    chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
      let history = result[HISTORY_STORAGE_KEY] || [];
      
      // 删除指定索引的历史记录
      if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        
        // 保存更新后的历史记录
        chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
          // 重新加载历史记录列表
          loadHistory();
        });
      }
    });
  }
  
  // 格式化日期
  function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay + '天前';
    } else if (diffHour > 0) {
      return diffHour + '小时前';
    } else if (diffMin > 0) {
      return diffMin + '分钟前';
    } else {
      return '刚刚';
    }
  }
  
  // 检查历史记录格式并修复
  function checkHistoryFormat() {
    chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
      const history = result[HISTORY_STORAGE_KEY];
      
      // 如果历史记录不存在或不是数组，重置为空数组
      if (!history || !Array.isArray(history)) {
        console.warn('历史记录格式不正确，重置为空数组');
        chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: [] });
        return;
      }
      
      // 检查历史记录中的每一项
      let needsFix = false;
      const fixedHistory = history.filter(item => {
        // 过滤掉无效的项目
        if (!item || typeof item !== 'object' || !item.shortUrl) {
          needsFix = true;
          console.warn('过滤无效的历史记录项:', item);
          return false;
        }
        return true;
      }).map(item => {
        // 确保所有必要字段都存在
        if (!item.service || !item.slug || !item.createdAt || !item.originalUrl) {
          needsFix = true;
          console.warn('修复不完整的历史记录项:', item);
          
          // 根据短链接URL判断服务类型
          let service = item.service || 'unknown';
          if (!service || service === 'unknown') {
            if (item.shortUrl.includes('tinyurl.com')) {
              service = 'tinyurl';
            } else if (item.shortUrl.includes('wz.my')) {
              service = 'wzmy';
            } else if (item.shortUrl.includes('dub.sh') || item.shortUrl.includes('dub.co')) {
              service = 'dubco';
            } else if (item.shortUrl.includes('s.brmys.cn')) {
              service = 'sink';
            }
          }
          
          // 特别处理WZ.my的历史记录
          let slug = item.slug;
          if (!slug) {
            if (item.shortUrl) {
              // 从短链接中提取slug
              slug = item.shortUrl.split('/').pop();
              console.log('从短链接中提取slug:', slug);
            }
          }
          
          return {
            shortUrl: item.shortUrl,
            service: service,
            slug: slug,
            originalUrl: item.originalUrl || '',
            createdAt: item.createdAt || new Date().toISOString()
          };
        }
        
        // 特别处理WZ.my的历史记录，确保所有WZ.my记录都有正确的slug
        if (item.service === 'wzmy' && !item.slug && item.shortUrl) {
          needsFix = true;
          const slug = item.shortUrl.split('/').pop();
          console.log('为WZ.my历史记录修复slug:', slug);
          return {
            ...item,
            slug: slug
          };
        }
        
        // 修复可能错误的服务类型 - 始终根据URL确定正确的服务类型
        let correctService = item.service;
        
        if (item.shortUrl.includes('tinyurl.com')) {
          correctService = 'tinyurl';
        } else if (item.shortUrl.includes('wz.my')) {
          correctService = 'wzmy';
        } else if (item.shortUrl.includes('dub.sh') || item.shortUrl.includes('dub.co')) {
          correctService = 'dubco';
        } else if (item.shortUrl.includes('s.brmys.cn')) {
          correctService = 'sink';
        }
        
        // 如果服务类型不正确，修复它
        if (correctService !== item.service) {
          needsFix = true;
          console.log(`修复历史记录的服务类型: 从 ${item.service} 改为 ${correctService}`);
          return {
            ...item,
            service: correctService
          };
        }
        
        return item;
      });
      
      // 如果需要修复，保存修复后的历史记录
      if (needsFix) {
        console.log('修复历史记录格式，修复前数量:', history.length, '修复后数量:', fixedHistory.length);
        chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: fixedHistory }, function() {
          // 重新加载历史记录列表
          if (historySection.style.display === 'block') {
            // 延迟一点时间再重新加载，确保存储操作完成
            setTimeout(loadHistory, 100);
          }
        });
      } else {
        console.log('历史记录格式正确，数量:', history.length);
      }
    });
  }
  
  // 加载历史记录
  function loadHistory() {
    console.log('开始加载历史记录...');
    
    // 先检查并修复历史记录格式
    checkHistoryFormat();
    
    // 清空历史记录列表
    while (historyList.firstChild) {
      historyList.removeChild(historyList.firstChild);
    }
    
    // 从存储中获取历史记录
    chrome.storage.local.get([HISTORY_STORAGE_KEY, SETTINGS_STORAGE_KEY], function(result) {
      const history = result[HISTORY_STORAGE_KEY] || [];
      const settings = result[SETTINGS_STORAGE_KEY] || { sinkSiteToken: '' };
      
      console.log('加载的历史记录数量:', history.length);
      if (history.length > 0) {
        console.log('第一条历史记录:', JSON.stringify(history[0]));
      }
      
      let validItemCount = 0;
      
      if (!history || history.length === 0) {
        // 如果没有历史记录，显示空状态
        historyList.appendChild(emptyHistory);
        console.log('没有历史记录，显示空状态');
      } else {
        // 如果有历史记录，显示列表
        history.forEach((item, index) => {
          // 跳过无效的历史记录项
          if (!item || !item.shortUrl) {
            console.warn('跳过无效的历史记录项:', index);
            return;
          }
          
          // 记录每个历史记录项的详细信息，用于调试
          console.log(`历史记录项 #${index}:`, JSON.stringify(item));
          
          validItemCount++;
          
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          
          const linkContainer = document.createElement('div');
          linkContainer.className = 'history-link-container';
          
          const link = document.createElement('a');
          link.className = 'history-link';
          link.href = item.shortUrl;
          link.textContent = item.shortUrl;
          link.title = `原始链接: ${item.originalUrl || '未知'}`;
          link.target = '_blank';
          
          const time = document.createElement('span');
          time.className = 'history-time';
          // 格式化日期时间
          const date = new Date(item.createdAt || new Date());
          time.textContent = formatDate(date);
          time.title = date.toLocaleString();
          
          // 创建服务标签
          const serviceTag = document.createElement('span');
          serviceTag.className = 'history-service-tag';
          
          // 根据服务类型设置不同的样式和文本
          switch(item.service) {
            case 'sink':
              serviceTag.textContent = 'Sink';
              serviceTag.style.backgroundColor = '#4285f4';
              break;
            case 'dubco':
              serviceTag.textContent = 'Dub.co';
              serviceTag.style.backgroundColor = '#0284c7';
              break;
            case 'tinyurl':
              serviceTag.textContent = 'TinyURL';
              serviceTag.style.backgroundColor = '#2563eb';
              break;
            case 'wzmy':
              serviceTag.textContent = 'WZ.my';
              serviceTag.style.backgroundColor = '#7c3aed';
              break;
            default:
              serviceTag.textContent = '未知';
              serviceTag.style.backgroundColor = '#6b7280';
          }
          
          // 创建操作按钮容器
          const actionsContainer = document.createElement('div');
          actionsContainer.className = 'history-actions';
          
          const stats = document.createElement('span');
          stats.className = 'history-stats';
          stats.textContent = '数据';
          stats.title = '查看链接访问数据';
          stats.addEventListener('click', function() {
            // 根据服务打开不同的数据分析页面
            if (item.service === 'dubco') {
              chrome.tabs.create({
                url: `https://dub.co/links/${item.slug}`
              });
            } else if (item.service === 'tinyurl') {
              chrome.tabs.create({
                url: `https://tinyurl.com/app/dashboard`
              });
            } else if (item.service === 'wzmy') {
              // 确保正确构建WZ.my统计页面URL
              let statsUrl = '';
              
              // 检查是否有短链接和短码
              if (!item.shortUrl && !item.slug) {
                alert('无法查看此WZ.my链接的统计数据，缺少必要信息');
                return;
              }
              
              // 直接使用短链接加上+号，这是WZ.my的标准统计页面格式
              if (item.shortUrl) {
                // 确保短链接是完整的URL
                if (item.shortUrl.startsWith('http')) {
                  // 从URL中提取短码部分
                  const urlParts = item.shortUrl.split('/');
                  const code = urlParts[urlParts.length - 1];
                  statsUrl = `https://wz.my/${code}+`;
                } else {
                  statsUrl = 'https://wz.my/' + item.shortUrl + '+';
                }
              } else if (item.slug) {
                // 如果只有短码，构建完整URL
                statsUrl = `https://wz.my/${item.slug}+`;
              }
              
              console.log('打开WZ.my统计页面:', statsUrl);
              
              // 直接在新标签页中打开统计页面
              chrome.tabs.create({
                url: statsUrl
              });
            } else if (item.service === 'sink') {
              // 对于Sink服务，需要使用Site Token
              const sinkSiteToken = settings.sinkSiteToken;
              if (!sinkSiteToken) {
                alert('请先在设置中配置Sink Site Token以查看数据');
                return;
              }
              chrome.tabs.create({
                url: `https://s.brmys.cn/dashboard/link?slug=${item.slug}&token=${sinkSiteToken}`
              });
            }
          });
          
          // 创建删除按钮
          const deleteBtn = document.createElement('span');
          deleteBtn.className = 'history-delete';
          deleteBtn.textContent = '×';
          deleteBtn.title = '删除此记录';
          deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 显示确认对话框
            showConfirmDialog(index);
          });
          
          linkContainer.appendChild(link);
          linkContainer.appendChild(time);
          linkContainer.appendChild(serviceTag);
          
          // 将操作按钮添加到操作容器
          actionsContainer.appendChild(stats);
          actionsContainer.appendChild(deleteBtn);
          
          historyItem.appendChild(linkContainer);
          historyItem.appendChild(actionsContainer);
          historyList.appendChild(historyItem);
        });
        
        console.log('渲染了有效历史记录数量:', validItemCount);
        
        // 如果没有有效的历史记录，显示空状态
        if (validItemCount === 0) {
          historyList.appendChild(emptyHistory);
          console.log('没有有效的历史记录，显示空状态');
        }
      }
    });
  }
  
  // 保存短链接到历史记录
  function saveToHistory(linkData) {
    console.log('saveToHistory被调用，数据:', JSON.stringify(linkData));
    
    // 验证linkData包含必要字段
    if (!linkData || !linkData.shortUrl) {
      console.error('保存历史记录失败: 缺少必要字段', linkData);
      return;
    }
    
    // 根据URL确定服务类型，这可以纠正可能的错误标记
    let service = linkData.service || 'unknown';
    
    if (linkData.shortUrl.includes('tinyurl.com')) {
      service = 'tinyurl';
    } else if (linkData.shortUrl.includes('wz.my')) {
      service = 'wzmy';
    } else if (linkData.shortUrl.includes('dub.sh') || linkData.shortUrl.includes('dub.co')) {
      service = 'dubco';
    } else if (linkData.shortUrl.includes('s.brmys.cn')) {
      service = 'sink';
    }
    
    const completeData = {
      shortUrl: linkData.shortUrl,
      service: service, // 使用修正后的服务类型
      slug: linkData.slug || linkData.shortUrl.split('/').pop(),
      originalUrl: linkData.originalUrl || '',
      createdAt: linkData.createdAt || new Date().toISOString()
    };
    
    // 记录完整的数据，用于调试
    console.log('完整的历史记录数据:', JSON.stringify(completeData));
    
    // 获取当前历史记录
    chrome.storage.local.get([HISTORY_STORAGE_KEY], function(result) {
      let history = result[HISTORY_STORAGE_KEY] || [];
      
      // 确保history是数组
      if (!Array.isArray(history)) {
        console.warn('历史记录不是数组，重置为空数组');
        history = [];
      }
      
      console.log('当前历史记录数量:', history.length);
      
      // 检查是否已存在相同的短链接
      const existingIndex = history.findIndex(item => item && item.shortUrl === completeData.shortUrl);
      if (existingIndex !== -1) {
        // 如果存在，更新记录
        console.log('更新已存在的历史记录:', existingIndex);
        history[existingIndex] = completeData;
      } else {
        // 如果不存在，添加到历史记录
        console.log('添加新的历史记录');
        history.unshift(completeData);
      }
      
      // 限制历史记录数量，最多保存20条
      if (history.length > 20) {
        history = history.slice(0, 20);
      }
      
      console.log('保存历史记录，数量:', history.length);
      console.log('历史记录详情:', JSON.stringify(history.slice(0, 3)));
      
      // 保存到本地存储
      chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history }, function() {
        console.log('历史记录保存成功');
        
        // 强制重新加载历史记录
        loadHistory();
        
        // 如果当前在历史记录页面，显示提示
        if (historySection.style.display === 'block') {
          console.log('当前在历史记录页面，已重新加载');
        } else {
          console.log('当前不在历史记录页面');
        }
      });
    });
  }
  
  // 初始加载
  loadSettings();
  
  // 检查历史记录格式
  checkHistoryFormat();
  
  // 加载历史记录
  loadHistory();
});

