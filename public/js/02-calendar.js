// ===== 月曆、每日加扣分畫面切換、座位表檢視（含座位上加扣分） =====
        function renderCalendar() {
            const calendarDays = document.getElementById('calendarDays');
            calendarDays.innerHTML = `
                <div class="calendarHeaderDay">日</div>
                <div class="calendarHeaderDay">一</div>
                <div class="calendarHeaderDay">二</div>
                <div class="calendarHeaderDay">三</div>
                <div class="calendarHeaderDay">四</div>
                <div class="calendarHeaderDay">五</div>
                <div class="calendarHeaderDay">六</div>
                <div class="calendarHeaderDay">統計</div>
            `;
            const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const firstDayIndex = firstDayOfMonth.getDay();
            const lastDayIndex = lastDayOfMonth.getDay();
            const prevLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
            const lastDay = lastDayOfMonth.getDate();
            const today = new Date();
            let weekDayCount = 0;

            document.getElementById('calendarMonth').textContent = currentMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });

            for (let i = firstDayIndex; i > 0; i--) {
                const day = document.createElement('div');
                day.classList.add('calendarDay');
                day.classList.add('prevMonthDay');
                day.textContent = prevLastDay - i + 1;
                calendarDays.appendChild(day);
                weekDayCount++;
            }

            for (let i = 1; i <= lastDay; i++) {
                const day = document.createElement('div');
                day.classList.add('calendarDay');
                const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${i}`;
                day.innerHTML = `<div onclick="showDailyScoreSection(${i})">${i}</div>
                                <div class="additionalText">
                                    <button class="homeworkButton" onclick="showHomeworkOverlay(event, '${dateKey}')">作</button>
                                    <button class="hide" onclick="showViewHomeworkOverlay(event, '${dateKey}')">聯</button>
                                    <button class="hide" onclick="showChecklistSection('${dateKey}')">檢</button>
                                </div>`;
                if (today.getFullYear() === currentMonth.getFullYear() &&
                    today.getMonth() === currentMonth.getMonth() &&
                    today.getDate() === i) {
                    day.classList.add('today');
                }
                if (homeworks[dateKey]) {
                    day.querySelector(".homeworkButton").nextElementSibling.classList.remove('hide');
                    day.querySelector(".homeworkButton").nextElementSibling.nextElementSibling.classList.remove('hide');
                }
                if (scores[dateKey]) {
                    day.classList.add('hasData');
                }
                calendarDays.appendChild(day);
                weekDayCount++;
                if (weekDayCount === 7) {
                    const weekSummary = document.createElement('div');
                    weekSummary.classList.add('calendarDay');
                    weekSummary.innerHTML = `<button class="weekSummaryButton" onclick="showWeeklySummary(${i - 6}, ${i})">每週
統計</button>`;
                    calendarDays.appendChild(weekSummary);
                    weekDayCount = 0;
                }
            }

            for (let i = 1; i < 7 - lastDayIndex; i++) {
                const day = document.createElement('div');
                day.classList.add('calendarDay');
                day.classList.add('nextMonthDay');
                day.textContent = i;
                calendarDays.appendChild(day);
                weekDayCount++;
                if (weekDayCount === 7) {
                    const weekSummary = document.createElement('div');
                    weekSummary.classList.add('calendarDay');
                    weekSummary.innerHTML = `<button class="weekSummaryButton" onclick="showWeeklySummary(${lastDay + i - 6}, ${lastDay + i})">每週
統計</button>`;
                    calendarDays.appendChild(weekSummary);
                    weekDayCount = 0;
                }
            }

            if (Object.keys(scores).length > 0) {
                document.getElementById('groupButton').textContent = '已分組';
            }
        }

        function changeMonth(months) {
            currentMonth.setMonth(currentMonth.getMonth() + months);
            renderCalendar();
        }

        function showDailyScoreSection(day) {
            currentDay = day;
            scoresChanged = false;
            document.getElementById('selectedDate').textContent = `日期: ${currentMonth.getFullYear()}${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
            document.getElementById('calendar').style.display = 'none';
            document.getElementById('header').style.display = 'none';
            document.getElementById('inputSection').style.display = 'block';
            document.getElementById('controlSection').style.display = 'flex';
            hideSideMenuToggle();
            updateScoreTables();
            showScoreSection();
        }

        function showScoreSection() {
            document.getElementById('scoreSection').style.display = 'block';
            document.getElementById('chartSection').style.display = 'none';
            document.getElementById('seatingViewSection').style.display = 'none';
            document.getElementById('viewToggleSection').style.display = 'block';
            updateScoreTables(); // 確保切換回原始介面時分數表格是最新的

            // 更新按鈕狀態
            document.getElementById('tableViewBtn').style.background = '#32CD32';
            document.getElementById('seatingViewBtn').style.background = '#FF9800';
        }

        function showChartSection() {
            document.getElementById('scoreSection').style.display = 'none';
            document.getElementById('chartSection').style.display = 'block';
            document.getElementById('seatingViewSection').style.display = 'none';
            document.getElementById('viewToggleSection').style.display = 'none';
            renderChart();
        }

        function showSeatingViewSection() {
            document.getElementById('scoreSection').style.display = 'none';
            document.getElementById('chartSection').style.display = 'none';
            document.getElementById('seatingViewSection').style.display = 'flex';
            document.getElementById('viewToggleSection').style.display = 'block';
            renderSeatingView();

            // 更新按鈕狀態
            document.getElementById('tableViewBtn').style.background = '#E0E0E0';
            document.getElementById('seatingViewBtn').style.background = '#32CD32';
        }

        function renderSeatingView() {
            const seatingChart = document.getElementById('seatingScoreChart');
            seatingChart.innerHTML = '';

            // 檢查是否有保存的座位表數據
            const savedData = localStorage.getItem(getClassPrefix() + 'seatingChartData2');
            if (!savedData) {
                seatingChart.innerHTML = '<div style="text-align: center; padding: 40px; font-size: 18px;">請先在座位表功能中設定座位表</div>';
                return;
            }

            const seatingData = JSON.parse(savedData);
            if (!seatingData || !seatingData.seatingChartData || seatingData.seatingChartData.length === 0) {
                seatingChart.innerHTML = '<div style="text-align: center; padding: 40px; font-size: 18px;">請先在座位表功能中設定座位表</div>';
                return;
            }

            // 獲取排列方式和數據
            const groupingMethod = seatingData.groupingMethod || 'byColumn';
            const studentsData = seatingData.seatingChartData;

            // 添加黑板
            const blackboard = document.createElement('div');
            blackboard.className = 'seating-blackboard';
            blackboard.textContent = '黑板';
            seatingChart.appendChild(blackboard);

            if (groupingMethod === 'byGroup') {
                // 按組排列 - 外層3x3 grid（9個組）
                seatingChart.style.gridTemplateColumns = 'repeat(3, 1fr)';
                seatingChart.style.justifyContent = 'center';
                seatingChart.style.width = 'fit-content';
                seatingChart.style.margin = '0 auto';

                const totalGroups = 9; // 固定9個大組位置
                const seatsPerGroup = 9; // 每組9個座位

                // 創建9個組位（大方格），完全按照原始座位表的順序
                for (let group = 0; group < totalGroups; group++) {
                    const groupContainer = document.createElement('div');
                    groupContainer.style.display = 'grid';
                    groupContainer.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 每組內部3x3
                    groupContainer.style.gap = '3px';
                    groupContainer.style.border = '3px solid #333';
                    groupContainer.style.padding = '8px';
                    groupContainer.style.backgroundColor = '#f8f8f8';
                    groupContainer.style.minHeight = '200px';
                    groupContainer.style.position = 'relative';

                    // 添加組標籤
                    const groupLabel = document.createElement('div');
                    groupLabel.style.position = 'absolute';
                    groupLabel.style.top = '-15px';
                    groupLabel.style.left = '5px';
                    groupLabel.style.background = '#333';
                    groupLabel.style.color = '#fff';
                    groupLabel.style.padding = '2px 8px';
                    groupLabel.style.fontSize = '12px';
                    groupLabel.style.fontWeight = 'bold';
                    groupLabel.textContent = `第${group + 1}組`;
                    groupContainer.appendChild(groupLabel);

                    // 在每個組內創建3x3的座位（9個位置），按照原始座位表的順序
                    for (let seat = 0; seat < seatsPerGroup; seat++) {
                        const globalSeatIndex = group * seatsPerGroup + seat; // 計算在整個座位表中的索引位置

                        if (globalSeatIndex < studentsData.length && studentsData[globalSeatIndex] && studentsData[globalSeatIndex].name) {
                            // 有學生的座位 - 按照原始座位表的完全順序
                            const studentData = studentsData[globalSeatIndex];
                            const studentDiv = createSeatingStudent(studentData.name, studentData.index);
                            studentDiv.style.minHeight = '120px';
                            groupContainer.appendChild(studentDiv);
                        } else {
                            // 空座位 - 保持原始座位表的空位順序
                            const emptyDiv = document.createElement('div');
                            emptyDiv.className = 'seating-student empty';
                            emptyDiv.style.minHeight = '120px';
                            emptyDiv.style.backgroundColor = '#e8e8e8';
                            emptyDiv.style.borderColor = '#ccc';
                            emptyDiv.style.boxShadow = '1px 1px 0px #ccc';
                            groupContainer.appendChild(emptyDiv);
                        }
                    }

                    seatingChart.appendChild(groupContainer);
                }
            } else {
                // 按列排列 - 使用原始的列數設定
                const columns = seatingData.columns || 5;
                seatingChart.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
                seatingChart.style.justifyContent = 'center';
                seatingChart.style.width = 'fit-content';
                seatingChart.style.margin = '0 auto';

                studentsData.forEach(studentData => {
                    if (studentData.name) {
                        const studentDiv = createSeatingStudent(studentData.name, studentData.index);
                        seatingChart.appendChild(studentDiv);
                    } else {
                        const emptyDiv = document.createElement('div');
                        emptyDiv.className = 'seating-student empty';
                        seatingChart.appendChild(emptyDiv);
                    }
                });
            }
        }

        function createSeatingStudent(studentName, seatingIndex) {
            const studentDiv = document.createElement('div');
            studentDiv.className = 'seating-student';

            // 找到學生在 students 數組中的正確索引
            const studentArrayIndex = students.findIndex(name => name === studentName);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'seating-student-name';
            nameDiv.textContent = studentName;

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'seating-student-score';

            // 獲取當天分數 - 使用 students 數組中的索引
            const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
            const currentScore = scores[dateKey] && scores[dateKey][`${studentName}-${studentArrayIndex}`] ? scores[dateKey][`${studentName}-${studentArrayIndex}`] : 0;
            scoreDiv.textContent = `${currentScore}分`;

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'seating-score-buttons';

            const plusBtn = document.createElement('button');
            plusBtn.className = 'seating-score-btn';
            plusBtn.textContent = '+';
            plusBtn.onclick = () => {
                changeScore(`${studentName}-${studentArrayIndex}`, 1);
                // changeScore 函數已經包含 updateScoreTables()，這裡只需要更新座位表視圖的顯示
                setTimeout(() => renderSeatingView(), 0); // 使用 setTimeout 確保 DOM 更新後再渲染
            };

            const minusBtn = document.createElement('button');
            minusBtn.className = 'seating-score-btn minus';
            minusBtn.textContent = '-';
            minusBtn.onclick = () => {
                changeScore(`${studentName}-${studentArrayIndex}`, -1);
                // changeScore 函數已經包含 updateScoreTables()，這裡只需要更新座位表視圖的顯示
                setTimeout(() => renderSeatingView(), 0); // 使用 setTimeout 確保 DOM 更新後再渲染
            };

            buttonsDiv.appendChild(plusBtn);
            buttonsDiv.appendChild(minusBtn);

            studentDiv.appendChild(nameDiv);
            studentDiv.appendChild(scoreDiv);
            studentDiv.appendChild(buttonsDiv);

            return studentDiv;
        }

        function goBack() {
            if (scoresChanged) {
                const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
                const dayElement = [...document.getElementsByClassName('calendarDay')].find(day => day.innerHTML.includes(`showDailyScoreSection(${currentDay})`));
                if (dayElement) {
                    dayElement.classList.add('hasData');
                }
            }
            document.getElementById('inputSection').style.display = 'none';
            document.getElementById('checklistSection').style.display = 'none';
            document.getElementById('viewToggleSection').style.display = 'none';
            document.getElementById('calendar').style.display = 'block';
            document.getElementById('header').style.display = 'flex';
            showSideMenuToggle();
        }
