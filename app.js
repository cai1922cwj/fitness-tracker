// 运动健康记录APP主程序

// ==================== 数据存储 ====================
const Storage = {
    getRecords() {
        const records = localStorage.getItem('fitnessRecords');
        return records ? JSON.parse(records) : [];
    },
    
    saveRecord(record) {
        const records = this.getRecords();
        records.unshift(record);
        localStorage.setItem('fitnessRecords', JSON.stringify(records));
    },
    
    deleteRecord(id) {
        const records = this.getRecords();
        const filtered = records.filter(r => r.id !== id);
        localStorage.setItem('fitnessRecords', JSON.stringify(filtered));
    },
    
    getSettings() {
        const settings = localStorage.getItem('fitnessSettings');
        return settings ? JSON.parse(settings) : {
            weight: 70,
            age: 30,
            gender: 'male'
        };
    },
    
    saveSettings(settings) {
        localStorage.setItem('fitnessSettings', JSON.stringify(settings));
    },
    
    clearAll() {
        localStorage.removeItem('fitnessRecords');
        localStorage.removeItem('fitnessSettings');
    }
};

// ==================== 热量计算 ====================
const CalorieCalculator = {
    // MET值（代谢当量）
    METS: {
        running: 9.8,
        walking: 3.8,
        cycling: 7.5
    },
    
    // 计算消耗热量（千卡）
    calculate(type, duration, weight) {
        const met = this.METS[type] || 5;
        // 公式：热量 = MET × 体重(kg) × 时间(小时)
        return Math.round(met * weight * (duration / 60));
    }
};

// ==================== 运动类型配置 ====================
const SportTypes = {
    running: { name: '跑步', icon: '🏃', color: '#FF5722' },
    walking: { name: '快走', icon: '🚶', color: '#2196F3' },
    cycling: { name: '自行车', icon: '🚴', color: '#9C27B0' }
};

// ==================== 全局状态 ====================
let currentType = 'running';
let timerInterval = null;
let timerSeconds = 0;
let weeklyChart = null;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateDate();
    updateTodaySummary();
    renderRecords();
    initChart();
    bindEvents();
    loadSettings();
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 运动类型选择
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
        });
    });
    
    // 表单提交
    document.getElementById('recordForm').addEventListener('submit', handleFormSubmit);
    
    // 计时器控制
    document.getElementById('startTimer').addEventListener('click', startTimer);
    document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
    document.getElementById('resetTimer').addEventListener('click', resetTimer);
    
    // 筛选
    document.getElementById('filterType').addEventListener('change', renderRecords);
    
    // 图表切换
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateChart(tab.dataset.chart);
        });
    });
    
    // 底部导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'home') {
                showPage('home');
            } else if (page === 'stats') {
                showPage('stats');
                updateStats();
            } else if (page === 'settings') {
                showPage('settings');
            }
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ==================== 页面切换 ====================
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('app').style.display = pageName === 'home' ? 'block' : 'none';
    
    if (pageName !== 'home') {
        document.getElementById(pageName + 'Page').classList.remove('hidden');
    }
    
    // 更新导航状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });
}

// ==================== 日期更新 ====================
function updateDate() {
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('zh-CN', options);
}

// ==================== 今日概览 ====================
function updateTodaySummary() {
    const records = Storage.getRecords();
    const today = new Date().toDateString();
    const todayRecords = records.filter(r => new Date(r.date).toDateString() === today);
    
    const totalDistance = todayRecords.reduce((sum, r) => sum + parseFloat(r.distance), 0);
    const totalCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);
    const totalDuration = todayRecords.reduce((sum, r) => sum + parseInt(r.duration), 0);
    
    document.getElementById('todayDistance').textContent = totalDistance.toFixed(2);
    document.getElementById('todayCalories').textContent = totalCalories;
    document.getElementById('todayDuration').textContent = formatDuration(totalDuration);
}

// ==================== 表单处理 ====================
function handleFormSubmit(e) {
    e.preventDefault();
    
    const distance = parseFloat(document.getElementById('distance').value);
    const duration = parseInt(document.getElementById('duration').value);
    const heartRate = document.getElementById('heartRate').value;
    const notes = document.getElementById('notes').value;
    
    const settings = Storage.getSettings();
    const calories = CalorieCalculator.calculate(currentType, duration, settings.weight);
    
    const record = {
        id: Date.now(),
        type: currentType,
        distance: distance,
        duration: duration,
        heartRate: heartRate || null,
        calories: calories,
        notes: notes,
        date: new Date().toISOString()
    };
    
    Storage.saveRecord(record);
    
    // 重置表单
    document.getElementById('recordForm').reset();
    
    // 更新界面
    updateTodaySummary();
    renderRecords();
    updateChart('distance');
    
    // 显示成功提示
    showToast('记录保存成功！');
}

// ==================== 记录列表渲染 ====================
function renderRecords() {
    const records = Storage.getRecords();
    const filterType = document.getElementById('filterType').value;
    const container = document.getElementById('recordsList');
    
    const filteredRecords = filterType === 'all' 
        ? records 
        : records.filter(r => r.type === filterType);
    
    if (filteredRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p class="empty-state-text">暂无记录，开始运动吧！</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredRecords.slice(0, 20).map(record => {
        const type = SportTypes[record.type];
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        return `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-icon ${record.type}">${type.icon}</div>
                    <div class="record-details">
                        <h4>${type.name}</h4>
                        <p>${dateStr} ${record.notes ? '· ' + record.notes : ''}</p>
                    </div>
                </div>
                <div class="record-stats">
                    <div class="distance">${record.distance.toFixed(2)} km</div>
                    <div class="calories">${record.calories} 千卡 · ${record.duration}分钟</div>
                </div>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">×</button>
            </div>
        `;
    }).join('');
}

// ==================== 删除记录 ====================
function deleteRecord(id) {
    if (confirm('确定要删除这条记录吗？')) {
        Storage.deleteRecord(id);
        updateTodaySummary();
        renderRecords();
        updateChart('distance');
        showToast('记录已删除');
    }
}

// ==================== 计时器功能 ====================
function startTimer() {
    if (timerInterval) return;
    
    document.getElementById('startTimer').disabled = true;
    document.getElementById('pauseTimer').disabled = false;
    
    timerInterval = setInterval(() => {
        timerSeconds++;
        document.getElementById('timer').textContent = formatTime(timerSeconds);
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('startTimer').disabled = false;
    document.getElementById('pauseTimer').disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    document.getElementById('timer').textContent = '00:00:00';
    document.getElementById('startTimer').disabled = false;
    document.getElementById('pauseTimer').disabled = true;
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}`;
    }
    return `${mins}分钟`;
}

// ==================== 图表功能 ====================
function initChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: getChartData('distance'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function getChartData(metric) {
    const records = Storage.getRecords();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    const weekData = [];
    const labels = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayRecords = records.filter(r => new Date(r.date).toDateString() === dateStr);
        
        let value = 0;
        if (metric === 'distance') {
            value = dayRecords.reduce((sum, r) => sum + parseFloat(r.distance), 0);
        } else if (metric === 'calories') {
            value = dayRecords.reduce((sum, r) => sum + r.calories, 0);
        } else if (metric === 'duration') {
            value = dayRecords.reduce((sum, r) => sum + parseInt(r.duration), 0);
        }
        
        weekData.push(value);
        labels.push(i === 0 ? '今天' : days[date.getDay()]);
    }
    
    const colors = weekData.map((_, i) => i === 6 ? '#4CAF50' : '#81C784');
    
    return {
        labels: labels,
        datasets: [{
            data: weekData,
            backgroundColor: colors,
            borderRadius: 6,
            borderSkipped: false
        }]
    };
}

function updateChart(metric) {
    if (!weeklyChart) return;
    
    weeklyChart.data = getChartData(metric);
    weeklyChart.update();
}

// ==================== 统计页面 ====================
function updateStats() {
    const records = Storage.getRecords();
    const today = new Date();
    
    // 本周统计
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekCount = records.filter(r => new Date(r.date) >= weekStart).length;
    
    // 本月统计
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthCount = records.filter(r => new Date(r.date) >= monthStart).length;
    
    // 总计
    document.getElementById('weekCount').textContent = weekCount + ' 次';
    document.getElementById('monthCount').textContent = monthCount + ' 次';
    document.getElementById('totalCount').textContent = records.length + ' 次';
    
    // 类型分布
    const typeCount = { running: 0, walking: 0, cycling: 0 };
    records.forEach(r => {
        if (typeCount[r.type] !== undefined) {
            typeCount[r.type]++;
        }
    });
    
    const total = records.length || 1;
    const distributionHtml = `
        <div class="type-distribution">
            <div class="distribution-item">
                <span class="dist-icon">🏃</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.running/total*100)}%; background: #FF5722;"></div>
                </div>
                <span class="dist-count">${typeCount.running}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🚶</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.walking/total*100)}%; background: #2196F3;"></div>
                </div>
                <span class="dist-count">${typeCount.walking}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🚴</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.cycling/total*100)}%; background: #9C27B0;"></div>
                </div>
                <span class="dist-count">${typeCount.cycling}次</span>
            </div>
        </div>
    `;
    
    document.getElementById('typeDistribution').innerHTML = distributionHtml;
}

// ==================== 设置页面 ====================
function loadSettings() {
    const settings = Storage.getSettings();
    document.getElementById('userWeight').value = settings.weight;
    document.getElementById('userAge').value = settings.age;
    document.getElementById('userGender').value = settings.gender;
}

function saveSettings() {
    const settings = {
        weight: parseFloat(document.getElementById('userWeight').value),
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value
    };
    
    Storage.saveSettings(settings);
    showToast('设置已保存');
}

function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        Storage.clearAll();
        updateTodaySummary();
        renderRecords();
        updateChart('distance');
        showToast('所有数据已清除');
    }
}

// ==================== 提示功能 ====================
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 16px;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// ==================== PWA支持 ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
