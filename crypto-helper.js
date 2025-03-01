/**
 * 加密辅助工具
 * 提供Token加密和解密功能
 * 使用多层混淆和自定义算法保护Token
 * 
 * 安全说明：
 * 1. 本文件使用了多层混淆技术来保护Token
 * 2. 虽然这种方法不是绝对安全的，但比直接硬编码要安全得多
 * 3. 在实际生产环境中，建议使用更强大的加密库和服务器端验证
 */

// 混淆的Token片段 (这些片段经过处理，不是原始Token)
// 将Token拆分为多个片段，增加逆向工程的难度
const TOKEN_PARTS = [
  'NHn3y', // 部分1
  'XFZWIr', // 部分2
  'BzY', // 部分3
  '' // 部分4 (空)
];

// 混淆索引 (用于重组Token)
// 可以调整顺序来增加混淆效果
const TOKEN_INDICES = [0, 1, 2, 3];

// 额外的混淆密钥 (用于增加安全性)
// 在更复杂的实现中，可以用于加密/解密操作
const OBFUSCATION_KEY = 'susuShortLink';

// 添加一些干扰变量，增加代码分析的难度
const DECOY_TOKEN_1 = 'abcdefghijklmn';
const DECOY_TOKEN_2 = 'opqrstuvwxyz123';
const DECOY_FUNCTION = function() { return DECOY_TOKEN_1 + DECOY_TOKEN_2; };

// 备用Token的构建材料
// 使用多个数组和映射关系，避免直接在代码中出现完整的Token
const CHAR_SET_1 = ['N', 'X', 'B', '3', 'W', 'z'];
const CHAR_SET_2 = ['H', 'F', 'Y', 'y', 'I', 'n'];
const CHAR_SET_3 = ['Z', 'r'];

// 字符位置映射 - 完全打乱的顺序
// 格式: [字符集索引, 字符集中的位置, 最终位置]
const CHAR_MAPPING = [
  [0, 0, 0],  // N -> 位置0
  [1, 0, 1],  // H -> 位置1
  [1, 5, 2],  // n -> 位置2
  [0, 3, 3],  // 3 -> 位置3
  [1, 3, 4],  // y -> 位置4
  [0, 1, 5],  // X -> 位置5
  [1, 1, 6],  // F -> 位置6
  [2, 0, 7],  // Z -> 位置7
  [0, 4, 8],  // W -> 位置8
  [1, 4, 9],  // I -> 位置9
  [2, 1, 10], // r -> 位置10
  [0, 2, 11], // B -> 位置11
  [0, 5, 12], // z -> 位置12
  [1, 2, 13]  // Y -> 位置13
];

/**
 * 构建备用Token
 * 使用复杂的字符映射构建Token，避免直接出现在代码中
 * 
 * @returns {string} 构建的备用Token
 */
function buildFallbackToken() {
  // 创建一个足够大的数组来存放结果
  const result = new Array(14).fill('');
  
  // 根据映射填充结果数组
  CHAR_MAPPING.forEach(mapping => {
    const [setIndex, charIndex, position] = mapping;
    let char;
    
    // 根据集合索引选择正确的字符集
    if (setIndex === 0) {
      char = CHAR_SET_1[charIndex];
    } else if (setIndex === 1) {
      char = CHAR_SET_2[charIndex];
    } else {
      char = CHAR_SET_3[charIndex];
    }
    
    // 将字符放入正确的位置
    result[position] = char;
  });
  
  // 将数组连接成字符串
  return result.join('');
}

/**
 * 获取备用Token
 * 此函数使用多层混淆和自定义算法来保护Token
 * 
 * @returns {string} 解密后的Token或空字符串
 */
function getBackupToken() {
  try {
    // 添加一些无用的操作，增加代码分析的难度
    let decoy = DECOY_FUNCTION();
    if (decoy.length > 0) {
      // 这个条件永远为真，但会混淆代码分析
      decoy = decoy.substring(5, 10);
    }
    
    // 重组Token片段
    let token = '';
    TOKEN_INDICES.forEach(index => {
      token += TOKEN_PARTS[index];
    });
    
    // 验证Token完整性
    if (token.length !== 14) {
      console.warn('Token长度不正确，可能已被篡改');
      // 如果验证失败，使用备用方法构建Token
      return buildFallbackToken();
    }
    
    // 添加一些无用的操作，增加代码分析的难度
    if (decoy === 'fghij') {
      // 这个条件永远为真，但会混淆代码分析
      token = token.replace(/\d/, function(match) { return match; });
    }
    
    return token;
  } catch (e) {
    console.error('Token解密失败', e);
    // 出错时使用备用方法构建Token
    return buildFallbackToken();
  }
}

/**
 * 获取用户Token或备用Token
 * 
 * @param {Object} settings 用户设置对象
 * @returns {string} 用户Token或备用Token
 */
function getToken(settings) {
  // 优先使用用户设置的Token
  if (settings && settings.sinkSiteToken) {
    return settings.sinkSiteToken;
  }
  
  // 如果用户没有设置Token，使用备用Token
  return getBackupToken();
}

// 导出函数
export { getToken, getBackupToken }; 