# 使用自定义图标的步骤

请按照以下步骤将您的"头像1.png"图片设置为扩展图标：

## 1. 准备图标文件

1. 将您的"头像1.png"复制到`browser-extension/icons/`目录下
2. 创建三个不同尺寸的版本：
   - 16x16像素：重命名为`icon16.png`
   - 48x48像素：重命名为`icon48.png`
   - 128x128像素：重命名为`icon128.png`

您可以使用以下任一方法创建不同尺寸的版本：

### 方法A：使用图像编辑软件（如Photoshop、GIMP等）

1. 打开"头像1.png"
2. 调整图像大小为所需尺寸（16x16、48x48、128x128）
3. 导出/保存为相应的文件名

### 方法B：使用在线工具

1. 访问在线图像调整工具，如 https://www.iloveimg.com/resize-image 或 https://www.resizepixel.com/
2. 上传"头像1.png"
3. 分别调整为16x16、48x48和128x128像素
4. 下载并重命名为相应的文件名

### 方法C：使用命令行工具（如果您安装了ImageMagick）

```bash
convert 头像1.png -resize 16x16 icons/icon16.png
convert 头像1.png -resize 48x48 icons/icon48.png
convert 头像1.png -resize 128x128 icons/icon128.png
```

## 2. 替换现有图标

确保以下文件已正确设置为使用PNG图标：

1. `manifest.json`：已修改为使用PNG图标
2. `popup.html`：已修改为使用PNG图标

## 3. 重新加载扩展

1. 在浏览器的扩展管理页面中，找到"Sink URL Shortener"扩展
2. 点击"重新加载"按钮（通常是一个刷新图标）
3. 如果扩展仍未显示图标，请尝试完全删除扩展，然后重新加载

## 4. 故障排除

如果图标仍然无法正确显示：

1. 确保图标文件存在于正确的位置
2. 检查图标文件的格式是否为PNG
3. 尝试使用不同的图像编辑工具创建图标
4. 查看浏览器控制台是否有相关错误信息

## 5. 简化方案

如果上述方法仍然不起作用，您可以尝试使用简化版的manifest文件（不包含图标定义）：

1. 使用`manifest-simple.json`替换`manifest.json`
2. 重新加载扩展 