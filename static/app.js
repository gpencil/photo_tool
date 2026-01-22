// 全局变量
let originalImage = null;
let originalCanvas = document.getElementById('originalCanvas');
let processedCanvas = document.getElementById('processedCanvas');
let originalCtx = originalCanvas.getContext('2d');
let processedCtx = processedCanvas.getContext('2d');
let autoProcessTimer = null;
let watermarkImageObj = null;
let watermarkArea = null;
let isSelectingWatermark = false;

// DOM 元素
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');

// 滑块值显示
const qualitySlider = document.getElementById('quality');
const scaleSlider = document.getElementById('scale');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const sharpnessSlider = document.getElementById('sharpness');
const blurSlider = document.getElementById('blur');

// 水印相关元素
const watermarkOpacitySlider = document.getElementById('watermarkOpacity');
const watermarkSizeSlider = document.getElementById('watermarkSize');
const removeIntensitySlider = document.getElementById('removeIntensity');

// 防抖函数 - 延迟2秒自动处理
function debounceAutoProcess() {
    if (!originalImage) return;

    // 清除之前的定时器
    if (autoProcessTimer) {
        clearTimeout(autoProcessTimer);
    }

    // 显示等待提示
    const indicator = document.getElementById('processingIndicator');
    indicator.textContent = '等待中... (2秒后自动处理)';
    indicator.style.display = 'block';

    // 设置新的定时器，2秒后自动处理
    autoProcessTimer = setTimeout(() => {
        processImage();
    }, 2000);
}

// 更新滑块显示值并触发自动处理
qualitySlider.addEventListener('input', (e) => {
    document.getElementById('qualityValue').textContent = e.target.value;
    debounceAutoProcess();
});

scaleSlider.addEventListener('input', (e) => {
    document.getElementById('scaleValue').textContent = e.target.value;
    debounceAutoProcess();
});

brightnessSlider.addEventListener('input', (e) => {
    document.getElementById('brightnessValue').textContent = e.target.value;
    debounceAutoProcess();
});

contrastSlider.addEventListener('input', (e) => {
    document.getElementById('contrastValue').textContent = e.target.value;
    debounceAutoProcess();
});

saturationSlider.addEventListener('input', (e) => {
    document.getElementById('saturationValue').textContent = e.target.value;
    debounceAutoProcess();
});

sharpnessSlider.addEventListener('input', (e) => {
    document.getElementById('sharpnessValue').textContent = e.target.value;
    debounceAutoProcess();
});

blurSlider.addEventListener('input', (e) => {
    document.getElementById('blurValue').textContent = e.target.value;
    debounceAutoProcess();
});

watermarkOpacitySlider.addEventListener('input', (e) => {
    document.getElementById('watermarkOpacityValue').textContent = e.target.value;
    debounceAutoProcess();
});

watermarkSizeSlider.addEventListener('input', (e) => {
    document.getElementById('watermarkSizeValue').textContent = e.target.value;
    debounceAutoProcess();
});

removeIntensitySlider.addEventListener('input', (e) => {
    document.getElementById('removeIntensityValue').textContent = e.target.value;
    debounceAutoProcess();
});

// 宽度输入框变化时更新高度（如果保持宽高比）
document.getElementById('width').addEventListener('input', function() {
    if (document.getElementById('keepRatio').checked && originalImage) {
        const ratio = originalImage.height / originalImage.width;
        document.getElementById('height').value = Math.round(this.value * ratio);
    }
    debounceAutoProcess();
});

// 高度输入框变化时更新宽度（如果保持宽高比）
document.getElementById('height').addEventListener('input', function() {
    if (document.getElementById('keepRatio').checked && originalImage) {
        const ratio = originalImage.width / originalImage.height;
        document.getElementById('width').value = Math.round(this.value * ratio);
    }
    debounceAutoProcess();
});

// 监听其他控件变化
document.getElementById('targetSize').addEventListener('input', debounceAutoProcess);
document.getElementById('filter').addEventListener('change', debounceAutoProcess);
document.getElementById('keepRatio').addEventListener('change', debounceAutoProcess);

// 水印控件监听
document.getElementById('enableWatermark').addEventListener('change', debounceAutoProcess);
document.getElementById('watermarkType').addEventListener('change', function() {
    if (this.value === 'text') {
        document.getElementById('watermarkTextGroup').style.display = 'block';
        document.getElementById('watermarkImageGroup').style.display = 'none';
    } else {
        document.getElementById('watermarkTextGroup').style.display = 'none';
        document.getElementById('watermarkImageGroup').style.display = 'block';
    }
    debounceAutoProcess();
});
document.getElementById('watermarkText').addEventListener('input', debounceAutoProcess);
document.getElementById('watermarkPosition').addEventListener('change', debounceAutoProcess);
document.getElementById('enableRemoveWatermark').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('enableWatermark').checked = false;
    }
    debounceAutoProcess();
});

// 水印图片上传
document.getElementById('watermarkImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                watermarkImageObj = img;
                debounceAutoProcess();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 选择水印区域
document.getElementById('selectWatermarkArea').addEventListener('click', function() {
    if (!originalImage) {
        alert('请先上传图片！');
        return;
    }
    isSelectingWatermark = true;
    alert('请在原图上拖拽鼠标框选水印区域');
});

// 区域微调按钮
document.getElementById('moveUp').addEventListener('click', function() {
    if (watermarkArea) {
        watermarkArea.y = Math.max(0, watermarkArea.y - 5);
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

document.getElementById('moveDown').addEventListener('click', function() {
    if (watermarkArea && originalImage) {
        watermarkArea.y = Math.min(originalImage.height - watermarkArea.height, watermarkArea.y + 5);
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

document.getElementById('moveLeft').addEventListener('click', function() {
    if (watermarkArea) {
        watermarkArea.x = Math.max(0, watermarkArea.x - 5);
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

document.getElementById('moveRight').addEventListener('click', function() {
    if (watermarkArea && originalImage) {
        watermarkArea.x = Math.min(originalImage.width - watermarkArea.width, watermarkArea.x + 5);
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

document.getElementById('expandArea').addEventListener('click', function() {
    if (watermarkArea && originalImage) {
        const newWidth = Math.min(originalImage.width - watermarkArea.x, watermarkArea.width + 10);
        const newHeight = Math.min(originalImage.height - watermarkArea.y, watermarkArea.height + 10);
        watermarkArea.width = newWidth;
        watermarkArea.height = newHeight;
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

document.getElementById('shrinkArea').addEventListener('click', function() {
    if (watermarkArea) {
        watermarkArea.width = Math.max(10, watermarkArea.width - 10);
        watermarkArea.height = Math.max(10, watermarkArea.height - 10);
        updateWatermarkAreaDisplay();
        debounceAutoProcess();
    }
});

// 更新水印区域显示
function updateWatermarkAreaDisplay() {
    if (!watermarkArea || !originalImage) return;

    displayOriginalImage();
    originalCtx.strokeStyle = 'red';
    originalCtx.lineWidth = 2;
    originalCtx.strokeRect(watermarkArea.x, watermarkArea.y, watermarkArea.width, watermarkArea.height);

    // 绘制半透明填充
    originalCtx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    originalCtx.fillRect(watermarkArea.x, watermarkArea.y, watermarkArea.width, watermarkArea.height);
}

// 监听单选按钮变化
document.querySelectorAll('input[name="compressMode"]').forEach(radio => {
    radio.addEventListener('change', debounceAutoProcess);
});

document.querySelectorAll('input[name="resizeMode"]').forEach(radio => {
    radio.addEventListener('change', debounceAutoProcess);
});

// 图片上传处理
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                displayOriginalImage();
                resetProcessedCanvas();

                // 更新固定尺寸输入框的默认值
                document.getElementById('width').value = img.width;
                document.getElementById('height').value = img.height;

                // 上传后自动触发第一次处理
                debounceAutoProcess();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 显示原图
function displayOriginalImage() {
    if (!originalImage) return;

    originalCanvas.width = originalImage.width;
    originalCanvas.height = originalImage.height;
    originalCtx.drawImage(originalImage, 0, 0);

    // 显示图片信息
    const sizeKB = (originalCanvas.toDataURL('image/jpeg').length * 0.75 / 1024).toFixed(2);
    document.getElementById('originalInfo').textContent =
        `尺寸: ${originalImage.width} x ${originalImage.height} | 大小: 约 ${sizeKB} KB`;
}

// 重置处理后的画布
function resetProcessedCanvas() {
    if (!originalImage) return;

    processedCanvas.width = originalImage.width;
    processedCanvas.height = originalImage.height;
    processedCtx.drawImage(originalImage, 0, 0);
    updateProcessedInfo();
}

// 更新处理后图片的信息
function updateProcessedInfo() {
    const sizeKB = (processedCanvas.toDataURL('image/jpeg').length * 0.75 / 1024).toFixed(2);
    document.getElementById('processedInfo').textContent =
        `尺寸: ${processedCanvas.width} x ${processedCanvas.height} | 大小: 约 ${sizeKB} KB`;
}

// 应用处理按钮 - 立即处理
processBtn.addEventListener('click', function() {
    if (!originalImage) {
        alert('请先选择一张图片！');
        return;
    }

    // 清除自动处理的定时器
    if (autoProcessTimer) {
        clearTimeout(autoProcessTimer);
    }

    processImage();
});

// 重置按钮
resetBtn.addEventListener('click', function() {
    // 重置所有控制项
    qualitySlider.value = 80;
    scaleSlider.value = 100;
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    sharpnessSlider.value = 0;
    blurSlider.value = 0;
    document.getElementById('filter').value = 'none';

    // 更新显示值
    document.getElementById('qualityValue').textContent = '80';
    document.getElementById('scaleValue').textContent = '100';
    document.getElementById('brightnessValue').textContent = '0';
    document.getElementById('contrastValue').textContent = '0';
    document.getElementById('saturationValue').textContent = '0';
    document.getElementById('sharpnessValue').textContent = '0';
    document.getElementById('blurValue').textContent = '0';

    // 重置画布
    resetProcessedCanvas();
});

// 下载按钮
downloadBtn.addEventListener('click', function() {
    if (!processedCanvas.width) {
        alert('请先处理图片！');
        return;
    }

    const link = document.createElement('a');
    link.download = 'processed-image.jpg';
    link.href = processedCanvas.toDataURL('image/jpeg', qualitySlider.value / 100);
    link.click();
});

// 主处理函数
function processImage() {
    // 显示处理中提示
    const indicator = document.getElementById('processingIndicator');
    indicator.textContent = '正在处理中，请稍候...';
    indicator.style.display = 'block';

    // 使用 setTimeout 让提示有机会显示
    setTimeout(() => {
        processImageInternal();
    }, 50);
}

// 内部处理函数
function processImageInternal() {
    // 第一步：调整尺寸
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');

    const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value;

    if (resizeMode === 'percent') {
        const scale = scaleSlider.value / 100;
        tempCanvas.width = originalImage.width * scale;
        tempCanvas.height = originalImage.height * scale;
    } else {
        tempCanvas.width = parseInt(document.getElementById('width').value);
        tempCanvas.height = parseInt(document.getElementById('height').value);
    }

    tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

    // 第二步：应用滤镜和调整
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // 应用亮度、对比度、饱和度调整
    const brightness = parseInt(brightnessSlider.value);
    const contrast = parseInt(contrastSlider.value);
    const saturation = parseInt(saturationSlider.value);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 亮度调整
        r += brightness;
        g += brightness;
        b += brightness;

        // 对比度调整
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        // 饱和度调整
        if (saturation !== 0) {
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            const satFactor = saturation / 100;
            r = gray + (r - gray) * (1 + satFactor);
            g = gray + (g - gray) * (1 + satFactor);
            b = gray + (b - gray) * (1 + satFactor);
        }

        // 限制范围
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // 应用滤镜效果
    const filter = document.getElementById('filter').value;
    applyFilter(data, filter);

    tempCtx.putImageData(imageData, 0, 0);

    // 第三步：应用模糊效果
    const blurAmount = parseInt(blurSlider.value);
    if (blurAmount > 0) {
        tempCtx.filter = `blur(${blurAmount}px)`;
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = tempCanvas.width;
        blurCanvas.height = tempCanvas.height;
        const blurCtx = blurCanvas.getContext('2d');
        blurCtx.filter = `blur(${blurAmount}px)`;
        blurCtx.drawImage(tempCanvas, 0, 0);
        tempCanvas = blurCanvas;
        tempCtx = blurCanvas.getContext('2d');
    }

    // 第四步：应用锐化效果
    const sharpness = parseInt(sharpnessSlider.value);
    if (sharpness > 0) {
        const sharpened = applySharpen(tempCanvas, sharpness / 100);
        tempCanvas = sharpened;
        tempCtx = sharpened.getContext('2d');
    }

    // 第五步：处理压缩
    processedCanvas.width = tempCanvas.width;
    processedCanvas.height = tempCanvas.height;
    processedCtx.drawImage(tempCanvas, 0, 0);

    // 第六步：去除水印（如果启用）
    if (document.getElementById('enableRemoveWatermark').checked && watermarkArea) {
        const removedCanvas = removeWatermark(processedCanvas, originalImage.width, originalImage.height);
        processedCanvas.width = removedCanvas.width;
        processedCanvas.height = removedCanvas.height;
        processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        processedCtx.drawImage(removedCanvas, 0, 0);
    }

    // 第七步：添加水印（如果启用）
    if (document.getElementById('enableWatermark').checked) {
        const watermarkedCanvas = addWatermark(processedCanvas);
        processedCanvas.width = watermarkedCanvas.width;
        processedCanvas.height = watermarkedCanvas.height;
        processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        processedCtx.drawImage(watermarkedCanvas, 0, 0);
    }

    // 按大小压缩（如果选择了这个选项）
    const compressMode = document.querySelector('input[name="compressMode"]:checked').value;
    if (compressMode === 'size') {
        const targetSizeKB = parseInt(document.getElementById('targetSize').value);
        compressToTargetSize(targetSizeKB);
    } else {
        updateProcessedInfo();
        // 隐藏处理提示
        setTimeout(() => {
            document.getElementById('processingIndicator').style.display = 'none';
        }, 500);
    }
}

// 应用滤镜
function applyFilter(data, filter) {
    switch(filter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = data[i + 1] = data[i + 2] = gray;
            }
            break;

        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
            break;

        case 'vintage':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.2);
                data[i + 1] = Math.min(255, data[i + 1] * 1.0);
                data[i + 2] = Math.min(255, data[i + 2] * 0.8);
            }
            break;

        case 'warm':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1);
                data[i + 2] = Math.min(255, data[i + 2] * 0.9);
            }
            break;

        case 'cool':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.9);
                data[i + 2] = Math.min(255, data[i + 2] * 1.1);
            }
            break;
    }
}

// 锐化效果
function applySharpen(canvas, amount) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 锐化卷积核
    const kernel = [
        0, -amount, 0,
        -amount, 1 + 4 * amount, -amount,
        0, -amount, 0
    ];

    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;
    const newCtx = newCanvas.getContext('2d');
    const newImageData = newCtx.createImageData(width, height);
    const newData = newImageData.data;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += data[idx] * kernel[kernelIdx];
                    }
                }
                const idx = (y * width + x) * 4 + c;
                newData[idx] = Math.max(0, Math.min(255, sum));
            }
            const idx = (y * width + x) * 4;
            newData[idx + 3] = 255;
        }
    }

    newCtx.putImageData(newImageData, 0, 0);
    return newCanvas;
}

// 压缩到目标大小
function compressToTargetSize(targetKB) {
    let quality = 0.9;
    let dataUrl = processedCanvas.toDataURL('image/jpeg', quality);
    let currentSizeKB = dataUrl.length * 0.75 / 1024;

    // 二分查找最佳质量
    let minQuality = 0.1;
    let maxQuality = 0.9;

    while (Math.abs(currentSizeKB - targetKB) > 5 && maxQuality - minQuality > 0.01) {
        if (currentSizeKB > targetKB) {
            maxQuality = quality;
        } else {
            minQuality = quality;
        }
        quality = (minQuality + maxQuality) / 2;
        dataUrl = processedCanvas.toDataURL('image/jpeg', quality);
        currentSizeKB = dataUrl.length * 0.75 / 1024;
    }

    // 更新画布
    const img = new Image();
    img.onload = function() {
        processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        processedCtx.drawImage(img, 0, 0);
        updateProcessedInfo();

        // 隐藏处理提示
        setTimeout(() => {
            document.getElementById('processingIndicator').style.display = 'none';
        }, 500);
    };
    img.src = dataUrl;
}

// 添加水印功能
function addWatermark(canvas) {
    const enableWatermark = document.getElementById('enableWatermark').checked;
    if (!enableWatermark) return canvas;

    const watermarkType = document.getElementById('watermarkType').value;
    const position = document.getElementById('watermarkPosition').value;
    const opacity = parseFloat(document.getElementById('watermarkOpacity').value);
    const size = parseInt(document.getElementById('watermarkSize').value);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    tempCtx.globalAlpha = opacity;

    if (watermarkType === 'text') {
        const text = document.getElementById('watermarkText').value || '水印';
        tempCtx.font = `${size}px Arial`;
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        tempCtx.lineWidth = 1;

        if (position === 'tile') {
            // 平铺水印
            tempCtx.save();
            tempCtx.translate(canvas.width / 2, canvas.height / 2);
            tempCtx.rotate(-Math.PI / 6); // 旋转30度

            const metrics = tempCtx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = size;
            const spacingX = textWidth + 100;
            const spacingY = textHeight + 80;

            for (let y = -canvas.height; y < canvas.height; y += spacingY) {
                for (let x = -canvas.width; x < canvas.width; x += spacingX) {
                    tempCtx.strokeText(text, x, y);
                    tempCtx.fillText(text, x, y);
                }
            }
            tempCtx.restore();
        } else {
            const coords = getWatermarkPosition(canvas, text, size, position, 'text');
            tempCtx.strokeText(text, coords.x, coords.y);
            tempCtx.fillText(text, coords.x, coords.y);
        }
    } else if (watermarkType === 'image' && watermarkImageObj) {
        const scale = size / 20; // 基于20px基准缩放
        const wmWidth = watermarkImageObj.width * scale;
        const wmHeight = watermarkImageObj.height * scale;

        if (position === 'tile') {
            // 平铺水印图片
            for (let y = 0; y < canvas.height; y += wmHeight + 50) {
                for (let x = 0; x < canvas.width; x += wmWidth + 50) {
                    tempCtx.drawImage(watermarkImageObj, x, y, wmWidth, wmHeight);
                }
            }
        } else {
            const coords = getWatermarkPosition(canvas, null, size, position, 'image', wmWidth, wmHeight);
            tempCtx.drawImage(watermarkImageObj, coords.x, coords.y, wmWidth, wmHeight);
        }
    }

    tempCtx.globalAlpha = 1.0;
    return tempCanvas;
}

// 获取水印位置
function getWatermarkPosition(canvas, text, size, position, type, imgWidth, imgHeight) {
    const padding = 20;
    let width, height;

    if (type === 'text') {
        const tempCtx = document.createElement('canvas').getContext('2d');
        tempCtx.font = `${size}px Arial`;
        const metrics = tempCtx.measureText(text);
        width = metrics.width;
        height = size;
    } else {
        width = imgWidth;
        height = imgHeight;
    }

    const positions = {
        'top-left': { x: padding, y: padding + height },
        'top-right': { x: canvas.width - width - padding, y: padding + height },
        'bottom-left': { x: padding, y: canvas.height - padding },
        'bottom-right': { x: canvas.width - width - padding, y: canvas.height - padding },
        'center': { x: (canvas.width - width) / 2, y: (canvas.height + height) / 2 }
    };

    return positions[position] || positions['bottom-right'];
}

// 去除水印功能
function removeWatermark(canvas, originalWidth, originalHeight) {
    const enableRemove = document.getElementById('enableRemoveWatermark').checked;
    if (!enableRemove || !watermarkArea) return canvas;

    const mode = document.getElementById('removeWatermarkMode').value;
    const intensity = parseInt(document.getElementById('removeIntensity').value);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    // 计算缩放后的水印区域坐标
    const scaleX = canvas.width / originalWidth;
    const scaleY = canvas.height / originalHeight;

    const scaledArea = {
        x: Math.round(watermarkArea.x * scaleX),
        y: Math.round(watermarkArea.y * scaleY),
        width: Math.round(watermarkArea.width * scaleX),
        height: Math.round(watermarkArea.height * scaleY)
    };

    if (mode === 'blur') {
        // 使用边缘扩散
        blurWatermarkArea(imageData, scaledArea, intensity);
    } else {
        // 使用智能填充
        inpaintWatermarkArea(imageData, scaledArea, intensity);
    }

    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas;
}

// 模糊填充水印区域 - 使用周边像素直接覆盖
function blurWatermarkArea(imageData, area, intensity) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 强度控制迭代次数和采样范围
    // 强度1-10，对应迭代次数从area的50%到150%
    const iterationFactor = 0.5 + (intensity / 10);
    const maxIterations = Math.ceil(Math.max(area.width, area.height) * iterationFactor);

    // 采样半径随强度增加
    const sampleRadius = Math.min(intensity, 5);

    for (let iter = 0; iter < maxIterations; iter++) {
        // 当前需要填充的像素
        const toFill = [];

        for (let y = area.y; y < area.y + area.height; y++) {
            for (let x = area.x; x < area.x + area.width; x++) {
                // 在更大范围内寻找相邻像素
                const validNeighbors = [];

                for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
                    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                        const isInArea = (nx >= area.x && nx < area.x + area.width &&
                                         ny >= area.y && ny < area.y + area.height);

                        if (!isInArea) {
                            // 计算距离权重
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const weight = 1 / (1 + dist);
                            validNeighbors.push({ x: nx, y: ny, weight: weight });
                        }
                    }
                }

                if (validNeighbors.length > 0) {
                    toFill.push({ x, y, neighbors: validNeighbors });
                }
            }
        }

        // 填充这一层的像素
        for (const pixel of toFill) {
            let r = 0, g = 0, b = 0, totalWeight = 0;

            for (const neighbor of pixel.neighbors) {
                const idx = (neighbor.y * width + neighbor.x) * 4;
                r += data[idx] * neighbor.weight;
                g += data[idx + 1] * neighbor.weight;
                b += data[idx + 2] * neighbor.weight;
                totalWeight += neighbor.weight;
            }

            if (totalWeight > 0) {
                const idx = (pixel.y * width + pixel.x) * 4;
                data[idx] = Math.round(r / totalWeight);
                data[idx + 1] = Math.round(g / totalWeight);
                data[idx + 2] = Math.round(b / totalWeight);
                data[idx + 3] = 255;
            }
        }

        // 强度越高，每次缩小的步长越小，填充更细致
        const shrinkStep = Math.max(1, Math.ceil(3 - intensity / 5));
        area = {
            x: area.x + shrinkStep,
            y: area.y + shrinkStep,
            width: Math.max(0, area.width - shrinkStep * 2),
            height: Math.max(0, area.height - shrinkStep * 2)
        };

        if (area.width <= 0 || area.height <= 0) break;
    }
}

// 智能修复水印区域 - 使用纹理合成和边缘扩散
function inpaintWatermarkArea(imageData, area, intensity) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 创建一个副本用于读取
    const original = new Uint8ClampedArray(data);

    // 强度影响迭代次数
    const iterationFactor = 0.3 + (intensity / 10);
    const maxIterations = Math.ceil(Math.max(area.width, area.height) * iterationFactor);

    // 强度影响采样范围
    const sampleRadius = Math.min(1 + intensity, 10);

    for (let iter = 0; iter < maxIterations; iter++) {
        for (let y = area.y; y < area.y + area.height; y++) {
            for (let x = area.x; x < area.x + area.width; x++) {
                const idx = (y * width + x) * 4;

                // 收集相邻的非水印区域像素
                const samples = [];

                // 在更大范围内采样
                for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
                    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                        // 检查相邻像素是否在水印区域外
                        const isOutside = (nx < area.x || nx >= area.x + area.width ||
                                          ny < area.y || ny >= area.y + area.height);

                        if (isOutside) {
                            const nidx = (ny * width + nx) * 4;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const weight = 1 / (1 + dist);

                            samples.push({
                                r: original[nidx],
                                g: original[nidx + 1],
                                b: original[nidx + 2],
                                weight: weight
                            });
                        }
                    }
                }

                // 如果有相邻的非水印像素，用加权平均值填充
                if (samples.length > 0) {
                    let r = 0, g = 0, b = 0, totalWeight = 0;

                    for (const sample of samples) {
                        r += sample.r * sample.weight;
                        g += sample.g * sample.weight;
                        b += sample.b * sample.weight;
                        totalWeight += sample.weight;
                    }

                    data[idx] = Math.round(r / totalWeight);
                    data[idx + 1] = Math.round(g / totalWeight);
                    data[idx + 2] = Math.round(b / totalWeight);
                    data[idx + 3] = 255;
                }
            }
        }

        // 更新原始数据副本
        original.set(data);

        // 强度越高，每次缩小越少
        const shrinkStep = Math.max(1, Math.ceil(3 - intensity / 5));
        area = {
            x: area.x + shrinkStep,
            y: area.y + shrinkStep,
            width: Math.max(0, area.width - shrinkStep * 2),
            height: Math.max(0, area.height - shrinkStep * 2)
        };

        if (area.width <= 0 || area.height <= 0) break;
    }

    // 强度越高，平滑程度越大
    const smoothRadius = Math.min(Math.ceil(intensity / 3), 3);
    const smoothArea = {
        x: Math.max(0, area.x - smoothRadius * 3),
        y: Math.max(0, area.y - smoothRadius * 3),
        width: Math.min(width, area.width + smoothRadius * 6),
        height: Math.min(height, area.height + smoothRadius * 6)
    };

    if (smoothRadius > 0) {
        const smoothed = new Uint8ClampedArray(data);

        for (let y = smoothArea.y; y < smoothArea.y + smoothArea.height; y++) {
            for (let x = smoothArea.x; x < smoothArea.x + smoothArea.width; x++) {
                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                let r = 0, g = 0, b = 0, count = 0;

                for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
                    for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nidx = (ny * width + nx) * 4;
                            r += data[nidx];
                            g += data[nidx + 1];
                            b += data[nidx + 2];
                            count++;
                        }
                    }
                }

                const idx = (y * width + x) * 4;
                smoothed[idx] = Math.round(r / count);
                smoothed[idx + 1] = Math.round(g / count);
                smoothed[idx + 2] = Math.round(b / count);
            }
        }

        // 应用平滑结果
        data.set(smoothed);
    }
}

// 原图画布上选择水印区域
let startX, startY;
originalCanvas.addEventListener('mousedown', function(e) {
    if (!isSelectingWatermark) return;

    const rect = originalCanvas.getBoundingClientRect();
    startX = (e.clientX - rect.left) * (originalCanvas.width / rect.width);
    startY = (e.clientY - rect.top) * (originalCanvas.height / rect.height);
});

originalCanvas.addEventListener('mouseup', function(e) {
    if (!isSelectingWatermark) return;

    const rect = originalCanvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) * (originalCanvas.width / rect.width);
    const endY = (e.clientY - rect.top) * (originalCanvas.height / rect.height);

    watermarkArea = {
        x: Math.round(Math.min(startX, endX)),
        y: Math.round(Math.min(startY, endY)),
        width: Math.round(Math.abs(endX - startX)),
        height: Math.round(Math.abs(endY - startY))
    };

    isSelectingWatermark = false;

    // 显示微调控件
    document.getElementById('watermarkAreaAdjust').style.display = 'block';

    // 更新显示
    updateWatermarkAreaDisplay();

    alert(`已选择区域：${watermarkArea.width} x ${watermarkArea.height}\n可使用下方按钮微调位置和大小`);
    debounceAutoProcess();
});

