// ===== 教室座位表生成器（生成、按組排列、拖曳、儲存／載入、預覽列印） =====
        let studentList2 = [];
        let seatingChartData2 = [];
        let draggedElement2 = null;

        // 計算學生總分的函數
        function calculateStudentTotalScore(studentName) {
            let totalScore = 0;
            const studentIndex = students.indexOf(studentName);
            if (studentIndex === -1) return 0;

            const studentKey = `${studentName}-${studentIndex}`;
            Object.keys(scores).forEach(dateKey => {
                if (scores[dateKey] && scores[dateKey][studentKey] !== undefined) {
                    totalScore += scores[dateKey][studentKey];
                }
            });
            return totalScore;
        }

        // 檢查學生是否有未完成的作業
        function hasIncompleteHomework(studentName) {
            let hasIncomplete = false;

            // 遍歷所有作業日期
            Object.keys(homeworks).forEach(dateKey => {
                if (homeworks[dateKey] && homeworks[dateKey].length > 0) {
                    const checklistData = JSON.parse(localStorage.getItem(`${getClassPrefix()}checklist_${dateKey}`)) || {};

                    // 檢查該日期的每項作業
                    homeworks[dateKey].forEach(assignment => {
                        const status = checklistData[assignment] && checklistData[assignment][studentName]
                            ? checklistData[assignment][studentName]
                            : 'red';

                        // 如果狀態是紅色(未繳交)或橙色(待訂正)，視為未完成
                        if (status === 'red' || status === 'orange') {
                            hasIncomplete = true;
                        }
                    });
                }
            });

            return hasIncomplete;
        }

        // 格式化座位顯示內容（姓名+分數+作業狀態）
        function formatSeatContent(studentName) {
            if (!studentName || studentName.trim() === '') {
                return '';
            }
            const totalScore = calculateStudentTotalScore(studentName);
            const hasIncomplete = hasIncompleteHomework(studentName);

            if (hasIncomplete) {
                return `${studentName}
(${totalScore}) ❌`;
            } else {
                return `${studentName}
(${totalScore})`;
            }
        }

        // 檢查點擊是否在❌圖示區域
        function isClickOnHomeworkIcon(event, seatElement) {
            const seatRect = seatElement.getBoundingClientRect();
            const seatText = seatElement.textContent;

            // 如果沒有❌圖示，返回false
            if (!seatText.includes('❌')) {
                return false;
            }

            // 計算❌圖示的區域（在座位格子的右半部分）
            const clickX = event.clientX;
            const clickY = event.clientY;

            // 簡化檢測：如果點擊在座位格子的右半部分且下半部分，視為點擊❌圖示
            const isRightHalf = clickX > (seatRect.left + seatRect.right) / 2;
            const isBottomHalf = clickY > (seatRect.top + seatRect.bottom) / 2;

            return isRightHalf && isBottomHalf;
        }

        // 打開作業追蹤並查詢指定學生
        function openHomeworkTrackingForStudent(studentName) {
            // 關閉座位表
            hideSeatingChart();

            // 開啟作業追蹤
            showHomeworkTracking();

            // 延遲一下確保界面已載入
            setTimeout(() => {
                // 設定學生選擇器的值
                const studentSelect = document.getElementById('studentHomeworkSelect');
                if (studentSelect) {
                    studentSelect.value = studentName;

                    // 自動執行查詢
                    searchHomeworkByStudent();
                }
            }, 200);
        }

        // 刷新所有座位的分數顯示
        function refreshAllSeatsScoreDisplay() {
            const seats = document.querySelectorAll('.seat2, .student-seat2');
            seats.forEach(seat => {
                const studentName = extractStudentNameFromSeat(seat.textContent);
                if (studentName) {
                    seat.textContent = formatSeatContent(studentName);
                }
            });
        }

        document.getElementById('inputButton2').addEventListener('click', inputStudentList2);
        document.getElementById('generateButton2').addEventListener('click', generateSeatingChart2);
        document.getElementById('groupButton2').addEventListener('click', generateGroupedSeatingChart2);
        document.getElementById('saveButton2').addEventListener('click', saveSeatingChart2);
        document.getElementById('loadButton2').addEventListener('click', loadSeatingChart2);
        document.getElementById('previewButton2').addEventListener('click', previewSeatingChart2);
        document.getElementById('resetButton2').addEventListener('click', resetSeatingChart2);
        document.getElementById('groupingMethod2').addEventListener('change', toggleSettings2);

        function showSeatingChart() {
            document.getElementById('seatingChartOverlay').style.display = 'flex';

            // 確保使用當前班級的學生資料
            studentList2 = students.map(name => ({ name }));

            // 檢查是否有保存的座位表數據
            const savedData2 = localStorage.getItem(getClassPrefix() + 'seatingChartData2');
            if (savedData2) {
                const data2 = JSON.parse(savedData2);
                if (data2.seatingChartData && data2.seatingChartData.length > 0) {
                    // 驗證保存的座位表資料是否與當前學生名單匹配
                    const savedStudents = data2.seatingChartData.map(seat => seat.name).filter(name => name);
                    const currentStudents = students;

                    // 如果學生名單完全一致，才載入保存的座位表
                    if (arraysEqual(savedStudents.sort(), currentStudents.sort())) {
                        seatingChartData2 = data2.seatingChartData;
                        document.getElementById('groupingMethod2').value = data2.groupingMethod || '';
                        document.getElementById('columns2').value = data2.columns || 5;
                        document.getElementById('groups2').value = data2.groups || 9;
                        toggleSettings2();
                        renderSeatingChart2FromData();

                        // 延遲更新分數顯示，確保DOM元素已創建
                        setTimeout(() => {
                            refreshAllSeatsScoreDisplay();
                        }, 100);
                    } else {
                        // 學生名單不匹配，重新初始化座位表
                        initializeEmptySeatingChart();
                    }
                } else {
                    initializeEmptySeatingChart();
                }
            } else {
                initializeEmptySeatingChart();
            }
        }

        // 比較兩個陣列是否相等
        function arraysEqual(a, b) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }

        // 初始化空的座位表
        function initializeEmptySeatingChart() {
            seatingChartData2 = [];
            document.getElementById('groupingMethod2').value = '';
            document.getElementById('columns2').value = 5;
            document.getElementById('groups2').value = 9;
            const seatingChart = document.getElementById('seatingChart2');
            if (seatingChart) {
                seatingChart.innerHTML = '<div style="text-align: center; padding: 40px; font-size: 18px;">請先設定座位表參數並按下「生成座位表」按鈕</div>';
            }
        }

        function hideSeatingChart() {
            document.getElementById('seatingChartOverlay').style.display = 'none';
        }

        function inputStudentList2() {
            const input = prompt('輸入學生姓名，每行一個:');
            if (input) {
                studentList2 = input.split('\n').map(name => ({ name: name.trim() })).filter(student => student.name);
                const method = document.getElementById('groupingMethod2').value;
                if (method === 'byColumn') {
                    generateSeatingChart2();
                } else {
                    generateGroupedSeatingChart2();
                }
            }
        }

        function toggleSettings2() {
            const method = document.getElementById('groupingMethod2').value;
            if (method === 'byColumn') {
                document.getElementById('settingsSection2').style.display = 'inline-block';
                document.getElementById('groupSettingsSection2').style.display = 'none';
            } else if (method === 'byGroup') {
                document.getElementById('settingsSection2').style.display = 'none';
                document.getElementById('groupSettingsSection2').style.display = 'inline-block';
            } else {
                document.getElementById('settingsSection2').style.display = 'none';
                document.getElementById('groupSettingsSection2').style.display = 'none';
            }
        }

        function generateSeatingChart2() {
            const columns = parseInt(document.getElementById('columns2').value);
            const seatingChart2 = document.getElementById('seatingChart2');
            seatingChart2.innerHTML = '';

            const blackboard2 = document.createElement('div');
            blackboard2.className = 'blackboard2';
            blackboard2.textContent = '黑板';
            blackboard2.style.gridColumn = `span ${columns}`;
            seatingChart2.appendChild(blackboard2);

            seatingChart2.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

            seatingChartData2 = [];
            shuffleArray(studentList2);

            const totalSeats = Math.ceil(studentList2.length / columns) * columns;
            for (let i = 0; i < totalSeats; i++) {
                const seat2 = document.createElement('div');
                seat2.className = 'seat2';
                if (i < studentList2.length) {
                    seat2.textContent = formatSeatContent(studentList2[i].name);
                }
                seat2.draggable = true;
                seat2.addEventListener('dragstart', handleDragStart2);
                seat2.addEventListener('dragover', handleDragOver2);
                seat2.addEventListener('drop', handleDrop2);
                seat2.addEventListener('dragend', handleDragEnd2);
                seat2.addEventListener('click', handleSeatClick);
                seatingChart2.appendChild(seat2);
                seatingChartData2.push({ index: i + 1, name: i < studentList2.length ? studentList2[i].name : '' });
            }

            // 自動保存座位表數據
            saveSeatingChartToLocalStorage2();
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function generateGroupedSeatingChart2() {
            const groupsNum = parseInt(document.getElementById('groups2').value);
            const totalGroups = 9;
            const columns = 3;

            const groupSizes = calculateGroupSizes2(studentList2.length, groupsNum);
            const groupedStudents = assignStudentsToGroups2(studentList2, groupSizes);

            const seatingChart2 = document.getElementById('seatingChart2');
            seatingChart2.innerHTML = '';
            seatingChart2.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

            const blackboard2 = document.createElement('div');
            blackboard2.className = 'blackboard2';
            blackboard2.textContent = '黑板';
            blackboard2.style.gridColumn = `span ${columns}`;
            seatingChart2.appendChild(blackboard2);

            for (let i = 0; i < totalGroups; i++) {
                const groupContainer2 = document.createElement('div');
                groupContainer2.className = `group2 group-${i}`;
                groupContainer2.style.gridColumn = `span 1`;
                groupContainer2.draggable = true;
                groupContainer2.addEventListener('dragstart', handleDragStart2);
                groupContainer2.addEventListener('dragover', handleDragOver2);
                groupContainer2.addEventListener('drop', handleDropGroup2);
                groupContainer2.addEventListener('dragend', handleDragEnd2);
                seatingChart2.appendChild(groupContainer2);

                if (i < groupedStudents.length) {
                    groupedStudents[i].forEach(student => {
                        const seat2 = document.createElement('div');
                        seat2.className = 'student-seat2';
                        seat2.textContent = formatSeatContent(student.name);
                        seat2.draggable = true;
                        seat2.addEventListener('dragstart', handleDragStart2);
                        seat2.addEventListener('dragover', handleDragOver2);
                        seat2.addEventListener('drop', handleDrop2);
                        seat2.addEventListener('dragend', handleDragEnd2);
                        seat2.addEventListener('click', handleSeatClick);
                        groupContainer2.appendChild(seat2);
                    });
                }

                const totalSpaces = 9;
                while (groupContainer2.children.length < totalSpaces) {
                    const emptySeat2 = document.createElement('div');
                    emptySeat2.className = 'student-seat2';
                    emptySeat2.draggable = true;
                    emptySeat2.addEventListener('dragstart', handleDragStart2);
                    emptySeat2.addEventListener('dragover', handleDragOver2);
                    emptySeat2.addEventListener('drop', handleDrop2);
                    emptySeat2.addEventListener('dragend', handleDragEnd2);
                    emptySeat2.addEventListener('click', handleSeatClick);
                    groupContainer2.appendChild(emptySeat2);
                }
            }
            updateSeatingChartData2();

            // 自動保存座位表數據 (按組分組)
            saveSeatingChartToLocalStorage2();
        }

        function calculateGroupSizes2(totalStudents, numberOfGroups) {
            const groupSizes = new Array(numberOfGroups).fill(Math.floor(totalStudents / numberOfGroups));
            for (let i = 0; i < totalStudents % numberOfGroups; i++) {
                groupSizes[i]++;
            }
            return groupSizes;
        }

        function assignStudentsToGroups2(studentList, groupSizes) {
            const shuffledStudents = [...studentList];
            shuffleArray(shuffledStudents);
            const groups = [];
            let studentIndex = 0;
            for (let size of groupSizes) {
                const group = shuffledStudents.slice(studentIndex, studentIndex + size);
                groups.push(group);
                studentIndex += size;
            }
            return groups;
        }

        function handleDragStart2(event) {
            draggedElement2 = event.target;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', event.target.textContent);
        }

        function handleDragOver2(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        }

        function handleDrop2(event) {
            event.preventDefault();

            // 檢查拖拽的元素類型
            const isDraggedGroup = draggedElement2.classList.contains('group2');
            const isTargetSeat = event.target.classList.contains('seat2') || event.target.classList.contains('student-seat2');

            // 如果拖拽的是組別容器，不允許放到單個座位上
            if (isDraggedGroup && isTargetSeat) {
                return; // 阻止這種操作
            }

            // 只處理單個座位之間的交換
            if (!isDraggedGroup && isTargetSeat) {
                // 提取學生姓名進行交換
                const draggedName = extractStudentNameFromSeat(draggedElement2.textContent);
                const targetName = extractStudentNameFromSeat(event.target.textContent);

                // 重新格式化並顯示
                draggedElement2.textContent = formatSeatContent(targetName);
                event.target.textContent = formatSeatContent(draggedName);

                updateSeatingChartData2();
            }
        }

        function handleDropGroup2(event) {
            event.preventDefault();

            // 檢查拖拽的元素是否為組別容器
            const isDraggedGroup = draggedElement2.classList.contains('group2');
            const isTargetGroup = event.target.classList.contains('group2');

            // 只允許組別容器之間的交換
            if (isDraggedGroup && isTargetGroup) {
                const draggedHTML2 = draggedElement2.innerHTML;
                const targetHTML2 = event.target.innerHTML;

                draggedElement2.innerHTML = targetHTML2;
                event.target.innerHTML = draggedHTML2;

                reattachEventListeners2(draggedElement2);
                reattachEventListeners2(event.target);

                // 重新更新分數顯示
                refreshAllSeatsScoreDisplay();
                updateSeatingChartData2();
            }
        }

        function handleDragEnd2() {
            draggedElement2 = null;
        }

        // 處理座位點擊事件
        function handleSeatClick(event) {
            event.stopPropagation();

            const seatElement = event.currentTarget;
            const studentName = extractStudentNameFromSeat(seatElement.textContent);

            // 檢查是否點擊在❌圖示區域
            if (studentName && hasIncompleteHomework(studentName) && isClickOnHomeworkIcon(event, seatElement)) {
                // 點擊❌圖示，打開作業追蹤
                openHomeworkTrackingForStudent(studentName);
            }
            // 如果不是點擊❌圖示，不做任何處理（保持拖拽功能）
        }

        function reattachEventListeners2(groupContainer) {
            Array.from(groupContainer.children).forEach(seat => {
                seat.draggable = true;
                seat.addEventListener('dragstart', handleDragStart2);
                seat.addEventListener('dragover', handleDragOver2);
                seat.addEventListener('drop', handleDrop2);
                seat.addEventListener('dragend', handleDragEnd2);
                seat.addEventListener('click', handleSeatClick);
            });
            groupContainer.draggable = true;
            groupContainer.addEventListener('dragstart', handleDragStart2);
            groupContainer.addEventListener('dragover', handleDragOver2);
            groupContainer.addEventListener('drop', handleDropGroup2);
            groupContainer.addEventListener('dragend', handleDragEnd2);
        }

        // 從座位內容提取學生姓名
        function extractStudentNameFromSeat(seatText) {
            if (!seatText || seatText.trim() === '') {
                return '';
            }
            // 如果包含換行符，取第一行作為姓名
            return seatText.split('\n')[0].trim();
        }

        function updateSeatingChartData2() {
            const seats2 = document.querySelectorAll('.seat2, .student-seat2');
            seatingChartData2 = Array.from(seats2).map((seat2, index) => ({
                index: index + 1,
                name: extractStudentNameFromSeat(seat2.textContent)
            }));

            // 自動保存座位表數據 (拖拽後)
            saveSeatingChartToLocalStorage2();
        }

        function renderSeatingChart2() {
            // 可根據需要擴充
        }

        function saveSeatingChart2() {
            const data2 = {
                seatingChartData: seatingChartData2,
                groupingMethod: document.getElementById('groupingMethod2').value
            };
            const dataStr2 = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data2));
            const downloadAnchorNode2 = document.createElement('a');
            downloadAnchorNode2.setAttribute("href", dataStr2);
            downloadAnchorNode2.setAttribute("download", "seating_chart.json");
            document.body.appendChild(downloadAnchorNode2);
            downloadAnchorNode2.click();
            downloadAnchorNode2.remove();
        }

        function loadSeatingChart2() {
            const input2 = document.createElement('input');
            input2.type = 'file';
            input2.accept = '.json';
            input2.addEventListener('change', event => {
                const file2 = event.target.files[0];
                const reader2 = new FileReader();
                reader2.onload = function (e) {
                    const data2 = JSON.parse(e.target.result);
                    seatingChartData2 = data2.seatingChartData;
                    document.getElementById('groupingMethod2').value = data2.groupingMethod;
                    toggleSettings2();
                    renderSeatingChart2FromData();
                };
                reader2.readAsText(file2);
            });
            input2.click();
        }

        function renderSeatingChart2FromData() {
            if (!seatingChartData2 || seatingChartData2.length === 0) {
                return;
            }

            const seatingChart2 = document.getElementById('seatingChart2');
            seatingChart2.innerHTML = '';

            const groupingMethod = document.getElementById('groupingMethod2').value;

            if (groupingMethod === 'byGroup') {
                // 按組分組的顯示方式
                const totalGroups = 9;
                const columns = 3;
                seatingChart2.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

                const blackboard2 = document.createElement('div');
                blackboard2.className = 'blackboard2';
                blackboard2.textContent = '黑板';
                blackboard2.style.gridColumn = `span ${columns}`;
                seatingChart2.appendChild(blackboard2);

                // 重建9個分組容器
                for (let i = 0; i < totalGroups; i++) {
                    const groupContainer2 = document.createElement('div');
                    groupContainer2.className = `group2 group-${i}`;
                    groupContainer2.style.gridColumn = `span 1`;
                    groupContainer2.draggable = true;
                    groupContainer2.addEventListener('dragstart', handleDragStart2);
                    groupContainer2.addEventListener('dragover', handleDragOver2);
                    groupContainer2.addEventListener('drop', handleDropGroup2);
                    groupContainer2.addEventListener('dragend', handleDragEnd2);
                    seatingChart2.appendChild(groupContainer2);

                    // 在每個分組中創建9個空座位
                    const totalSpaces = 9;
                    for (let j = 0; j < totalSpaces; j++) {
                        const seat2 = document.createElement('div');
                        seat2.className = 'student-seat2';
                        seat2.draggable = true;
                        seat2.addEventListener('dragstart', handleDragStart2);
                        seat2.addEventListener('dragover', handleDragOver2);
                        seat2.addEventListener('drop', handleDrop2);
                        seat2.addEventListener('dragend', handleDragEnd2);
                        seat2.addEventListener('click', handleSeatClick);
                        groupContainer2.appendChild(seat2);
                    }
                }

                // 根據保存的數據填入學生姓名和分數
                const allSeats = document.querySelectorAll('.student-seat2');
                seatingChartData2.forEach((seatData, index) => {
                    if (allSeats[index]) {
                        allSeats[index].textContent = formatSeatContent(seatData.name);
                    }
                });
            } else {
                // 按列分組的顯示方式
                const columns = parseInt(document.getElementById('columns2').value) || 5;
                seatingChart2.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

                const blackboard2 = document.createElement('div');
                blackboard2.className = 'blackboard2';
                blackboard2.textContent = '黑板';
                blackboard2.style.gridColumn = `span ${columns}`;
                seatingChart2.appendChild(blackboard2);

                seatingChartData2.forEach(seatData => {
                    const seat2 = document.createElement('div');
                    seat2.className = 'seat2';
                    seat2.textContent = formatSeatContent(seatData.name);
                    seat2.draggable = true;
                    seat2.addEventListener('dragstart', handleDragStart2);
                    seat2.addEventListener('dragover', handleDragOver2);
                    seat2.addEventListener('drop', handleDrop2);
                    seat2.addEventListener('dragend', handleDragEnd2);
                    seat2.addEventListener('click', handleSeatClick);
                    seatingChart2.appendChild(seat2);
                });
            }
        }

        function previewSeatingChart2() {
            const className2 = prompt('請輸入班級名稱:');
            if (className2) {
                const previewWindow2 = window.open('', '_blank');
                previewWindow2.document.write(`
                    <html>
                    <head>
                        <title>${className2} 座位表</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f9;
                                margin: 0;
                                padding: 20px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                            }
                            h1 {
                                color: #333;
                            }
                            .seatingChart {
                                display: grid;
                                gap: 10px;
                                justify-content: center;
                                margin-top: 20px;
                                width: 1200px;
                            }
                            .student-seat2, .seat2 {
                                background-color: #f1f1f1;
                                border: 1px solid #ddd;
                                padding: 10px;
                                border-radius: 4px;
                                text-align: center;
                                min-height: 30px;
                            }
                            .blackboard2 {
                                text-align: center;
                                background-color: #333;
                                color: white;
                                padding: 10px;
                                border-radius: 4px;
                            }
                            .group2 {
                                border: 2px solid #4CAF50;
                                border-radius: 4px;
                                padding: 10px;
                                margin: 10px;
                                display: grid;
                                gap: 10px;
                                grid-template-columns: repeat(3, 1fr);
                                min-height: 150px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${className2} 座位表</h1>
                        <div class="seatingChart">${document.getElementById('seatingChart2').innerHTML}</div>
                    </body>
                    </html>
                `);
                previewWindow2.document.close();
            }
        }

        function resetSeatingChart2() {
            seatingChartData2 = [];
            studentList2 = [];
            document.getElementById('groupingMethod2').value = '';
            document.getElementById('columns2').value = 5;
            document.getElementById('groups2').value = 9;
            toggleSettings2();
            document.getElementById('seatingChart2').innerHTML = '';
        }

        function saveSeatingChartToLocalStorage2() {
            const data2 = {
                seatingChartData: seatingChartData2,
                groupingMethod: document.getElementById('groupingMethod2').value,
                columns: document.getElementById('columns2').value,
                groups: document.getElementById('groups2').value
            };
            setClassData('seatingChartData2', data2);
        }

        function loadSeatingChartFromLocalStorage2() {
            const savedData2 = localStorage.getItem(getClassPrefix() + 'seatingChartData2');
            if (savedData2) {
                const data2 = JSON.parse(savedData2);
                seatingChartData2 = data2.seatingChartData || [];
                document.getElementById('groupingMethod2').value = data2.groupingMethod || '';
                document.getElementById('columns2').value = data2.columns || 5;
                document.getElementById('groups2').value = data2.groups || 9;
                toggleSettings2();
            }
        }

        window.addEventListener('load', loadSeatingChartFromLocalStorage2);
        window.addEventListener('beforeunload', saveSeatingChartToLocalStorage2);
