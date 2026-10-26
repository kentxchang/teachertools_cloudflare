// ===== 抽籤系統 =====
        // 抽籤系統
        let lotteryState = {
            drawnStudents: [],
            allStudents: [],
            currentDrawnStudent: null
        };

        function showLottery() {
            const studentNames = getStudentNames();

            if (studentNames.length === 0) {
                alert('請先輸入學生姓名！');
                return;
            }

            // 載入抽籤狀態
            loadLotteryState();

            // 更新學生列表
            lotteryState.allStudents = studentNames;

            document.getElementById('lotteryOverlay').style.display = 'block';
            document.getElementById('lotteryPanel').style.display = 'block';

            updateLotteryGrid();
        }

        function hideLottery() {
            document.getElementById('lotteryOverlay').style.display = 'none';
            document.getElementById('lotteryPanel').style.display = 'none';
        }

        function updateLotteryGrid() {
            const grid = document.getElementById('lotteryStudentGrid');
            grid.innerHTML = '';

            lotteryState.allStudents.forEach(student => {
                const studentDiv = document.createElement('div');
                studentDiv.className = 'lottery-student';
                studentDiv.textContent = student;

                if (student === lotteryState.currentDrawnStudent) {
                    // 當次抽中的學生用紅色顯示
                    studentDiv.classList.add('current-drawn');
                } else if (lotteryState.drawnStudents.includes(student)) {
                    // 之前抽中的學生用灰色顯示
                    studentDiv.classList.add('drawn');
                }

                grid.appendChild(studentDiv);
            });

            // 更新抽籤按鈕狀態
            const remainingStudents = lotteryState.allStudents.filter(s => !lotteryState.drawnStudents.includes(s));
            document.getElementById('drawButton').disabled = remainingStudents.length === 0;
        }

        let isDrawing = false;

        function drawStudent() {
            if (isDrawing) return;
            const remainingStudents = lotteryState.allStudents.filter(s => !lotteryState.drawnStudents.includes(s));

            if (remainingStudents.length === 0) {
                alert('所有學生都已經被抽過了！');
                return;
            }

            // 隨機抽選
            const randomIndex = Math.floor(Math.random() * remainingStudents.length);
            const selectedStudent = remainingStudents[randomIndex];

            // 輪盤動畫：亮框在剩餘學生間跳動、逐漸變慢，最後停在抽中的學生
            isDrawing = true;
            document.getElementById('drawButton').disabled = true;
            const cells = document.getElementById('lotteryStudentGrid').children;
            const cellOf = name => cells[lotteryState.allStudents.indexOf(name)];
            const totalSteps = 20;
            let step = 0;
            let delay = 60;
            let lastCell = null;

            function hop() {
                if (lastCell) lastCell.classList.remove('rolling');
                let cell = cellOf(selectedStudent);
                if (step < totalSteps && remainingStudents.length > 1) {
                    do {
                        cell = cellOf(remainingStudents[Math.floor(Math.random() * remainingStudents.length)]);
                    } while (cell === lastCell);
                }
                cell.classList.add('rolling');
                lastCell = cell;
                playTone(600 + step * 25, 0.05, { type: 'square', volume: 0.1 });

                if (step >= totalSteps || remainingStudents.length === 1) {
                    setTimeout(() => {
                        cell.classList.remove('rolling');
                        isDrawing = false;
                        finishDraw(selectedStudent);
                    }, 500);
                    return;
                }
                step++;
                delay *= 1.09;
                setTimeout(hop, delay);
            }
            hop();
        }

        function finishDraw(selectedStudent) {
            // 設定當次抽中的學生
            lotteryState.currentDrawnStudent = selectedStudent;

            // 加入已抽選列表
            lotteryState.drawnStudents.push(selectedStudent);

            // 儲存狀態
            saveLotteryState();

            // 更新顯示
            updateLotteryGrid();

            // 全螢幕顯示抽中學生
            playWinnerSound();
            showWinner(selectedStudent);
        }

        function playWinnerSound() {
            // 抽中：快速上行琶音，再以和弦收尾
            [523, 659, 784, 1047].forEach((freq, index) => {
                playTone(freq, 0.15, { type: 'triangle', delay: index * 0.08 });
            });
            [523, 659, 784, 1047].forEach(freq => {
                playTone(freq, 0.9, { type: 'triangle', volume: 0.12, delay: 0.35 });
            });
        }

        function showWinner(studentName) {
            document.getElementById('winnerName').textContent = studentName;
            const winnerDisplay = document.getElementById('winnerDisplay');
            winnerDisplay.style.display = 'flex';

            // 彩帶動畫
            winnerDisplay.querySelectorAll('.confetti').forEach(el => el.remove());
            const colors = ['#FFEB3B', '#FF5722', '#E91E63', '#2196F3', '#4CAF50', '#FFFFFF'];
            for (let i = 0; i < 60; i++) {
                const piece = document.createElement('span');
                piece.className = 'confetti';
                piece.style.left = Math.random() * 100 + '%';
                piece.style.background = colors[i % colors.length];
                piece.style.animationDelay = Math.random() * 0.8 + 's';
                piece.style.animationDuration = 1.8 + Math.random() * 1.2 + 's';
                winnerDisplay.appendChild(piece);
            }

            // 3秒後自動關閉
            setTimeout(() => {
                document.getElementById('winnerDisplay').style.display = 'none';
            }, 3000);
        }

        function resetLottery() {
            if (confirm('確定要重新開始抽籤嗎？')) {
                lotteryState.drawnStudents = [];
                lotteryState.currentDrawnStudent = null;
                saveLotteryState();
                updateLotteryGrid();
            }
        }

        function loadLotteryState() {
            const saved = localStorage.getItem('lotteryState');
            if (saved) {
                lotteryState = JSON.parse(saved);
            }
        }

        function saveLotteryState() {
            localStorage.setItem('lotteryState', JSON.stringify(lotteryState));
        }
