// ===== 計時器 =====
        // 計時器系統
        let timerInterval = null;
        let timerSeconds = 0;
        let isTimerRunning = false;
        let isTimerPaused = false;

        function showTimer() {
            document.getElementById('timerOverlay').style.display = 'block';
            document.getElementById('timerPanel').style.display = 'block';
        }

        function hideTimer() {
            document.getElementById('timerOverlay').style.display = 'none';
            document.getElementById('timerPanel').style.display = 'none';
        }

        function setTimer(seconds) {
            timerSeconds = seconds;
            document.getElementById('startTimerButton').disabled = false;

            // 高亮選中的預設時間按鈕
            document.querySelectorAll('.timer-presets button').forEach(btn => {
                btn.style.background = '#9C27B0';
            });

            event.target.style.background = '#4CAF50';
        }

        function setCustomTimer() {
            const minutes = parseInt(document.getElementById('customMinutes').value) || 0;
            const seconds = parseInt(document.getElementById('customSeconds').value) || 0;

            if (minutes === 0 && seconds === 0) {
                alert('請設定時間！');
                return;
            }

            timerSeconds = minutes * 60 + seconds;
            document.getElementById('startTimerButton').disabled = false;

            // 重置預設按鈕
            document.querySelectorAll('.timer-presets button').forEach(btn => {
                btn.style.background = '#9C27B0';
            });
        }

        function startTimer() {
            if (timerSeconds <= 0) return;

            isTimerRunning = true;

            // 隱藏設定面板，顯示倒數
            hideTimer();
            document.getElementById('timerDisplay').style.display = 'flex';

            // 開始倒數
            updateTimerDisplay();
            timerInterval = setInterval(timerTick, 1000);
        }

        // 每秒執行一次：先扣一秒再顯示，讓音效和畫面上的數字同步
        function timerTick() {
            timerSeconds--;

            // 時間到了
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerFinished();
                return;
            }

            updateTimerDisplay();

            // 最後10秒加上緊張效果
            if (timerSeconds <= 10) {
                document.getElementById('timerDisplay').classList.add('tension');
                playTensionSound(timerSeconds);
            }
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('timerTime').textContent = timeString;
        }

        function stopTimer() {
            clearInterval(timerInterval);
            isTimerRunning = false;
            isTimerPaused = false;
            document.getElementById('timerDisplay').style.display = 'none';
            document.getElementById('timerDisplay').classList.remove('tension');

            // 重置按鈕顯示狀態
            document.getElementById('pauseTimerButton').style.display = 'inline-block';
            document.getElementById('resumeTimerButton').style.display = 'none';
        }

        function pauseTimer() {
            if (isTimerRunning && !isTimerPaused) {
                clearInterval(timerInterval);
                isTimerPaused = true;

                // 切換按鈕顯示
                document.getElementById('pauseTimerButton').style.display = 'none';
                document.getElementById('resumeTimerButton').style.display = 'inline-block';
            }
        }

        function resumeTimer() {
            if (isTimerRunning && isTimerPaused) {
                isTimerPaused = false;

                // 重新開始計時器
                timerInterval = setInterval(timerTick, 1000);

                // 切換按鈕顯示
                document.getElementById('pauseTimerButton').style.display = 'inline-block';
                document.getElementById('resumeTimerButton').style.display = 'none';
            }
        }

        function timerFinished() {
            isTimerRunning = false;
            isTimerPaused = false;
            const timerTimeElement = document.getElementById('timerTime');
            timerTimeElement.textContent = '時間到！';
            timerTimeElement.classList.add('finished');
            document.getElementById('timerDisplay').classList.remove('tension');

            // 重置按鈕顯示狀態
            document.getElementById('pauseTimerButton').style.display = 'inline-block';
            document.getElementById('resumeTimerButton').style.display = 'none';

            // 播放結束音效
            playFinishSound();

            // 5秒後自動關閉
            setTimeout(() => {
                document.getElementById('timerDisplay').style.display = 'none';
                // 移除finished樣式，為下次使用做準備
                timerTimeElement.classList.remove('finished');
            }, 5000);
        }

        // 倒數音效：10～4 秒短促的滴答聲，最後 3 秒改為較高、較長的嗶聲
        function playTensionSound(secondsLeft) {
            if (secondsLeft > 3) {
                playTone(880, 0.08, { type: 'square', volume: 0.15 });
            } else {
                playTone(1320, 0.25, { type: 'square', volume: 0.25 });
            }
        }

        function playFinishSound() {
            // 時間到：上行三和弦，再以長音收尾
            [523, 659, 784].forEach((freq, index) => {
                playTone(freq, 0.3, { delay: index * 0.2 });
            });
            playTone(1047, 0.8, { delay: 0.6 });
        }
