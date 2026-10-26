// ===== 音效（用 Web Audio 即時合成，不需要音效檔；抽籤、計時器共用） =====
        let sharedAudioContext = null;

        // 播放一個音：freq 頻率(Hz)、duration 長度(秒)、delay 延遲(秒)
        function playTone(freq, duration, { type = 'sine', volume = 0.3, delay = 0 } = {}) {
            // 共用同一個 AudioContext，避免每次都新建造成瀏覽器數量上限而沒有聲音
            if (!sharedAudioContext) {
                sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (sharedAudioContext.state === 'suspended') sharedAudioContext.resume();

            const startTime = sharedAudioContext.currentTime + delay;
            const oscillator = sharedAudioContext.createOscillator();
            const gainNode = sharedAudioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(sharedAudioContext.destination);

            oscillator.type = type;
            oscillator.frequency.value = freq;
            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
