// ===== 作業追蹤（依作業／依學生查詢、狀態切換） =====
        function showHomeworkTracking() {
            document.getElementById('homeworkTrackingStart').value = '';
            document.getElementById('homeworkTrackingEnd').value = '';
            document.getElementById('homeworkTrackingResult').innerHTML = '';

            const studentSelect = document.getElementById('studentHomeworkSelect');
            studentSelect.innerHTML = '<option value="">請選擇學生</option>'; // Clear previous options and add a default

            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student;
                option.textContent = student;
                studentSelect.appendChild(option);
            });

            document.getElementById('homeworkTrackingOverlay').style.display = 'flex';
        }

        function hideHomeworkTracking() {
            document.getElementById('homeworkTrackingOverlay').style.display = 'none';
        }

        function showHomeworkTab(tabName) {
            // 清空結果顯示
            document.getElementById('homeworkTrackingResult').innerHTML = '';

            // 隱藏所有分頁內容
            const tabContents = document.querySelectorAll('.homework-tab-content');
            tabContents.forEach(content => content.classList.remove('active'));

            // 移除所有按鈕的 active class
            const tabBtns = document.querySelectorAll('.homework-tab-btn');
            tabBtns.forEach(btn => btn.classList.remove('active'));

            // 顯示選中的分頁
            if (tabName === 'dateRange') {
                document.getElementById('homeworkTabDateRange').classList.add('active');
                event.target.classList.add('active');
            } else if (tabName === 'student') {
                document.getElementById('homeworkTabStudent').classList.add('active');
                event.target.classList.add('active');
            } else if (tabName === 'list') {
                document.getElementById('homeworkTabList').classList.add('active');
                event.target.classList.add('active');
            }
        }

        function searchHomeworkList() {
            const start = document.getElementById('homeworkListStart').value;
            const end = document.getElementById('homeworkListEnd').value;
            const keyword = document.getElementById('homeworkListKeyword').value.trim().toLowerCase();

            // 檢查至少要有一個查詢條件
            if (!start && !end && !keyword) {
                alert("請至少輸入一個查詢條件（日期區間或關鍵字）");
                return;
            }

            // 檢查日期邏輯（如果有填日期的話）
            const hasDateRange = start && end;
            if ((start && !end) || (!start && end)) {
                alert("請同時選擇開始日期和結束日期");
                return;
            }

            if (hasDateRange) {
                const startDate = new Date(start);
                const endDate = new Date(end);
                if (endDate < startDate) {
                    alert("結束日期不能早於開始日期");
                    return;
                }
            }

            const resultDiv = document.getElementById('homeworkTrackingResult');
            resultDiv.innerHTML = '';

            // 決定要搜尋的日期範圍
            let dateKeys = [];
            if (hasDateRange) {
                // 有指定日期區間
                const startDate = new Date(start);
                const endDate = new Date(end);
                let d = new Date(startDate);
                while (d <= endDate) {
                    const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                    dateKeys.push(dateKey);
                    d.setDate(d.getDate() + 1);
                }
            } else {
                // 沒有指定日期區間，搜尋所有日期
                dateKeys = Object.keys(homeworks);
            }

            let homeworkList = [];
            dateKeys.forEach(dateKey => {
                if (homeworks[dateKey]) {
                    const assignments = homeworks[dateKey];
                    assignments.forEach(assignment => {
                        // 如果有關鍵字，進行過濾
                        if (keyword === '' || assignment.toLowerCase().includes(keyword)) {
                            homeworkList.push({
                                dateKey: dateKey,
                                assignment: assignment
                            });
                        }
                    });
                }
            });

            if (homeworkList.length === 0) {
                let message = '';
                if (hasDateRange && keyword) {
                    message = `在選定的日期區間內沒有找到包含「${keyword}」的作業。`;
                } else if (hasDateRange) {
                    message = '在選定的日期區間內沒有作業。';
                } else if (keyword) {
                    message = `沒有找到包含「${keyword}」的作業。`;
                }
                resultDiv.innerHTML = `<p>${message}</p>`;
                return;
            }

            // 按日期排序
            homeworkList.sort((a, b) => {
                const ad = new Date(a.dateKey.replace(/-/g, '/'));
                const bd = new Date(b.dateKey.replace(/-/g, '/'));
                if (ad < bd) return -1;
                if (ad > bd) return 1;
                return 0;
            });

            // 創建標題
            const title = document.createElement('h4');
            let titleText = '作業列表';
            if (hasDateRange && keyword) {
                const startDateText = new Date(start).toLocaleDateString('zh-TW');
                const endDateText = new Date(end).toLocaleDateString('zh-TW');
                titleText = `作業列表（${startDateText} ~ ${endDateText}，關鍵字：${keyword}）`;
            } else if (hasDateRange) {
                const startDateText = new Date(start).toLocaleDateString('zh-TW');
                const endDateText = new Date(end).toLocaleDateString('zh-TW');
                titleText = `作業列表（${startDateText} ~ ${endDateText}）`;
            } else if (keyword) {
                titleText = `作業列表（關鍵字：${keyword}）`;
            }
            title.textContent = titleText;
            title.style.marginBottom = '15px';
            resultDiv.appendChild(title);

            // 創建表格
            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.border = '2px solid black';

            // 表頭
            const thead = table.createTHead();
            const headRow = thead.insertRow();

            const thDate = document.createElement('th');
            thDate.style.border = '2px solid black';
            thDate.style.padding = '10px';
            thDate.style.backgroundColor = '#e3f2fd';
            thDate.textContent = '日期';
            thDate.style.fontSize = '16px';
            thDate.style.fontWeight = 'bold';
            thDate.style.width = '30%';
            headRow.appendChild(thDate);

            const thAssignment = document.createElement('th');
            thAssignment.style.border = '2px solid black';
            thAssignment.style.padding = '10px';
            thAssignment.style.backgroundColor = '#e3f2fd';
            thAssignment.textContent = '作業名稱';
            thAssignment.style.fontSize = '16px';
            thAssignment.style.fontWeight = 'bold';
            headRow.appendChild(thAssignment);

            const thStats = document.createElement('th');
            thStats.style.border = '2px solid black';
            thStats.style.padding = '10px';
            thStats.style.backgroundColor = '#e3f2fd';
            thStats.textContent = '完成狀況';
            thStats.style.fontSize = '16px';
            thStats.style.fontWeight = 'bold';
            thStats.style.width = '30%';
            headRow.appendChild(thStats);

            // 表格內容
            const tbody = table.createTBody();
            homeworkList.forEach(item => {
                const row = tbody.insertRow();

                // 日期欄
                const cellDate = row.insertCell();
                cellDate.style.border = '2px solid black';
                cellDate.style.padding = '10px';
                const dateText = new Date(item.dateKey.replace(/-/g, '/')).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                cellDate.textContent = dateText;

                // 作業名稱欄
                const cellAssignment = row.insertCell();
                cellAssignment.style.border = '2px solid black';
                cellAssignment.style.padding = '10px';
                cellAssignment.textContent = item.assignment;

                // 統計完成狀況
                const checklistData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${item.dateKey}`)) || {};
                let completedCount = 0;
                let incompleteCount = 0;
                let partialCount = 0;

                students.forEach(student => {
                    const status = checklistData[item.assignment] && checklistData[item.assignment][student] ?
                        checklistData[item.assignment][student] : 'green';

                    if (status === 'green') {
                        completedCount++;
                    } else if (status === 'red') {
                        incompleteCount++;
                    } else if (status === 'orange') {
                        partialCount++;
                    }
                });

                // 完成狀況欄
                const cellStats = row.insertCell();
                cellStats.style.border = '2px solid black';
                cellStats.style.padding = '10px';
                cellStats.innerHTML = `
                    <span style="color: green; font-weight: bold;">✓ ${completedCount}</span> /
                    <span style="color: orange; font-weight: bold;">△ ${partialCount}</span> /
                    <span style="color: red; font-weight: bold;">✗ ${incompleteCount}</span>
                `;
            });

            resultDiv.appendChild(table);

            // 新增統計資訊
            const summary = document.createElement('p');
            summary.style.marginTop = '15px';
            summary.style.fontWeight = 'bold';
            summary.textContent = `共找到 ${homeworkList.length} 筆作業`;
            resultDiv.appendChild(summary);
        }

        function updateChecklistLocalStorage(dateKey, assignment, student, color) {
            let statusData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
            if (!statusData[assignment]) statusData[assignment] = {};
            statusData[assignment][student] = color;
            localStorage.setItem(`${getClassPrefix()}checklist_${dateKey}`, JSON.stringify(statusData));
        }

        function searchHomeworkTracking() {
            const start = document.getElementById('homeworkTrackingStart').value;
            const end = document.getElementById('homeworkTrackingEnd').value;
            if (!start || !end) {
                alert("請選擇日期區間");
                return;
            }

            const startDate = new Date(start);
            const endDate = new Date(end);
            if (endDate < startDate) {
                alert("結束日期不能早於開始日期");
                return;
            }

            const resultDiv = document.getElementById('homeworkTrackingResult');
            resultDiv.innerHTML = '';

            const dateKeys = [];
            let d = new Date(startDate);
            while (d <= endDate) {
                const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                dateKeys.push(dateKey);
                d.setDate(d.getDate() + 1);
            }

            const trackingData = {};
            let assignmentDatePairs = [];

            dateKeys.forEach(dateKey => {
                if (homeworks[dateKey]) {
                    const checklistData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
                    const assignments = homeworks[dateKey];

                    assignments.forEach(a => {
                        assignmentDatePairs.push({ dateKey: dateKey, assignment: a });
                        students.forEach(stu => {
                            const status = checklistData[a] && checklistData[a][stu] ? checklistData[a][stu] : 'green';
                            if (!trackingData[stu]) trackingData[stu] = {};
                            if (!trackingData[stu][a]) trackingData[stu][a] = {};
                            trackingData[stu][a][dateKey] = status;
                        });
                    });
                }
            });

            const filteredStudents = students.filter(stu => {
                for (const { assignment, dateKey } of assignmentDatePairs) {
                    if (trackingData[stu] && trackingData[stu][assignment] && trackingData[stu][assignment][dateKey]) {
                        const st = trackingData[stu][assignment][dateKey];
                        if (st === 'red' || st === 'orange') {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (filteredStudents.length === 0) {
                resultDiv.textContent = "沒有符合條件的學生";
                return;
            }

            assignmentDatePairs.sort((a, b) => {
                const ad = new Date(a.dateKey.replace(/-/g, '/'));
                const bd = new Date(b.dateKey.replace(/-/g, '/'));
                if (ad < bd) return -1;
                if (ad > bd) return 1;
                if (a.assignment < b.assignment) return -1;
                if (a.assignment > b.assignment) return 1;
                return 0;
            });

            const dateSet = Array.from(new Set(assignmentDatePairs.map(p => p.dateKey)));
            const dateColors = ['#ffe4e1', '#e6e6fa', '#f0fff0', '#fff5ee', '#f5f5dc'];
            const dateColorMap = {};
            dateSet.forEach((dateKey, i) => {
                dateColorMap[dateKey] = dateColors[i % dateColors.length];
            });

            const saveButtonContainer = document.createElement('div');
            saveButtonContainer.style.textAlign = 'right';
            saveButtonContainer.style.marginBottom = '10px';
            const forceSaveButton = document.createElement('button');
            forceSaveButton.textContent = '立即儲存';
            forceSaveButton.onclick = saveHomeworkTrackingData;
            saveButtonContainer.appendChild(forceSaveButton);
            resultDiv.appendChild(saveButtonContainer);

            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.border = '2px solid black';

            const thead = table.createTHead();
            const headRow = thead.insertRow();
            let th = document.createElement('th');
            th.style.border = '2px solid black';
            th.textContent = '學生/作業';
            th.style.fontSize = '16px';
            th.style.color = 'blue';
            th.style.fontWeight = 'bold';
            headRow.appendChild(th);

            assignmentDatePairs.forEach(({ assignment, dateKey }) => {
                let th2 = document.createElement('th');
                th2.style.border = '2px solid black';
                const dateText = new Date(dateKey.replace(/-/g, '/')).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
                th2.innerHTML = `${assignment}<br><span style="font-size:16px; color:blue; font-weight:bold;">${dateText}</span>`;
                th2.style.backgroundColor = dateColorMap[dateKey];
                headRow.appendChild(th2);
            });

            const tbody = table.createTBody();
            filteredStudents.forEach(stu => {
                const row = tbody.insertRow();
                let cell = row.insertCell();
                cell.style.border = '2px solid black';
                cell.textContent = stu;
                cell.style.fontSize = '16px';
                cell.style.color = 'blue';
                cell.style.fontWeight = 'bold';

                assignmentDatePairs.forEach(({ assignment, dateKey }) => {
                    const c = row.insertCell();
                    c.style.border = '2px solid black';
                    c.style.backgroundColor = dateColorMap[dateKey];
                    let finalStatus = 'green';
                    let text = '已繳交';

                    if (trackingData[stu] && trackingData[stu][assignment] && trackingData[stu][assignment][dateKey]) {
                        const st = trackingData[stu][assignment][dateKey];
                        if (st === 'red') {
                            finalStatus = 'red';
                            text = '未繳交';
                        } else if (st === 'orange') {
                            finalStatus = 'orange';
                            text = '待訂正';
                        } else if (st === 'blue') {
                            finalStatus = 'blue';
                            text = '已訂正';
                        } else {
                            finalStatus = 'green';
                            text = '已繳交';
                        }
                    }

                    const btn = document.createElement('button');
                    btn.className = 'status-button';
                    btn.style.backgroundColor = finalStatus;
                    btn.style.color = 'white';
                    btn.textContent = text;
                    btn.dataset.assignment = assignment;
                    btn.dataset.student = stu;
                    btn.dataset.datekey = dateKey;
                    btn.onclick = () => {
                        toggleButtonStatus(btn, stu, assignment);
                    };
                    c.appendChild(btn);
                });
            });

            resultDiv.appendChild(table);
        }

        function saveHomeworkTrackingData() {
            const buttons = document.querySelectorAll('#homeworkTrackingResult .status-button');
            buttons.forEach(button => {
                const dateKey = button.dataset.datekey;
                const stu = button.dataset.student;
                const asg = button.dataset.assignment;
                const color = button.style.backgroundColor;
                if (dateKey && asg && stu) {
                    let statusData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
                    if (!statusData[asg]) statusData[asg] = {};
                    statusData[asg][stu] = color;
                    localStorage.setItem(`${getClassPrefix()}checklist_${dateKey}`, JSON.stringify(statusData));
                }
            });
            alert("目前的作業狀態已強制儲存！");
        }

        function searchHomeworkByStudent() {
            const studentSelect = document.getElementById('studentHomeworkSelect');
            const selectedStudent = studentSelect.value;

            if (!selectedStudent) {
                alert("請選擇一位學生");
                return;
            }

            const resultDiv = document.getElementById('homeworkTrackingResult');
            resultDiv.innerHTML = '';

            let assignmentDatePairs = [];

            // Get all date keys from homeworks and sort them
            const sortedDateKeys = Object.keys(homeworks).sort((a, b) => new Date(a) - new Date(b));

            sortedDateKeys.forEach(dateKey => {
                if (homeworks[dateKey]) {
                    const checklistData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
                    const assignments = homeworks[dateKey];

                    assignments.forEach(assignmentName => {
                        const studentStatus = checklistData[assignmentName] ? checklistData[assignmentName][selectedStudent] : undefined;
                        // We only care about incomplete assignments for this view
                        if (studentStatus === 'red' || studentStatus === 'orange') {
                            assignmentDatePairs.push({ dateKey: dateKey, assignment: assignmentName });
                        }
                    });
                }
            });

            if (assignmentDatePairs.length === 0) {
                resultDiv.innerHTML = `<h4>${selectedStudent} 的未完成作業列表：</h4><p>太棒了！沒有未完成的作業。</p>`;
                return;
            }

            // Sort assignments by date
            assignmentDatePairs.sort((a, b) => {
                const ad = new Date(a.dateKey.replace(/-/g, '/'));
                const bd = new Date(b.dateKey.replace(/-/g, '/'));
                if (ad < bd) return -1;
                if (ad > bd) return 1;
                if (a.assignment < b.assignment) return -1;
                if (a.assignment > b.assignment) return 1;
                return 0;
            });

            // Create color map for dates
            const dateSet = Array.from(new Set(assignmentDatePairs.map(p => p.dateKey)));
            const dateColors = ['#ffe4e1', '#e6e6fa', '#f0fff0', '#fff5ee', '#f5f5dc'];
            const dateColorMap = {};
            dateSet.forEach((dateKey, i) => {
                dateColorMap[dateKey] = dateColors[i % dateColors.length];
            });

            // Add a save button
            const saveButtonContainer = document.createElement('div');
            saveButtonContainer.style.textAlign = 'right';
            saveButtonContainer.style.marginBottom = '10px';
            const forceSaveButton = document.createElement('button');
            forceSaveButton.textContent = '立即儲存';
            forceSaveButton.onclick = saveHomeworkTrackingData;
            saveButtonContainer.appendChild(forceSaveButton);
            resultDiv.appendChild(saveButtonContainer);

            // Create the table
            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.border = '2px solid black';

            // Table Header
            const thead = table.createTHead();
            const headRow = thead.insertRow();
            let th = document.createElement('th');
            th.style.border = '2px solid black';
            th.textContent = '學生/作業';
            th.style.fontSize = '16px';
            th.style.color = 'blue';
            th.style.fontWeight = 'bold';
            headRow.appendChild(th);

            assignmentDatePairs.forEach(({ assignment, dateKey }) => {
                let th2 = document.createElement('th');
                th2.style.border = '2px solid black';
                const dateText = new Date(dateKey.replace(/-/g, '/')).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
                th2.innerHTML = `${assignment}<br><span style="font-size:16px; color:blue; font-weight:bold;">${dateText}</span>`;
                th2.style.backgroundColor = dateColorMap[dateKey];
                headRow.appendChild(th2);
            });

            // Table Body
            const tbody = table.createTBody();
            const row = tbody.insertRow();
            let cell = row.insertCell();
            cell.style.border = '2px solid black';
            cell.textContent = selectedStudent;
            cell.style.fontSize = '16px';
            cell.style.color = 'blue';
            cell.style.fontWeight = 'bold';

            assignmentDatePairs.forEach(({ assignment, dateKey }) => {
                const c = row.insertCell();
                c.style.border = '2px solid black';
                c.style.backgroundColor = dateColorMap[dateKey];

                const checklistData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
                const status = checklistData[assignment] ? checklistData[assignment][selectedStudent] : 'red';

                let finalStatus = status === 'orange' ? 'orange' : 'red';
                let text = status === 'orange' ? '待訂正' : '未繳交';

                const btn = document.createElement('button');
                btn.className = 'status-button';
                btn.style.backgroundColor = finalStatus;
                btn.style.color = 'white';
                btn.textContent = text;
                btn.dataset.assignment = assignment;
                btn.dataset.student = selectedStudent;
                btn.dataset.datekey = dateKey;
                btn.onclick = () => {
                    toggleButtonStatus(btn, selectedStudent, assignment);
                };
                c.appendChild(btn);
            });

            resultDiv.appendChild(table);
        }
