// ===== 點名（出缺席） =====
        /* -------------------------------------
           (C) 點名功能的變數與初始化
        ------------------------------------- */
        // 用來儲存各日期的點名資料（精簡格式，節省空間）
        // 格式: attendanceRecords[dateKey][studentName] = '11011111'
        //       第 n 個字元代表第 n 節：'1' = ✓、'0' = ✗
        // 全部為 ✗（預設值）的學生與日期不儲存
        let attendanceRecords = {};
        const ATTENDANCE_PERIODS = 8; // 節次數，可根據需求調整

        function isPresent(dateKey, student, period) {
            const marks = (attendanceRecords[dateKey] || {})[student] || '';
            return marks[period - 1] === '1';
        }

        function setPresent(dateKey, student, period, present) {
            const day = attendanceRecords[dateKey] || (attendanceRecords[dateKey] = {});
            const marks = (day[student] || '').padEnd(ATTENDANCE_PERIODS, '0').split('');
            marks[period - 1] = present ? '1' : '0';
            const value = marks.join('');
            if (value.includes('1')) day[student] = value;
            else delete day[student];
            if (Object.keys(day).length === 0) delete attendanceRecords[dateKey];
        }

        function renderAttendanceCell(cell, present) {
            cell.className = present ? 'attendance-present' : 'attendance-absent';
            cell.textContent = present ? '✓' : '✗';
        }

        // 舊格式 { 學生: { 節次: 'red' | 'green' } } 轉為新格式；有轉換時回傳 true
        function normalizeAttendanceRecords(records) {
            let changed = false;
            Object.keys(records).forEach(dateKey => {
                const day = records[dateKey] || {};
                Object.keys(day).forEach(student => {
                    const old = day[student];
                    if (typeof old === 'string') return;
                    changed = true;
                    let value = '';
                    for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                        value += old && old[p] === 'green' ? '1' : '0';
                    }
                    if (value.includes('1')) day[student] = value;
                    else delete day[student];
                });
                if (Object.keys(day).length === 0) {
                    delete records[dateKey];
                    changed = true;
                }
            });
            return changed;
        }

        /* -------------------------------------
           (C1) 顯示與隱藏「點名」Overlay
        ------------------------------------- */
        function showAttendance() {
            // 取得目前操作的日期 (與加扣分相同)
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;

            // 產生點名表格
            renderAttendanceTable(dateKey);

            // 顯示 Overlay
            document.getElementById('attendanceOverlay').style.display = 'flex';
        }

        function hideAttendance() {
            document.getElementById('attendanceOverlay').style.display = 'none';
        }

        /* -------------------------------------
           (C2) 產生點名表格（只顯示，不寫入資料）
        ------------------------------------- */
        function renderAttendanceTable(dateKey) {
            const container = document.getElementById('attendanceTableContainer');
            container.innerHTML = '';  // 清空

            // 建立表格
            const table = document.createElement('table');

            // 產生表頭
            const thead = table.createTHead();
            const headRow = thead.insertRow();

            // 左上角空白，並設置點擊事件以選擇所有學生
            let th = document.createElement('th');
            th.textContent = '學生\\節次';
            th.onclick = () => toggleAllStudentsAttendance(dateKey);
            headRow.appendChild(th);

            // 建立各節課的欄位，並設置點擊事件以選擇所有學生在該節次
            for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                let thP = document.createElement('th');
                thP.textContent = `第${p}節`;
                thP.onclick = () => toggleAllPeriodsAttendance(dateKey, p);
                headRow.appendChild(thP);
            }

            // 產生表身 (學生列表)
            const tbody = table.createTBody();

            students.forEach(student => {
                const row = tbody.insertRow();

                // 第一格放學生姓名，並設置點擊事件以切換該學生所有節次
                const nameCell = row.insertCell();
                nameCell.textContent = student;
                nameCell.onclick = () => toggleStudentAttendance(dateKey, student);

                // 產生各節次的儲存格（沒有紀錄的預設為 ✗）
                for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                    const cell = row.insertCell();
                    renderAttendanceCell(cell, isPresent(dateKey, student, p));

                    // 點擊切換
                    cell.onclick = () => {
                        toggleAttendance(dateKey, student, p, cell);
                    };
                }
            });

            container.appendChild(table);
        }



        /* -------------------------------------
           (C3) 點擊切換出席狀態
        ------------------------------------- */
        function toggleAttendance(dateKey, student, period, cell) {
            const present = !isPresent(dateKey, student, period);
            setPresent(dateKey, student, period, present);

            // 即時更新畫面
            renderAttendanceCell(cell, present);

            // 存回 localStorage
            setClassData('attendanceRecords', attendanceRecords);
        }

        /* -------------------------------------
           (C4) 批次點名功能
        ------------------------------------- */

        /**
         * 點擊學生姓名時，切換該學生所有節次的點名狀態
         * @param {string} dateKey - 日期鍵值
         * @param {string} student - 學生姓名
         */
        function toggleStudentAttendance(dateKey, student) {
            // 全部已點名就全部取消，否則全部設為已點名
            let allPresent = true;
            for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                if (!isPresent(dateKey, student, p)) {
                    allPresent = false;
                    break;
                }
            }

            for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                setPresent(dateKey, student, p, !allPresent);
            }

            // 更新畫面
            const row = Array.from(document.querySelectorAll('#attendanceTableContainer table tbody tr'))
                .find(r => r.querySelector('td').textContent === student);

            if (row) {
                for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                    renderAttendanceCell(row.cells[p], !allPresent);
                }
            }

            // 存回 localStorage
            setClassData('attendanceRecords', attendanceRecords);
        }

        /**
         * 點擊節次標題時，切換所有學生在該節次的點名狀態
         * @param {string} dateKey - 日期鍵值
         * @param {number} period - 節次
         */
        function toggleAllPeriodsAttendance(dateKey, period) {
            const allPresent = students.every(student => isPresent(dateKey, student, period));

            students.forEach(student => {
                setPresent(dateKey, student, period, !allPresent);
            });

            // 更新畫面
            const table = document.querySelector('#attendanceTableContainer table');
            if (table) {
                const rows = table.rows;
                for (let i = 1; i < rows.length; i++) { // 從1開始，跳過表頭
                    renderAttendanceCell(rows[i].cells[period], !allPresent);
                }
            }

            // 存回 localStorage
            setClassData('attendanceRecords', attendanceRecords);
        }

        /**
         * 點擊最上方的「學生\\節次」單元格時，切換所有學生的所有節次點名狀態
         * @param {string} dateKey - 日期鍵值
         */
        function toggleAllStudentsAttendance(dateKey) {
            let allPresent = true;
            for (let student of students) {
                for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                    if (!isPresent(dateKey, student, p)) {
                        allPresent = false;
                        break;
                    }
                }
                if (!allPresent) break;
            }

            students.forEach(student => {
                for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                    setPresent(dateKey, student, p, !allPresent);
                }
            });

            // 更新畫面
            const table = document.querySelector('#attendanceTableContainer table');
            if (table) {
                const rows = table.rows;
                for (let i = 1; i < rows.length; i++) { // 從1開始，跳過表頭
                    for (let p = 1; p <= ATTENDANCE_PERIODS; p++) {
                        renderAttendanceCell(rows[i].cells[p], !allPresent);
                    }
                }
            }

            // 存回 localStorage
            setClassData('attendanceRecords', attendanceRecords);
        }
