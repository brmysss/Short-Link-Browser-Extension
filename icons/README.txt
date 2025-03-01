# 图标文件说明

为了使扩展图标正确显示，您需要将SVG图标转换为PNG格式。您可以使用以下几种方法：

## 方法1：使用在线SVG到PNG转换工具

1. 访问在线转换工具，如 https://svgtopng.com/ 或 https://convertio.co/svg-png/
2. 上传SVG文件（icon16.svg、icon48.svg、icon128.svg）
3. 设置输出尺寸分别为16x16、48x48和128x128像素
4. 下载转换后的PNG文件
5. 将PNG文件放入此文件夹，命名为icon16.png、icon48.png和icon128.png

## 方法2：使用图像编辑软件

如果您有Photoshop、GIMP或Inkscape等图像编辑软件，可以：
1. 打开SVG文件
2. 导出为PNG格式，设置相应的尺寸
3. 将导出的文件放入此文件夹

## 方法3：使用命令行工具（需要安装ImageMagick）

如果您的系统中安装了ImageMagick，可以使用以下命令：

```bash
convert -background none -resize 16x16 icon.svg icon16.png
convert -background none -resize 48x48 icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```

## 临时解决方案

如果您暂时无法创建PNG图标，可以使用以下简单的纯色图标：

1. 创建16x16、48x48和128x128像素的纯色PNG图片（可以是蓝色或其他颜色）
2. 将这些图片命名为icon16.png、icon48.png和icon128.png
3. 放入此文件夹中

这样可以临时解决图标显示问题，之后再替换为正式图标。 