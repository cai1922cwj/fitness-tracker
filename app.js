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
    
    // 用户管理
    getUsers() {
        const users = localStorage.getItem('fitnessUsers');
        return users ? JSON.parse(users) : [
            { id: 1, name: '默认用户', weight: 70, age: 30, gender: 'male', isCurrent: true }
        ];
    },
    
    saveUser(user) {
        const users = this.getUsers();
        if (user.id) {
            const index = users.findIndex(u => u.id === user.id);
            if (index >= 0) {
                users[index] = user;
            } else {
                user.id = Date.now();
                users.push(user);
            }
        } else {
            user.id = Date.now();
            users.push(user);
        }
        localStorage.setItem('fitnessUsers', JSON.stringify(users));
    },
    
    deleteUser(id) {
        const users = this.getUsers().filter(u => u.id !== id);
        localStorage.setItem('fitnessUsers', JSON.stringify(users));
    },
    
    getCurrentUser() {
        const users = this.getUsers();
        return users.find(u => u.isCurrent) || users[0];
    },
    
    setCurrentUser(id) {
        const users = this.getUsers();
        users.forEach(u => u.isCurrent = (u.id === id));
        localStorage.setItem('fitnessUsers', JSON.stringify(users));
    },
    
    // 目标管理
    getGoals() {
        const goals = localStorage.getItem('fitnessGoals');
        return goals ? JSON.parse(goals) : [
            { id: 1, type: 'daily', metric: 'distance', target: 5, unit: 'km', userId: 1 }
        ];
    },
    
    saveGoal(goal) {
        const goals = this.getGoals();
        if (goal.id) {
            const index = goals.findIndex(g => g.id === goal.id);
            if (index >= 0) {
                goals[index] = goal;
            } else {
                goal.id = Date.now();
                goals.push(goal);
            }
        } else {
            goal.id = Date.now();
            goals.push(goal);
        }
        localStorage.setItem('fitnessGoals', JSON.stringify(goals));
    },
    
    deleteGoal(id) {
        const goals = this.getGoals().filter(g => g.id !== id);
        localStorage.setItem('fitnessGoals', JSON.stringify(goals));
    },
    
    clearAll() {
        localStorage.removeItem('fitnessRecords');
        localStorage.removeItem('fitnessSettings');
        localStorage.removeItem('fitnessUsers');
        localStorage.removeItem('fitnessGoals');
        localStorage.removeItem('fitnessTracks');
    }
};

// ==================== 热量计算 ====================
const CalorieCalculator = {
    // MET值（代谢当量）
    METS: {
        running: 9.8,
        walking: 3.8,
        cycling: 7.5,
        strength: 6.0,
        housework: 3.0,
        yoga: 3.0
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
    running: { name: '跑步', icon: '🏃', color: '#e74c3c' },
    walking: { name: '快走', icon: '🚶', color: '#3498db' },
    cycling: { name: '骑行', icon: '🚴', color: '#9b59b6' },
    strength: { name: '力量', icon: '💪', color: '#e67e22' },
    housework: { name: '家务', icon: '🧹', color: '#2ecc71' },
    yoga: { name: '瑜伽', icon: '🧘', color: '#8e44ad' }
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
    loadUsers();
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
            } else if (page === 'map') {
                showPage('map');
                initMap();
            } else if (page === 'settings') {
                showPage('settings');
                loadUsers();
                loadGoals();
            }
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // 目标指标改变时更新单位
    const goalMetricSelect = document.getElementById('goalMetric');
    if (goalMetricSelect) {
        goalMetricSelect.addEventListener('change', updateGoalUnit);
    }
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
    
    const currentUser = Storage.getCurrentUser();
    const calories = CalorieCalculator.calculate(currentType, duration, currentUser.weight);
    
    const record = {
        id: Date.now(),
        type: currentType,
        distance: distance,
        duration: duration,
        heartRate: heartRate || null,
        calories: calories,
        notes: notes,
        date: new Date().toISOString(),
        userId: currentUser.id
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
    const currentUser = Storage.getCurrentUser();
    
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
    const typeCount = { running: 0, walking: 0, cycling: 0, strength: 0, housework: 0, yoga: 0 };
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
                    <div class="dist-fill" style="width: ${(typeCount.running/total*100)}%; background: ${SportTypes.running.color};"></div>
                </div>
                <span class="dist-count">${typeCount.running}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🚶</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.walking/total*100)}%; background: ${SportTypes.walking.color};"></div>
                </div>
                <span class="dist-count">${typeCount.walking}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🚴</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.cycling/total*100)}%; background: ${SportTypes.cycling.color};"></div>
                </div>
                <span class="dist-count">${typeCount.cycling}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">💪</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.strength/total*100)}%; background: ${SportTypes.strength.color};"></div>
                </div>
                <span class="dist-count">${typeCount.strength}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🧹</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.housework/total*100)}%; background: ${SportTypes.housework.color};"></div>
                </div>
                <span class="dist-count">${typeCount.housework}次</span>
            </div>
            <div class="distribution-item">
                <span class="dist-icon">🧘</span>
                <div class="dist-bar">
                    <div class="dist-fill" style="width: ${(typeCount.yoga/total*100)}%; background: ${SportTypes.yoga.color};"></div>
                </div>
                <span class="dist-count">${typeCount.yoga}次</span>
            </div>
        </div>
    `;
    
    document.getElementById('typeDistribution').innerHTML = distributionHtml;
    
    // 目标进度
    updateGoalProgressStats();
    
    // 用户比较
    updateUserComparisonStats();
}

// 更新目标进度统计
function updateGoalProgressStats() {
    const goals = Storage.getGoals();
    const currentUser = Storage.getCurrentUser();
    const userGoals = goals.filter(g => g.userId === currentUser.id);
    const container = document.getElementById('goalProgress');
    
    if (!container) return;
    
    if (userGoals.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无目标，请在设置中添加</div>';
        return;
    }
    
    // 计算每个目标的进度
    const goalsWithProgress = userGoals.map(goal => {
        const progress = calculateGoalProgress(goal);
        const progressPercent = Math.min(progress / goal.target * 100, 100);
        const isCompleted = progress >= goal.target;
        
        let typeName = '';
        switch(goal.type) {
            case 'daily': typeName = '每日'; break;
            case 'weekly': typeName = '每周'; break;
            case 'monthly': typeName = '每月'; break;
        }
        
        let metricName = '';
        switch(goal.metric) {
            case 'distance': metricName = '距离'; break;
            case 'duration': metricName = '时长'; break;
            case 'calories': metricName = '热量'; break;
            case 'steps': metricName = '步数'; break;
        }
        
        return {
            ...goal,
            progress,
            progressPercent,
            isCompleted,
            typeName,
            metricName
        };
    });
    
    // 按完成状态排序：未完成的在前
    goalsWithProgress.sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return b.progressPercent - a.progressPercent;
    });
    
    const html = `
        <div class="goal-progress-list">
            ${goalsWithProgress.map(goal => `
                <div class="goal-progress-item ${goal.isCompleted ? 'completed' : ''}">
                    <div class="goal-progress-header">
                        <div class="goal-progress-title">
                            <span class="goal-type-badge">${goal.typeName}</span>
                            <span>${goal.metricName}目标</span>
                            ${goal.isCompleted ? '<span class="completed-badge">已完成 ✓</span>' : ''}
                        </div>
                        <div class="goal-progress-target">${goal.target} ${goal.unit}</div>
                    </div>
                    <div class="goal-progress-details">
                        <div class="goal-progress-text">
                            进度: ${goal.metric === 'steps' ? goal.progress : goal.progress.toFixed(1)}/${goal.target} ${goal.unit}
                            <span class="goal-progress-percent">(${goal.progressPercent.toFixed(1)}%)</span>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${goal.progressPercent}%; 
                                background: ${goal.isCompleted ? 'var(--primary-color)' : 'var(--secondary-color)'};"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// 更新用户比较统计
function updateUserComparisonStats() {
    const users = Storage.getUsers();
    const records = Storage.getRecords();
    const container = document.getElementById('userComparison');
    
    if (!container) return;
    
    if (users.length <= 1) {
        container.innerHTML = '<div class="empty-state">添加更多用户以查看比较</div>';
        return;
    }
    
    // 计算每个用户的统计
    const userStats = users.map(user => {
        const userRecords = records.filter(r => r.userId === user.id);
        const today = new Date();
        const todayStr = today.toDateString();
        const todayRecords = userRecords.filter(r => new Date(r.date).toDateString() === todayStr);
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - today.getDay());
        const weekRecords = userRecords.filter(r => new Date(r.date) >= weekStart);
        
        const totalDistance = userRecords.reduce((sum, r) => sum + parseFloat(r.distance), 0);
        const totalCalories = userRecords.reduce((sum, r) => sum + r.calories, 0);
        const totalDuration = userRecords.reduce((sum, r) => sum + parseInt(r.duration), 0);
        const todayDistance = todayRecords.reduce((sum, r) => sum + parseFloat(r.distance), 0);
        const todayCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);
        
        return {
            id: user.id,
            name: user.name,
            isCurrent: user.isCurrent,
            recordCount: userRecords.length,
            totalDistance,
            totalCalories,
            totalDuration,
            todayDistance,
            todayCalories,
            avgDistancePerRecord: userRecords.length > 0 ? totalDistance / userRecords.length : 0
        };
    });
    
    // 找出各项指标的最佳用户
    const bestByDistance = [...userStats].sort((a, b) => b.totalDistance - a.totalDistance)[0];
    const bestByCalories = [...userStats].sort((a, b) => b.totalCalories - a.totalCalories)[0];
    const bestByConsistency = [...userStats].sort((a, b) => b.recordCount - a.recordCount)[0];
    
    const html = `
        <div class="user-comparison-stats">
            <div class="comparison-summary">
                <div class="comparison-item">
                    <span class="comparison-label">🏆 总距离冠军</span>
                    <span class="comparison-value">${bestByDistance.name}: ${bestByDistance.totalDistance.toFixed(1)} km</span>
                </div>
                <div class="comparison-item">
                    <span class="comparison-label">🔥 总热量冠军</span>
                    <span class="comparison-value">${bestByCalories.name}: ${bestByCalories.totalCalories} 千卡</span>
                </div>
                <div class="comparison-item">
                    <span class="comparison-label">📅 坚持冠军</span>
                    <span class="comparison-value">${bestByConsistency.name}: ${bestByConsistency.recordCount} 次</span>
                </div>
            </div>
            
            <div class="user-stats-grid">
                ${userStats.map(user => `
                    <div class="user-stat-card ${user.isCurrent ? 'current-user' : ''}">
                        <div class="user-stat-header">
                            <span class="user-stat-name">${user.name}${user.isCurrent ? ' (当前)' : ''}</span>
                        </div>
                        <div class="user-stat-body">
                            <div class="user-stat-item">
                                <span class="stat-label">总距离</span>
                                <span class="stat-value">${user.totalDistance.toFixed(1)} km</span>
                            </div>
                            <div class="user-stat-item">
                                <span class="stat-label">总热量</span>
                                <span class="stat-value">${user.totalCalories} 千卡</span>
                            </div>
                            <div class="user-stat-item">
                                <span class="stat-label">运动次数</span>
                                <span class="stat-value">${user.recordCount} 次</span>
                            </div>
                            <div class="user-stat-item">
                                <span class="stat-label">今日距离</span>
                                <span class="stat-value">${user.todayDistance.toFixed(1)} km</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
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

// ==================== 用户管理功能 ====================
function loadUsers() {
    const users = Storage.getUsers();
    const currentUser = Storage.getCurrentUser();
    const container = document.getElementById('usersList');
    
    // 显示当前用户信息
    const currentUserInfo = document.getElementById('currentUserInfo');
    if (currentUserInfo) {
        currentUserInfo.innerHTML = `
            <strong>${currentUser.name}</strong> · ${currentUser.age}岁 · ${currentUser.weight}kg · ${currentUser.gender === 'male' ? '男' : '女'}
        `;
    }
    
    // 更新个人设置表单
    const userWeight = document.getElementById('userWeight');
    const userAge = document.getElementById('userAge');
    const userGender = document.getElementById('userGender');
    
    if (userWeight && userAge && userGender) {
        userWeight.value = currentUser.weight;
        userAge.value = currentUser.age;
        userGender.value = currentUser.gender;
    }
    
    // 显示用户列表
    if (container) {
        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无用户，请添加</div>';
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="user-item ${user.isCurrent ? 'current' : ''}">
                <div class="user-info-text">
                    <div class="user-name">${user.name} ${user.isCurrent ? '（当前）' : ''}</div>
                    <div class="user-details">${user.age}岁 · ${user.weight}kg · ${user.gender === 'male' ? '男' : '女'}</div>
                </div>
                <div class="user-actions">
                    ${!user.isCurrent ? `<button class="user-action-btn primary" onclick="switchUser(${user.id})">切换</button>` : ''}
                    ${!user.isCurrent ? `<button class="user-action-btn" onclick="deleteUser(${user.id})">删除</button>` : ''}
                </div>
            </div>
        `).join('');
    }
}

function showAddUserForm() {
    const form = document.getElementById('addUserForm');
    if (form) form.classList.remove('hidden');
}

function hideAddUserForm() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.classList.add('hidden');
        // 清空表单
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserWeight').value = 65;
        document.getElementById('newUserAge').value = 25;
        document.getElementById('newUserGender').value = 'male';
    }
}

function addUser() {
    const nameInput = document.getElementById('newUserName');
    const weightInput = document.getElementById('newUserWeight');
    const ageInput = document.getElementById('newUserAge');
    const genderInput = document.getElementById('newUserGender');
    
    if (!nameInput || !weightInput || !ageInput || !genderInput) return;
    
    const name = nameInput.value.trim();
    const weight = parseFloat(weightInput.value);
    const age = parseInt(ageInput.value);
    const gender = genderInput.value;
    
    if (!name) {
        showToast('请输入用户名');
        return;
    }
    
    const users = Storage.getUsers();
    if (users.length >= 20) {
        showToast('已达到最大用户数(20人)');
        return;
    }
    
    const newUser = {
        name,
        weight,
        age,
        gender,
        isCurrent: false
    };
    
    Storage.saveUser(newUser);
    loadUsers();
    hideAddUserForm();
    showToast('用户添加成功');
}

function switchUser(userId) {
    Storage.setCurrentUser(userId);
    loadUsers();
    showToast('已切换用户');
    
    // 重新加载当前用户的设置
    const currentUser = Storage.getCurrentUser();
    const userWeight = document.getElementById('userWeight');
    const userAge = document.getElementById('userAge');
    const userGender = document.getElementById('userGender');
    
    if (userWeight && userAge && userGender) {
        userWeight.value = currentUser.weight;
        userAge.value = currentUser.age;
        userGender.value = currentUser.gender;
    }
}

function deleteUser(userId) {
    if (confirm('确定要删除这个用户吗？该用户的运动记录将不会被删除，但可能无法正确关联。')) {
        Storage.deleteUser(userId);
        loadUsers();
        showToast('用户已删除');
    }
}

// ==================== 目标管理功能 ====================
function showAddGoalForm() {
    const form = document.getElementById('addGoalForm');
    if (form) form.classList.remove('hidden');
    
    // 设置默认单位
    updateGoalUnit();
}

function hideAddGoalForm() {
    const form = document.getElementById('addGoalForm');
    if (form) {
        form.classList.add('hidden');
        // 清空表单
        document.getElementById('goalType').value = 'daily';
        document.getElementById('goalMetric').value = 'distance';
        document.getElementById('goalTarget').value = '5';
        document.getElementById('goalUnit').value = 'km';
    }
}

function updateGoalUnit() {
    const metric = document.getElementById('goalMetric').value;
    const unitInput = document.getElementById('goalUnit');
    
    switch(metric) {
        case 'distance':
            unitInput.value = 'km';
            break;
        case 'duration':
            unitInput.value = '分钟';
            break;
        case 'calories':
            unitInput.value = '千卡';
            break;
        case 'steps':
            unitInput.value = '步';
            break;
        default:
            unitInput.value = '';
    }
}

function addGoal() {
    const goalType = document.getElementById('goalType').value;
    const goalMetric = document.getElementById('goalMetric').value;
    const goalTarget = parseFloat(document.getElementById('goalTarget').value);
    const goalUnit = document.getElementById('goalUnit').value;
    const currentUser = Storage.getCurrentUser();
    
    if (!goalTarget || goalTarget <= 0) {
        showToast('请输入有效的目标值');
        return;
    }
    
    const goal = {
        type: goalType,
        metric: goalMetric,
        target: goalTarget,
        unit: goalUnit,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
    };
    
    Storage.saveGoal(goal);
    loadGoals();
    hideAddGoalForm();
    showToast('目标添加成功');
}

function loadGoals() {
    const goals = Storage.getGoals();
    const currentUser = Storage.getCurrentUser();
    const container = document.getElementById('goalsList');
    
    if (!container) return;
    
    // 只显示当前用户的目标
    const userGoals = goals.filter(g => g.userId === currentUser.id);
    
    if (userGoals.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无目标，请添加</div>';
        return;
    }
    
    // 计算每个目标的进度
    const goalsWithProgress = userGoals.map(goal => {
        const progress = calculateGoalProgress(goal);
        return { ...goal, progress };
    });
    
    container.innerHTML = goalsWithProgress.map(goal => {
        const progressPercent = Math.min(goal.progress / goal.target * 100, 100);
        const progressText = goal.metric === 'steps' ? 
            `${goal.progress}/${goal.target} ${goal.unit}` :
            `${goal.progress.toFixed(1)}/${goal.target} ${goal.unit}`;
        
        let typeName = '';
        switch(goal.type) {
            case 'daily': typeName = '每日'; break;
            case 'weekly': typeName = '每周'; break;
            case 'monthly': typeName = '每月'; break;
        }
        
        let metricName = '';
        switch(goal.metric) {
            case 'distance': metricName = '距离'; break;
            case 'duration': metricName = '时长'; break;
            case 'calories': metricName = '热量'; break;
            case 'steps': metricName = '步数'; break;
        }
        
        return `
            <div class="goal-item">
                <div class="goal-info-text">
                    <div class="goal-title">${typeName}${metricName}目标</div>
                    <div class="goal-target">目标: ${goal.target} ${goal.unit}</div>
                    <div class="goal-progress-text">进度: ${progressText} (${progressPercent.toFixed(1)}%)</div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progressPercent}%; background: var(--primary-color);"></div>
                    </div>
                </div>
                <button class="goal-action-btn" onclick="deleteGoal(${goal.id})">删除</button>
            </div>
        `;
    }).join('');
}

function calculateGoalProgress(goal) {
    const records = Storage.getRecords();
    const currentUser = Storage.getCurrentUser();
    const now = new Date();
    
    // 筛选当前用户的记录
    const userRecords = records.filter(r => r.userId === currentUser.id);
    
    let relevantRecords = [];
    let today = new Date();
    
    // 根据目标类型筛选记录
    if (goal.type === 'daily') {
        // 今天的记录
        const todayStr = today.toDateString();
        relevantRecords = userRecords.filter(r => new Date(r.date).toDateString() === todayStr);
    } else if (goal.type === 'weekly') {
        // 本周的记录
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        relevantRecords = userRecords.filter(r => new Date(r.date) >= weekStart);
    } else if (goal.type === 'monthly') {
        // 本月的记录
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        relevantRecords = userRecords.filter(r => new Date(r.date) >= monthStart);
    }
    
    // 根据目标指标计算进度
    let progress = 0;
    if (goal.metric === 'distance') {
        progress = relevantRecords.reduce((sum, r) => sum + parseFloat(r.distance), 0);
    } else if (goal.metric === 'duration') {
        progress = relevantRecords.reduce((sum, r) => sum + parseInt(r.duration), 0);
    } else if (goal.metric === 'calories') {
        progress = relevantRecords.reduce((sum, r) => sum + r.calories, 0);
    } else if (goal.metric === 'steps') {
        // 步数估算：跑步/快走 1km ≈ 1200步，其他类型根据时长估算
        progress = relevantRecords.reduce((sum, r) => {
            if (r.type === 'running' || r.type === 'walking') {
                // 1km ≈ 1200步
                return sum + Math.round(r.distance * 1200);
            } else {
                // 其他类型：每分钟约100步
                return sum + Math.round(r.duration * 100);
            }
        }, 0);
    }
    
    return progress;
}

function deleteGoal(goalId) {
    if (confirm('确定要删除这个目标吗？')) {
        Storage.deleteGoal(goalId);
        loadGoals();
        showToast('目标已删除');
    }
}

// 修改保存设置函数，更新当前用户信息
function saveSettings() {
    const currentUser = Storage.getCurrentUser();
    const userWeight = document.getElementById('userWeight');
    const userAge = document.getElementById('userAge');
    const userGender = document.getElementById('userGender');
    
    if (!userWeight || !userAge || !userGender) return;
    
    const updatedUser = {
        ...currentUser,
        weight: parseFloat(userWeight.value),
        age: parseInt(userAge.value),
        gender: userGender.value
    };
    
    Storage.saveUser(updatedUser);
    loadUsers();
    showToast('设置已保存');
}

// ==================== 地图功能 ====================
let map = null;
let trackPolyline = null;
let trackPoints = [];
let isTracking = false;
let watchId = null;

function initMap() {
    if (map) return;
    
    // 初始化地图，默认定位到中国中心
    map = L.map('map').setView([35.0, 105.0], 4);
    
    // 添加OpenStreetMap图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(map);
    
    // 尝试获取当前位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup('您的位置')
                .openPopup();
        }, error => {
            console.log('获取位置失败:', error);
            // 使用默认位置
            L.marker([35.0, 105.0])
                .addTo(map)
                .bindPopup('默认位置');
        });
    }
    
    // 加载保存的轨迹
    loadTracks();
}

function startTracking() {
    if (isTracking) return;
    
    if (!navigator.geolocation) {
        showToast('您的设备不支持位置服务');
        return;
    }
    
    isTracking = true;
    trackPoints = [];
    document.getElementById('trackingStatus').textContent = '记录中...';
    document.getElementById('trackPoints').textContent = '0';
    
    // 开始监听位置
    watchId = navigator.geolocation.watchPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const point = { lat: latitude, lng: longitude, time: new Date() };
            trackPoints.push(point);
            
            // 更新地图显示
            if (trackPolyline) {
                map.removeLayer(trackPolyline);
            }
            
            const latLngs = trackPoints.map(p => [p.lat, p.lng]);
            trackPolyline = L.polyline(latLngs, { color: 'var(--primary-color)' }).addTo(map);
            
            // 调整视图到轨迹范围
            if (trackPoints.length === 1) {
                map.setView([latitude, longitude], 15);
            } else {
                map.fitBounds(trackPolyline.getBounds());
            }
            
            // 更新显示
            document.getElementById('trackPoints').textContent = trackPoints.length;
        },
        error => {
            console.log('位置跟踪错误:', error);
            showToast('位置跟踪失败');
            stopTracking();
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
    
    showToast('开始记录轨迹');
}

function stopTracking() {
    if (!isTracking) return;
    
    isTracking = false;
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    document.getElementById('trackingStatus').textContent = '已停止';
    
    if (trackPoints.length > 1) {
        // 保存轨迹
        saveTrack();
    }
    
    showToast('轨迹记录已停止');
}

function clearTrack() {
    if (trackPolyline) {
        map.removeLayer(trackPolyline);
        trackPolyline = null;
    }
    trackPoints = [];
    isTracking = false;
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    document.getElementById('trackingStatus').textContent = '未记录';
    document.getElementById('trackPoints').textContent = '0';
    showToast('轨迹已清除');
}

function saveTrack() {
    if (trackPoints.length < 2) {
        showToast('轨迹点不足，无法保存');
        return;
    }
    
    const trackName = prompt('请输入轨迹名称（例如：晨跑、夜骑）:', `轨迹_${new Date().toLocaleDateString()}`);
    if (!trackName) return;
    
    const track = {
        id: Date.now(),
        name: trackName,
        points: trackPoints,
        distance: calculateTrackDistance(trackPoints),
        duration: trackPoints.length > 0 ? 
            (trackPoints[trackPoints.length-1].time - trackPoints[0].time) / 1000 : 0,
        date: new Date().toISOString(),
        userId: Storage.getCurrentUser().id
    };
    
    const tracks = getTracks();
    tracks.push(track);
    localStorage.setItem('fitnessTracks', JSON.stringify(tracks));
    
    loadTracks();
    showToast('轨迹保存成功');
}

function loadTracks() {
    const tracks = getTracks();
    const container = document.getElementById('tracksList');
    const currentUserId = Storage.getCurrentUser().id;
    
    // 只显示当前用户的轨迹
    const userTracks = tracks.filter(t => t.userId === currentUserId);
    
    if (!container) return;
    
    if (userTracks.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无轨迹记录</div>';
        return;
    }
    
    container.innerHTML = userTracks.slice(0, 10).map(track => {
        const date = new Date(track.date);
        const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const distance = track.distance ? track.distance.toFixed(2) + ' km' : '未知';
        const duration = track.duration ? Math.round(track.duration / 60) + '分钟' : '未知';
        
        return `
            <div class="track-item">
                <div class="track-info-text">
                    <div class="track-name">${track.name}</div>
                    <div class="track-details">${dateStr} · ${distance} · ${duration} · ${track.points.length}个点</div>
                </div>
                <div class="track-actions">
                    <button class="track-action-btn primary" onclick="showTrackOnMap(${track.id})">查看</button>
                    <button class="track-action-btn" onclick="deleteTrack(${track.id})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

function showTrackOnMap(trackId) {
    const tracks = getTracks();
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    // 清除现有轨迹
    if (trackPolyline) {
        map.removeLayer(trackPolyline);
    }
    
    // 绘制轨迹
    const latLngs = track.points.map(p => [p.lat, p.lng]);
    trackPolyline = L.polyline(latLngs, { color: 'var(--primary-color)', weight: 4 }).addTo(map);
    
    // 调整视图
    map.fitBounds(trackPolyline.getBounds());
    
    // 添加起点和终点标记
    if (track.points.length > 0) {
        const start = track.points[0];
        const end = track.points[track.points.length-1];
        
        L.marker([start.lat, start.lng])
            .addTo(map)
            .bindPopup('起点');
            
        L.marker([end.lat, end.lng])
            .addTo(map)
            .bindPopup('终点');
    }
    
    showToast(`显示轨迹: ${track.name}`);
}

function deleteTrack(trackId) {
    if (confirm('确定要删除这条轨迹吗？')) {
        const tracks = getTracks();
        const filtered = tracks.filter(t => t.id !== trackId);
        localStorage.setItem('fitnessTracks', JSON.stringify(filtered));
        loadTracks();
        
        if (trackPolyline) {
            map.removeLayer(trackPolyline);
            trackPolyline = null;
        }
        
        showToast('轨迹已删除');
    }
}

function getTracks() {
    const tracks = localStorage.getItem('fitnessTracks');
    return tracks ? JSON.parse(tracks) : [];
}

function calculateTrackDistance(points) {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
        const p1 = points[i-1];
        const p2 = points[i];
        totalDistance += haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    return totalDistance;
}

// 计算两点间距离（公里）- 使用Haversine公式
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
