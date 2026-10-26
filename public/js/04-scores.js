// ===== 加扣分表格、排行榜、圖表、重置、週/月統計 =====
        function updateScoreTables() {
            const studentScoreTable = document.getElementById('studentScoreTable');
            const groupScoreTable = document.getElementById('groupScoreTable');
            studentScoreTable.innerHTML = '';
            groupScoreTable.innerHTML = '';
            let currentStudentTable = createScoreTable();
            let currentGroupTable = createGroupScoreTable();
            studentScoreTable.appendChild(currentStudentTable);
            groupScoreTable.appendChild(currentGroupTable);
            students.forEach((name, index) => {
                if (index % 10 === 0 && index !== 0) {
                    currentStudentTable = createScoreTable();
                    studentScoreTable.appendChild(currentStudentTable);
                }
                addRowToTable(currentStudentTable, name, index);
            });
            Object.keys(groups).forEach((groupIndex, index) => {
                if (index % 5 === 0 && index !== 0) {
                    currentGroupTable = createGroupScoreTable();
                    groupScoreTable.appendChild(currentGroupTable);
                }
                addGroupRowToTable(currentGroupTable, groupIndex, index);
            });
            highlightTopScore();
        }

        function createScoreTable() {
            const table = document.createElement('table');
            table.className = 'scoreTable';
            const thead = table.createTHead();
            const row = thead.insertRow();
            const thName = document.createElement('th');
            const thAdd = document.createElement('th');
            const thScore = document.createElement('th');
            const thSubtract = document.createElement('th');
            thName.textContent = '姓名';
            thAdd.textContent = '加分';
            thScore.textContent = '得分';
            thSubtract.textContent = '扣分';
            row.appendChild(thName);
            row.appendChild(thAdd);
            row.appendChild(thScore);
            row.appendChild(thSubtract);
            table.createTBody();
            return table;
        }

        function createGroupScoreTable() {
            const table = document.createElement('table');
            table.className = 'scoreTable groupScoreTable';
            const thead = table.createTHead();
            const row = thead.insertRow();
            const thName = document.createElement('th');
            const thAdd = document.createElement('th');
            const thScore = document.createElement('th');
            const thSubtract = document.createElement('th');
            const thMembers = document.createElement('th');
            thName.textContent = '組別';
            thAdd.textContent = '加分';
            thScore.textContent = '得分';
            thSubtract.textContent = '扣分';
            thMembers.textContent = '組員';
            row.appendChild(thName);
            row.appendChild(thAdd);
            row.appendChild(thScore);
            row.appendChild(thSubtract);
            row.appendChild(thMembers);
            table.createTBody();
            return table;
        }

        function addRowToTable(table, name, index) {
            const tbody = table.getElementsByTagName('tbody')[0];
            const row = tbody.insertRow();
            const cellName = row.insertCell(0);
            const cellAdd = row.insertCell(1);
            const cellScore = row.insertCell(2);
            const cellSubtract = row.insertCell(3);

            cellName.textContent = name;
            cellAdd.innerHTML = `<button onclick="changeScore('${name}-${index}', 1)">+</button>`;
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            if (!scores[dateKey]) {
                scores[dateKey] = {};
            }
            cellScore.textContent = scores[dateKey][`${name}-${index}`] || 0;
            cellSubtract.innerHTML = `<button onclick="changeScore('${name}-${index}', -1)">-</button>`;
        }

        function addGroupRowToTable(table, groupIndex, index) {
            const tbody = table.getElementsByTagName('tbody')[0];
            const row = tbody.insertRow();
            const cellName = row.insertCell(0);
            const cellAdd = row.insertCell(1);
            const cellScore = row.insertCell(2);
            const cellSubtract = row.insertCell(3);
            const cellMembers = row.insertCell(4);

            cellName.textContent = `第${parseInt(groupIndex) + 1}組`;
            cellAdd.innerHTML = `<button onclick="changeGroupScore('${groupIndex}', 1, this)">+</button>`;
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            if (!scores[dateKey]) {
                scores[dateKey] = {};
            }
            cellScore.textContent = scores[dateKey][`group-${groupIndex}`] || 0;
            cellSubtract.innerHTML = `<button onclick="changeGroupScore('${groupIndex}', -1, this)">-</button>`;
            cellMembers.textContent = groups[groupIndex].join(', ');
        }

        function changeScore(key, delta) {
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            if (!scores[dateKey]) {
                scores[dateKey] = {};
            }
            scores[dateKey][key] = (scores[dateKey][key] || 0) + delta;
            setClassData('scores', scores);
            updateScoreTables();
            scoresChanged = true;
        }

        function changeGroupScore(groupIndex, delta, button) {
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            if (!scores[dateKey]) {
                scores[dateKey] = {};
            }
            groups[groupIndex].forEach(student => {
                const key = `${student}-${students.indexOf(student)}`;
                scores[dateKey][key] = (scores[dateKey][key] || 0) + delta;
            });
            scores[dateKey][`group-${groupIndex}`] = (scores[dateKey][`group-${groupIndex}`] || 0) + delta;
            setClassData('scores', scores);
            updateScoreTables();
            scoresChanged = true;
        }

        function highlightTopScore() {
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            if (!scores[dateKey]) return;
            const maxScore = Math.max(...Object.values(scores[dateKey]));
            const cells = document.querySelectorAll('.scoreTable td:nth-child(3)');
            cells.forEach(cell => {
                cell.classList.remove('highlight');
                if (parseInt(cell.textContent) === maxScore) {
                    cell.classList.add('highlight');
                }
            });
        }

        function renderChart() {
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            const ctx = document.getElementById('chart').getContext('2d');
            if (chart) {
                chart.destroy();
            }
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: students,
                    datasets: [{
                        label: '得分',
                        data: students.map((name, index) => scores[dateKey] ? (scores[dateKey][`${name}-${index}`] || 0) : 0),
                        backgroundColor: students.map((name, index) => scores[dateKey] && (scores[dateKey][`${name}-${index}`] === Math.max(...Object.values(scores[dateKey])) ? 'darkblue' : 'rgba(54, 162, 235, 0.7)')),
                        borderColor: students.map((name, index) => scores[dateKey] && (scores[dateKey][`${name}-${index}`] === Math.max(...Object.values(scores[dateKey])) ? 'darkblue' : 'rgba(54, 162, 235, 1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: students.length <= 6 ? 0 : 90,
                                minRotation: 0,
                                font: function (context) {
                                    const width = context.chart.width;
                                    const size = students.length <= 6 ? 14 : Math.round(width / students.length / 1.5);
                                    return {
                                        size: size > 8 ? size : 8,
                                    };
                                }
                            }
                        }
                    }
                }
            });
        }

        function confirmReset() {
            if (confirm(`確定要刪除班級「${currentClass}」嗎？這將永久刪除該班級的所有資料並從班級列表中移除。`)) {
                const classToDelete = currentClass;

                // 清除基本資料
                removeClassData('students');
                removeClassData('scores');
                removeClassData('homeworks');
                removeClassData('groups');
                removeClassData('redemptionHistory');
                removeClassData('attendanceRecords');
                removeClassData('seatingChartData2');

                // 清除作業清單資料
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(getClassPrefix() + 'checklist_')) {
                        localStorage.removeItem(key);
                    }
                });

                // 清除主題設定
                localStorage.removeItem(getClassPrefix() + 'selectedTheme');

                // 從班級列表中移除該班級
                classList = classList.filter(c => c !== classToDelete);
                localStorage.setItem(fileName + '_classList', JSON.stringify(classList));

                // 清除當前班級設定
                currentClass = null;
                localStorage.removeItem('currentClass');

                // 重設記憶體中的變數
                students = [];
                scores = {};
                homeworks = {};
                groups = {};
                redemptionHistory = {};
                attendanceRecords = {};

                document.getElementById('calendar').style.display = 'block';
                document.getElementById('inputSection').style.display = 'none';
                document.getElementById('checklistSection').style.display = 'none';
                document.getElementById('studentNamesInput').style.display = 'none';
                document.getElementById('header').style.display = 'flex';

                alert(`班級「${classToDelete}」已被刪除`);

                // 返回班級選擇介面
                showClassSelection();
            }
        }

        function showWeeklySummary(startDay, endDay) {
            const summaryData = {};
            for (let i = startDay; i <= endDay; i++) {
                const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${i}`;
                if (scores[dateKey]) {
                    Object.keys(scores[dateKey]).forEach(key => {
                        summaryData[key] = (summaryData[key] || 0) + scores[dateKey][key];
                    });
                }
            }

            document.getElementById('weeklySummaryOverlay').style.display = 'flex';
            document.getElementById('weeklySummaryText').textContent = '每週統計';

            const weeklyScoreSection = document.getElementById('weeklyScoreSection');
            weeklyScoreSection.innerHTML = '';
            let currentTable = createWeeklySummaryTable();
            weeklyScoreSection.appendChild(currentTable);
            const sortedScores = Object.entries(summaryData).sort(([, a], [, b]) => b - a);
            const topScores = sortedScores.slice(0, 3);
            students.forEach((name, index) => {
                if (index % 7 === 0 && index !== 0) {
                    currentTable = createWeeklySummaryTable();
                    weeklyScoreSection.appendChild(currentTable);
                }
                addSummaryRowToTable(currentTable, name, index, summaryData, topScores);
            });
            renderSummaryChart(summaryData, 'weeklyChart');
        }

        function showMonthlySummary() {
            const summaryData = {};
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= lastDay; i++) {
                const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${i}`;
                if (scores[dateKey]) {
                    Object.keys(scores[dateKey]).forEach(key => {
                        summaryData[key] = (summaryData[key] || 0) + scores[dateKey][key];
                    });
                }
            }

            document.getElementById('monthlySummaryOverlay').style.display = 'flex';
            document.getElementById('monthlySummaryText').textContent = '每月統計';

            const monthlyScoreSection = document.getElementById('monthlyScoreSection');
            monthlyScoreSection.innerHTML = '';
            let currentTable = createWeeklySummaryTable();
            monthlyScoreSection.appendChild(currentTable);
            const sortedScores = Object.entries(summaryData).sort(([, a], [, b]) => b - a);
            const topScores = sortedScores.slice(0, 3);
            students.forEach((name, index) => {
                if (index % 7 === 0 && index !== 0) {
                    currentTable = createWeeklySummaryTable();
                    monthlyScoreSection.appendChild(currentTable);
                }
                addSummaryRowToTable(currentTable, name, index, summaryData, topScores);
            });
            renderSummaryChart(summaryData, 'monthlyChart');
        }

        function createWeeklySummaryTable() {
            const table = document.createElement('table');
            table.className = 'scoreTable';
            const thead = table.createTHead();
            const row = thead.insertRow();
            const thName = document.createElement('th');
            const thScore = document.createElement('th');
            thName.textContent = '姓名';
            thScore.textContent = '得分';
            row.appendChild(thName);
            row.appendChild(thScore);
            table.createTBody();
            return table;
        }

        function addSummaryRowToTable(table, name, index, summaryData, topScores) {
            const tbody = table.getElementsByTagName('tbody')[0];
            const row = tbody.insertRow();
            const cellName = row.insertCell(0);
            const cellScore = row.insertCell(1);
            const score = summaryData[`${name}-${index}`] || 0;

            const topScoreIndex = topScores.findIndex(([key, value]) => key === `${name}-${index}`);
            if (topScoreIndex !== -1) {
                cellName.innerHTML = `<span style="font-weight: bold; color: red;">${name} (${topScoreIndex + 1})</span>`;
                cellScore.innerHTML = `<span style="font-weight: bold; color: red;">${score}</span>`;
            } else {
                cellName.textContent = name;
                cellScore.textContent = score;
            }
        }

        function renderSummaryChart(summaryData, chartId) {
            const ctx = document.getElementById(chartId).getContext('2d');
            if (chartId === 'weeklyChart' && weeklyChart) {
                weeklyChart.destroy();
            } else if (chartId === 'monthlyChart' && monthlyChart) {
                monthlyChart.destroy();
            }

            const newChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: students,
                    datasets: [{
                        label: '得分',
                        data: students.map((name, index) => summaryData[`${name}-${index}`] || 0),
                        backgroundColor: students.map((name, index) => summaryData[`${name}-${index}`] === Math.max(...Object.values(summaryData)) ? 'darkblue' : 'rgba(54, 162, 235, 0.2)'),
                        borderColor: students.map((name, index) => summaryData[`${name}-${index}`] === Math.max(...Object.values(summaryData)) ? 'darkblue' : 'rgba(54, 162, 235, 1)'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: students.length <= 6 ? 0 : 90,
                                minRotation: 0,
                                font: function (context) {
                                    const width = context.chart.width;
                                    const size = students.length <= 6 ? 14 : Math.round(width / students.length / 1.5);
                                    return {
                                        size: size > 8 ? size : 8,
                                    };
                                }
                            }
                        }
                    }
                }
            });

            if (chartId === 'weeklyChart') {
                weeklyChart = newChart;
            } else if (chartId === 'monthlyChart') {
                monthlyChart = newChart;
            }
        }

        function hideWeeklySummary() {
            document.getElementById('weeklySummaryOverlay').style.display = 'none';
            document.getElementById('monthlySummaryOverlay').style.display = 'none';
        }
