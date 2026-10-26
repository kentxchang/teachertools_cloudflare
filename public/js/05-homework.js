// ===== 作業登記、作業檢核表 =====
        function showHomeworkOverlay(event, dateKey) {
            event.stopPropagation();
            document.getElementById('homeworkOverlay').style.display = 'flex';
            document.getElementById('homeworkDate').textContent = new Date(dateKey).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('homeworkDate').dataset.dateKey = dateKey;
            document.getElementById('homeworkText').value = homeworks[dateKey] ? homeworks[dateKey].join('\n') : '';
        }

        function hideOverlay(event, overlayId) {
            event.stopPropagation();
            document.getElementById(overlayId).style.display = 'none';
        }

        function submitHomework() {
            const dateKey = document.getElementById('homeworkDate').dataset.dateKey;
            const homeworkText = document.getElementById('homeworkText').value.trim();
            if (homeworkText) {
                homeworks[dateKey] = homeworkText.split('\n').map(item => item.trim()).filter(item => item);
                setClassData('homeworks', homeworks);
                try {
                    const dayElement = document.querySelector(`.calendarDay button[onclick*="showHomeworkOverlay(event, '${dateKey}')"]`).parentNode;
                    if (dayElement) {
                        const hideElement = dayElement.querySelector('.hide');
                        if (hideElement) {
                            hideElement.classList.remove('hide');
                        }
                        const buttons = dayElement.querySelectorAll('button');
                        if (buttons[2]) {
                            buttons[2].classList.remove('hide');
                        }
                    }
                } catch (error) {
                    console.log('無法更新日曆按鈕顯示狀態:', error);
                }
            }
            document.getElementById('homeworkOverlay').style.display = 'none';
        }

        function showViewHomeworkOverlay(event, dateKey) {
            event.stopPropagation();
            document.getElementById('viewHomeworkOverlay').style.display = 'flex';
            document.getElementById('viewHomeworkDate').textContent = new Date(dateKey).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            const assignmentList = document.getElementById('assignmentList');
            assignmentList.innerHTML = ''; // 清空舊內容
            if (homeworks[dateKey]) {
                homeworks[dateKey].forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 1}. ${item}`;
                    li.classList.add('highlighted-assignment'); // 添加樣式
                    assignmentList.appendChild(li);
                });
            }
        }

        function showChecklistSection(dateKey) {
            const storedData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};
            const homeworkList = homeworks[dateKey] || [];
            document.getElementById('checklistDate').textContent = new Date(dateKey).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('checklistDate').dataset.dateKey = dateKey;
            document.getElementById('statusContainer').innerHTML = generateStatusTables(homeworkList);
            document.getElementById('tablesContainer').innerHTML = generateChecklistTables(homeworkList, storedData);
            document.getElementById('calendar').style.display = 'none';
            document.getElementById('header').style.display = 'none';
            document.getElementById('checklistSection').style.display = 'block';
            hideSideMenuToggle();
            updateStatusLists();

            // 重新加入作業名稱及學生姓名點擊事件
            const assignmentHeaders = document.querySelectorAll('#tablesContainer table thead th:not(.student-name)');
            assignmentHeaders.forEach(th => {
                const assignmentName = th.textContent.trim();
                if (assignmentName !== '') {
                    th.style.cursor = 'pointer';
                    th.addEventListener('click', () => {
                        toggleAssignmentStatus(assignmentName);
                    });
                }
            });

            const studentNameCells = document.querySelectorAll('#tablesContainer table tbody .student-name');
            studentNameCells.forEach(td => {
                const studentName = td.textContent.trim();
                if (studentName !== '') {
                    td.style.cursor = 'pointer';
                    td.addEventListener('click', () => {
                        toggleStudentStatus(studentName);
                    });
                }
            });
        }

        function generateStatusTables(cols) {
            const colorSchemes = [
                { bg: 'linear-gradient(135deg, #ffcccb 0%, #ffd1dc 100%)', border: '#ff6b6b', title: '#2c3e50' },
                { bg: 'linear-gradient(135deg, #e6e6fa 0%, #dda0dd 100%)', border: '#9370db', title: '#2c3e50' },
                { bg: 'linear-gradient(135deg, #f0fff0 0%, #98fb98 100%)', border: '#32cd32', title: '#2c3e50' },
                { bg: 'linear-gradient(135deg, #fff5ee 0%, #ffa07a 100%)', border: '#ff7f50', title: '#2c3e50' },
                { bg: 'linear-gradient(135deg, #f5f5dc 0%, #f0e68c 100%)', border: '#daa520', title: '#2c3e50' }
            ];
            return cols.map((col, index) => {
                const scheme = colorSchemes[index % colorSchemes.length];
                return `
                <table class="status-table status-table-${index}" style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                    <thead>
                        <tr>
                            <th colspan="3" style="border: 1px solid ${scheme.border}; background: ${scheme.bg}; font-size: 18px; color: ${scheme.title}; font-weight: bold; padding: 15px; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">${col}</th>
                        </tr>
                        <tr>
                            <th style="border: 1px solid ${scheme.border}; background: ${scheme.bg}; padding: 12px; color: ${scheme.title}; font-weight: bold;">未繳交</th>
                            <th style="border: 1px solid ${scheme.border}; background: ${scheme.bg}; padding: 12px; color: ${scheme.title}; font-weight: bold;">待訂正</th>
                            <th style="border: 1px solid ${scheme.border}; background: ${scheme.bg}; padding: 12px; color: ${scheme.title}; font-weight: bold;">已訂正</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="not-submitted-${col}" style="border: 1px solid ${scheme.border}; background-color: #f8f9fa; padding: 12px; min-height: 60px;"></td>
                            <td id="correction-${col}" style="border: 1px solid ${scheme.border}; background-color: #f8f9fa; padding: 12px; min-height: 60px;"></td>
                            <td id="corrected-${col}" style="border: 1px solid ${scheme.border}; background-color: #f8f9fa; padding: 12px; min-height: 60px;"></td>
                        </tr>
                    </tbody>
                </table>
            `;
            }).join('');
        }

        function generateChecklistTables(cols, storedData) {
            const colors = ['#ffe4e1', '#e6e6fa', '#f0fff0', '#fff5ee', '#f5f5dc'];
            let tables = '';
            const chunkSize = 10;
            for (let i = 0; i < students.length; i += chunkSize) {
                tables += `
                    <table style="table-layout: fixed; margin: 10px; border-collapse: collapse; background-color: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <thead>
                            <tr>
                                <th class="student-name" style="width: 90px; height: 15px;">學生姓名</th>
                                ${cols.map((col, index) => col.trim() !== '' ? `<th style="width: 90px; height: 15px; border: 2px solid #000; background-color: ${colors[index % colors.length]};">${col}</th>` : '').join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${generateChecklistRows(cols, i, i + chunkSize, storedData)}
                        </tbody>
                    </table>
                `;
            }
            return tables;
        }

        function generateChecklistRows(cols, start, end, storedData) {
            let rows = '';
            const chunk = students.slice(start, end);
            chunk.forEach((student, index) => {
                let assignments = '';
                for (let i = 0; i < cols.length; i++) {
                    if (cols[i].trim() !== '') {
                        const assignment = cols[i].trim();
                        const status = storedData[assignment] && storedData[assignment][student] ? storedData[assignment][student] : 'red';
                        const text = status === 'red' ? '未繳交' : status === 'green' ? '已繳交' : status === 'orange' ? '待訂正' : '已訂正';
                        assignments += `
                            <td style="width: 90px; height: 15px; background-color: #dcdcdc; border: 2px solid #000;">
                                <button class="status-button" style="background-color: ${status}; color: white;" onclick="toggleButtonStatus(this, '${student}', '${assignment}')" data-assignment="${assignment}" data-student="${student}" data-datekey="${document.getElementById('checklistDate').dataset.dateKey || ''}">${text}</button>
                            </td>
                        `;
                    }
                }
                rows += `
                    <tr>
                        <td class="student-name" style="width: 90px; height: 15px; background-color: #f0e68c; font-weight: bold; border: 2px solid #000;">${student}</td>
                        ${assignments}
                    </tr>
                `;
            });
            return rows;
        }

        function toggleButtonStatus(button, student, assignment) {
            const currentColor = button.style.backgroundColor;
            let newColor = 'red';
            let newText = '未繳交';
            if (currentColor === 'red') {
                newColor = 'green';
                newText = '已繳交';
            } else if (currentColor === 'green') {
                newColor = 'orange';
                newText = '待訂正';
            } else if (currentColor === 'orange') {
                newColor = 'blue';
                newText = '已訂正';
            } else {
                newColor = 'red';
                newText = '未繳交';
            }

            button.style.backgroundColor = newColor;
            button.textContent = newText;

            const dateKey = button.dataset.datekey;
            const stu = button.dataset.student;
            const asg = button.dataset.assignment;
            if (dateKey && asg && stu) {
                updateChecklistLocalStorage(dateKey, asg, stu, newColor);
            }
            const checklistDateElem = document.getElementById('checklistDate');
            if (checklistDateElem && checklistDateElem.dataset.dateKey) {
                saveChecklistData();
            }
            updateStatusLists();

            // 如果座位表開啟中，同步更新座位表的作業狀態顯示
            const seatingChartOverlay = document.getElementById('seatingChartOverlay');
            if (seatingChartOverlay && seatingChartOverlay.style.display === 'flex') {
                setTimeout(() => {
                    refreshAllSeatsScoreDisplay();
                }, 100);
            }
        }

        function toggleAssignmentStatus(assignment) {
            const buttons = document.querySelectorAll(`button[data-assignment="${assignment}"]`);
            buttons.forEach(button => {
                const stu = button.dataset.student;
                toggleButtonStatus(button, stu, assignment);
            });
        }

        function toggleStudentStatus(student) {
            const tables = document.querySelectorAll('#tablesContainer table');
            tables.forEach(table => {
                const tr = Array.from(table.querySelectorAll('tbody tr')).find(tr => tr.querySelector('.student-name') && tr.querySelector('.student-name').textContent.trim() === student);
                if (tr) {
                    Array.from(tr.querySelectorAll('.status-button')).forEach(button => {
                        const asg = button.dataset.assignment;
                        toggleButtonStatus(button, student, asg);
                    });
                }
            });
        }

        function updateStatusLists() {
            const notSubmittedLists = {};
            const correctionLists = {};
            const correctedLists = {};

            document.querySelectorAll('.status-table th').forEach(th => {
                const col = th.textContent.trim();
                notSubmittedLists[col] = document.getElementById(`not-submitted-${col}`);
                correctionLists[col] = document.getElementById(`correction-${col}`);
                correctedLists[col] = document.getElementById(`corrected-${col}`);
                if (notSubmittedLists[col]) notSubmittedLists[col].innerHTML = '';
                if (correctionLists[col]) correctionLists[col].innerHTML = '';
                if (correctedLists[col]) correctedLists[col].innerHTML = '';
            });

            const buttons = document.querySelectorAll('.status-button');
            buttons.forEach(button => {
                const tr = button.closest('tr');
                const td = button.closest('td');
                const table = button.closest('table');
                if (!tr || !td || !table) return;

                const studentNameElem = tr.querySelector('.student-name');
                if (!studentNameElem) return;
                const student = studentNameElem.textContent;

                const index = Array.from(tr.children).indexOf(td) + 1;
                const th = table.querySelector('thead th:nth-child(' + index + ')');
                if (!th) return;

                const assignment = th.textContent.trim();

                if (button.style.backgroundColor === 'red' && notSubmittedLists[assignment]) {
                    notSubmittedLists[assignment].innerHTML += `${notSubmittedLists[assignment].innerHTML ? ', ' : ''}${student}`;
                } else if (button.style.backgroundColor === 'orange' && correctionLists[assignment]) {
                    correctionLists[assignment].innerHTML += `${correctionLists[assignment].innerHTML ? ', ' : ''}${student}`;
                } else if (button.style.backgroundColor === 'blue' && correctedLists[assignment]) {
                    correctedLists[assignment].innerHTML += `${correctedLists[assignment].innerHTML ? ', ' : ''}${student}`;
                }
            });
        }

        function saveChecklistData() {
            const checklistDateElem = document.getElementById('checklistDate');
            if (!checklistDateElem || !checklistDateElem.dataset.dateKey) {
                return;
            }
            const dateKey = checklistDateElem.dataset.dateKey;
            const statusData = {};
            const buttons = document.querySelectorAll('.status-button');
            buttons.forEach(button => {
                const tr = button.closest('tr');
                const td = button.closest('td');
                const table = button.closest('table');
                if (!tr || !td || !table) return;

                const studentNameElem = tr.querySelector('.student-name');
                if (!studentNameElem) return;
                const student = studentNameElem.textContent;

                const index = Array.from(tr.children).indexOf(td) + 1;
                const th = table.querySelector('thead th:nth-child(' + index + ')');
                if (!th) return;

                const assignment = th.textContent.trim();
                if (!statusData[assignment]) statusData[assignment] = {};
                statusData[assignment][student] = button.style.backgroundColor;
            });
            localStorage.setItem(`${getClassPrefix()}checklist_${dateKey}`, JSON.stringify(statusData));
        }

        function saveAndBack() {
            saveChecklistData();
            goBack();
        }
