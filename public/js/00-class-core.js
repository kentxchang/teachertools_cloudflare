// ===== 班級管理核心：全域狀態、班級新增/刪除/切換、班級資料存取（getClassData/setClassData）、初始化 =====
        // ===== 班級管理系統 =====
        let currentClass = null;
        // 統一定義 fileName 前綴（在 GAS Web App / 各裝置上統一為 'index'，並相容既有前綴）
        function getResolvedFileName() {
            if (typeof window.fileName === 'string' && window.fileName && window.fileName !== 'exec' && window.fileName !== 'dev' && window.fileName !== 'userCodeAppPanel') {
                return window.fileName;
            }
            const pathName = location.pathname.split('/').pop().replace(/\.html$/, '');
            if (pathName && pathName !== 'exec' && pathName !== 'dev' && pathName !== 'userCodeAppPanel') {
                return pathName;
            }
            return 'index';
        }
        window.fileName = getResolvedFileName();

        function getStoredClassList() {
            try {
                const primary = localStorage.getItem(fileName + '_classList');
                if (primary) return JSON.parse(primary);
                const fallbacks = ['index_classList', 'exec_classList', 'classList'];
                for (const fb of fallbacks) {
                    const val = localStorage.getItem(fb);
                    if (val) {
                        localStorage.setItem(fileName + '_classList', val);
                        return JSON.parse(val);
                    }
                }
            } catch(e) {
                console.error('Failed to parse classList from storage', e);
            }
            return [];
        }

        let classList = getStoredClassList();

        // 班級選擇相關函數
        function showAddClassInput() {
            document.getElementById('classInputContainer').style.display = 'block';
            document.getElementById('classNameInput').focus();
        }

        function hideAddClassInput() {
            document.getElementById('classInputContainer').style.display = 'none';
            document.getElementById('classNameInput').value = '';
        }

        function confirmAddClass() {
            const className = document.getElementById('classNameInput').value.trim();
            if (!className) {
                alert('請輸入班級名稱');
                return;
            }

            if (classList.includes(className)) {
                alert('班級名稱已存在');
                return;
            }

            classList.push(className);
            localStorage.setItem(fileName + '_classList', JSON.stringify(classList));
            hideAddClassInput();
            renderClassList();
        }

        function deleteClass(className) {
            if (confirm(`確定要刪除班級「${className}」嗎？這將永久刪除所有相關資料。`)) {
                // 刪除班級相關的所有資料
                const classPrefix = `${fileName}_${className}_`;
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(classPrefix)) {
                        localStorage.removeItem(key);
                    }
                });

                // 從班級列表中移除
                classList = classList.filter(c => c !== className);
                localStorage.setItem(fileName + '_classList', JSON.stringify(classList));
                renderClassList();
            }
        }

        function enterClass(className) {
            currentClass = className;
            localStorage.setItem('currentClass', className);

            // 隱藏班級選擇介面
            document.getElementById('classSelectionOverlay').style.display = 'none';
            document.body.classList.remove('class-selection-active');

            // 清空輸入框，確保不會載入上個班級的內容
            clearInputFields();

            // 更新標題顯示
            updateClassNameDisplay();

            // 重新載入資料
            loadClassData();
            initializeApp();

            // 檢查雲端連線狀態並更新按鈕
            checkCloudConnection();
        }

        // 清空所有輸入框和暫存資料
        function clearInputFields() {
            // 清空學生姓名輸入框
            const studentNamesTextarea = document.getElementById('studentNames');
            if (studentNamesTextarea) {
                studentNamesTextarea.value = '';
            }

            // 清空其他可能存在的輸入框
            const classNameInput = document.getElementById('classNameInput');
            if (classNameInput) {
                classNameInput.value = '';
            }

            // 清空座位表相關的暫存資料
            if (typeof studentList2 !== 'undefined') {
                studentList2 = [];
            }
            if (typeof seatingChartData2 !== 'undefined') {
                seatingChartData2 = [];
            }

            // 清空座位表顯示
            const seatingChart = document.getElementById('seatingChart2');
            if (seatingChart) {
                seatingChart.innerHTML = '';
            }

            // 重置座位表設定表單
            const groupingMethod = document.getElementById('groupingMethod2');
            if (groupingMethod) {
                groupingMethod.value = '';
            }
            const columns = document.getElementById('columns2');
            if (columns) {
                columns.value = 5;
            }
            const groups = document.getElementById('groups2');
            if (groups) {
                groups.value = 9;
            }
        }

        // 更新班級名稱顯示
        function updateClassNameDisplay() {
            const classNameElement = document.getElementById('currentClassName');
            if (classNameElement && currentClass) {
                classNameElement.innerHTML = `${currentClass} <span style="font-size: 0.8em; opacity: 0.7;">▼</span>`;
            } else if (classNameElement) {
                classNameElement.textContent = '';
            }
        }

        function renderClassList() {
            classList = getStoredClassList();
            const classListElement = document.getElementById('classList');
            if (!classListElement) return;

            if (classList.length === 0) {
                classListElement.innerHTML = '<div class="empty-class-list" style="grid-column: 1 / -1;">尚未建立任何班級</div>';
                return;
            }

            classListElement.innerHTML = classList.map(className => {
                // Get Macaron Palette for this class
                let hash = 0;
                for (let i = 0; i < className.length; i++) {
                    hash = className.charCodeAt(i) + ((hash << 5) - hash);
                }
                const index = Math.abs(hash) % macaronPalettes.length;
                const palette = macaronPalettes[index];
                
                return `
                <div class="class-item" style="background: ${palette.bg};">
                    <div class="class-name" style="color: ${palette.text};">${className}</div>
                    <div class="class-actions">
                        <button class="enter-class-button" style="background: ${palette.primary}; color: ${palette.text}; box-shadow: 0 4px 10px ${palette.secondary};" onclick="enterClass('${className}')">進入</button>
                        <button class="delete-class-button" onclick="deleteClass('${className}')">刪除</button>
                    </div>
                </div>
                `;
            }).join('');
        }

        function loadClassData() {
            if (!currentClass) return;

            // 重新載入所有資料
            students = getClassData('students', []);
            scores = getClassData('scores', {});
            homeworks = getClassData('homeworks', {});
            groups = getClassData('groups', {});
            redemptionHistory = getClassData('redemptionHistory', {});
            attendanceRecords = getClassData('attendanceRecords', {});
            // 舊版點名格式自動轉為精簡格式（檢視模式下只轉換、不寫入）
            if (normalizeAttendanceRecords(attendanceRecords)) {
                setClassData('attendanceRecords', attendanceRecords);
            }

            applyMacaronTheme(currentClass);
        }

        function showClassSelection() {
            document.getElementById('classSelectionOverlay').style.display = 'flex';
            document.body.classList.add('class-selection-active');
            renderClassList();
            // 已有班級時直接顯示班級分頁，第一次使用則先看功能介紹
            showMainTab(classList.length > 0 ? 'classes' : 'intro');
        }

        // 主畫面分頁切換：intro = 功能介紹、classes = 班級與編輯模式
        function showMainTab(tab) {
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.getElementById('mainTabIntro').classList.toggle('active', tab === 'intro');
            document.getElementById('mainTabClasses').classList.toggle('active', tab === 'classes');
        }

        // 初始化班級選擇
        function initializeClassSelection() {
            // 強制顯示班級選擇，不自動進入
            showClassSelection();
        }

        // 取得目前班級的資料前綴
        function getClassPrefix(cName = currentClass) {
            return cName ? `${fileName}_${cName}_` : `${fileName}_`;
        }

        // localStorage 輔助函數
        function setClassData(key, data) {
            localStorage.setItem(getClassPrefix() + key, JSON.stringify(data));
        }

        function getClassData(key, defaultValue = null) {
            let data = localStorage.getItem(getClassPrefix() + key);
            if (data === null && currentClass) {
                const fallbackPrefixes = [`index_${currentClass}_`, `exec_${currentClass}_`, `${currentClass}_`];
                for (const p of fallbackPrefixes) {
                    const fallbackData = localStorage.getItem(p + key);
                    if (fallbackData !== null) {
                        data = fallbackData;
                        break;
                    }
                }
            }
            return data ? JSON.parse(data) : defaultValue;
        }

        function removeClassData(key) {
            localStorage.removeItem(getClassPrefix() + key);
        }

        const backgroundColors = ['#FFFACD', '#FFDAB9', '#E6E6FA', '#E0FFFF', '#F0E68C'];
        document.body.style.backgroundColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];



        // 使用動態前綴
        function getLocalStoragePrefix() {
            return getClassPrefix();
        }

        // 初始化變數（班級資料載入時會重新設定）
        let students = [];
        let scores = {};
        let homeworks = {};
        let groups = {};
        let redemptionHistory = {};

        let chart;
        let weeklyChart;
        let monthlyChart;
        let currentMonth = new Date();
        let currentDay = null;
        let scoresChanged = false;

        let hideCompletedStudents = false;

        // 初始化函數
        function initializeApp() {
            document.getElementById('calendar').style.display = 'block';
            document.getElementById('header').style.display = 'flex';
            showSideMenuToggle(); // 顯示側邊選單按鈕
            renderCalendar();
        }

        // 確保DOM完全載入後再執行初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializeClassSelection();
                checkCloudConnection();
            });
        } else {
            initializeClassSelection();
            checkCloudConnection();
        }

        // 獲取學生姓名的輔助函數
        function getStudentNames() {
            // 直接使用全域的 students 陣列
            return students || [];
        }
