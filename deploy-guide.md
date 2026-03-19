# 运动健康APP部署指南

## 方案一：部署到 GitHub Pages（免费）

### 步骤：
1. 注册 GitHub 账号：https://github.com
2. 创建新仓库，命名为 `fitness-tracker`
3. 上传所有文件到仓库
4. 进入 Settings → Pages
5. Source 选择 "Deploy from a branch"
6. Branch 选择 "main"，点击 Save
7. 等待几分钟，访问 `https://你的用户名.github.io/fitness-tracker`

## 方案二：部署到 Netlify（免费）

### 步骤：
1. 访问 https://www.netlify.com
2. 注册账号（可用GitHub账号登录）
3. 点击 "Add new site" → "Deploy manually"
4. 将 `fitness-tracker` 文件夹拖拽上传
5. 获得免费网址，如 `https://xxx.netlify.app`

## 方案三：部署到 Vercel（免费）

### 步骤：
1. 访问 https://vercel.com
2. 注册账号
3. 点击 "Add New Project"
4. 导入GitHub仓库或直接上传文件
5. 自动部署，获得网址

## 方案四：本地网络访问（同一WiFi下）

### 步骤：
1. 电脑和手机连接同一WiFi
2. 电脑运行本地服务器：
   ```bash
   # 进入fitness-tracker目录
   cd fitness-tracker
   
   # Python 3
   python -m http.server 8000
   
   # 或 Node.js
   npx serve
   ```
3. 查看电脑IP地址（如 `192.168.1.100`）
4. 手机浏览器访问：`http://192.168.1.100:8000`

---

部署完成后，手机浏览器访问网址，按方法一或二添加到主屏幕即可。
