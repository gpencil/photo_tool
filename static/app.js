// 全局变量
let originalImage = null;
let originalCanvas = document.getElementById('originalCanvas');
let processedCanvas = document.getElementById('processedCanvas');
let originalCtx = originalCanvas.getContext('2d');
let processedCtx = processedCanvas.getContext('2d');
let autoProcessTimer = null;

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
