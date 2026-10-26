// ===== Cloudflare 雲端同步、檢視／編輯模式（必須最後載入：會包裝前面模組中修改資料的函式） =====
        // ===== Cloudflare 雲端同步（cloudflareV1）=====
        // 資料仍存在 localStorage（畫面讀取不需等網路），只把「有變動的鍵」上傳到 Cloudflare。
        // 開啟網頁時，只下載上次同步之後其他裝置變動的資料（以版本號 rev 判斷）。
        // 以 cloud_ 開頭的鍵是本機同步狀態，不會上傳。
        // 檢視模式（未輸入密碼）：只能查看，所有修改資料的操作都會被擋下，也不會寫入本機。
        const CLOUD_PASS_KEY = 'cloud_pass';
        const CLOUD_REV_KEY = 'cloud_rev';
        const CLOUD_DIRTY_KEY = 'cloud_dirty';
        const SYNC_DELAY = 5000; // 資料變動後 5 秒合併上傳一次

        // 勾選「記住密碼」存在 localStorage，否則只存到關閉瀏覽器為止（sessionStorage）
        let cloudPass = sessionStorage.getItem(CLOUD_PASS_KEY) || localStorage.getItem(CLOUD_PASS_KEY) || '';
        let isCloudConnected = false;
        let isEditMode = false;
        let isBackgroundSyncing = false;
        let isApplyingRemote = false;
        let syncTimer = null;
        // 尚未上傳的鍵（存在 localStorage，關閉網頁後下次開啟仍會補傳）
        const dirtyKeys = new Set(JSON.parse(localStorage.getItem(CLOUD_DIRTY_KEY) || '[]'));

        function isSyncKey(key) {
            return !key.startsWith('cloud_');
        }

        function getSyncKeys() {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (isSyncKey(key)) keys.push(key);
            }
            return keys;
        }

        function saveDirtyKeys() {
            localStorage.setItem(CLOUD_DIRTY_KEY, JSON.stringify([...dirtyKeys]));
        }

        function markDirty(key) {
            if (isApplyingRemote) return;
            dirtyKeys.add(key);
            saveDirtyKeys();
            scheduleSync();
        }

        function scheduleSync() {
            // 不重設計時器：連續操作時每 5 秒最多上傳一次
            if (!syncTimer && isEditMode) {
                syncTimer = setTimeout(() => {
                    syncTimer = null;
                    pushChanges();
                }, SYNC_DELAY);
            }
        }

        // 檢視模式下不寫入（載入雲端資料時除外）
        function isWriteBlocked(key) {
            return !isEditMode && !isApplyingRemote && isSyncKey(key);
        }

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (isWriteBlocked(key)) return;
            // 值沒有改變就不算變動，避免重複寫入雲端
            const changed = isSyncKey(key) && localStorage.getItem(key) !== String(value);
            originalSetItem.apply(this, arguments);
            if (changed) markDirty(key);
        };

        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function(key) {
            if (isWriteBlocked(key)) return;
            const existed = isSyncKey(key) && localStorage.getItem(key) !== null;
            originalRemoveItem.apply(this, arguments);
            if (existed) markDirty(key);
        };

        // 在檢視模式時提示輸入密碼；回傳是否可以修改
        function requireEditMode() {
            if (isEditMode) return true;
            showCloudSettings('目前是檢視模式，請輸入管理密碼進入編輯模式後再修改資料。');
            return false;
        }

        // 會修改資料的操作：檢視模式下一律擋下
        [
            'changeScore', 'changeGroupScore', 'showStudentNamesInput', 'submitNames',
            'showHomeworkOverlay', 'submitHomework', 'handleGroupButtonClick', 'submitGroupCount',
            'submitGroups', 'adjustGroups', 'openRedeemModal', 'confirmRedeem', 'resetRedemptionData',
            'confirmReset', 'importData', 'importClassData', 'showAddClassInput', 'confirmAddClass',
            'deleteClass', 'toggleButtonStatus', 'toggleAssignmentStatus', 'toggleStudentStatus',
            'toggleAttendance', 'toggleStudentAttendance', 'toggleAllPeriodsAttendance',
            'toggleAllStudentsAttendance', 'saveHomeworkTrackingData'
        ].forEach(name => {
            const original = window[name];
            if (typeof original !== 'function') return;
            window[name] = function() {
                if (!requireEditMode()) return;
                return original.apply(this, arguments);
            };
        });

        // 檢視模式下「儲存並返回」只返回
        const originalSaveAndBack = window.saveAndBack;
        window.saveAndBack = function() {
            if (isEditMode) return originalSaveAndBack.apply(this, arguments);
            goBack();
        };

        // 座位表按鈕（載入時已綁定事件）與匯入檔案選擇：在事件最前面攔截
        const EDIT_ONLY_SELECTOR = '#inputButton2, #generateButton2, #groupButton2, #loadButton2, #resetButton2, #importFile, #importClassFile';
        document.addEventListener('click', (e) => {
            if (!isEditMode && e.target.closest && e.target.closest(EDIT_ONLY_SELECTOR)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                requireEditMode();
            }
        }, true);

        // 拖曳（座位表、分組）都會修改資料
        document.addEventListener('dragstart', (e) => {
            if (!isEditMode) {
                e.preventDefault();
                requireEditMode();
            }
        }, true);

        async function cloudApi(method, body, keepalive = false) {
            const url = method === 'GET' ? `/api/data?since=${Number(localStorage.getItem(CLOUD_REV_KEY)) || 0}` : '/api/data';
            const headers = {};
            if (cloudPass) headers['X-Pass'] = encodeURIComponent(cloudPass);
            if (body) headers['Content-Type'] = 'application/json';
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                cache: 'no-store',
                keepalive
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const err = new Error(result.error || `HTTP ${response.status}`);
                err.status = response.status;
                throw err;
            }
            return result;
        }

        function getIndicator() {
            let indicator = document.getElementById('autoSaveIndicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'autoSaveIndicator';
                indicator.style.position = 'fixed';
                indicator.style.bottom = '10px';
                indicator.style.right = '10px';
                indicator.style.background = 'rgba(0,0,0,0.85)';
                indicator.style.color = 'white';
                indicator.style.padding = '8px 12px';
                indicator.style.borderRadius = '6px';
                indicator.style.zIndex = '99999';
                indicator.style.fontSize = '13px';
                indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                document.body.appendChild(indicator);
            }
            return indicator;
        }

        function showIndicator(text, hideAfter) {
            const indicator = getIndicator();
            indicator.textContent = text;
            indicator.style.display = 'block';
            if (hideAfter) {
                setTimeout(() => { if (dirtyKeys.size === 0 && !isBackgroundSyncing) indicator.style.display = 'none'; }, hideAfter);
            }
        }

        // 上傳有變動的鍵；回傳是否成功
        async function pushChanges(keepalive = false) {
            if (isBackgroundSyncing || dirtyKeys.size === 0 || !isEditMode) return dirtyKeys.size === 0;
            isBackgroundSyncing = true;
            if (!keepalive) showIndicator('☁️ 自動同步上傳中...');

            const keys = [...dirtyKeys];
            const set = {};
            const del = [];
            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value === null) del.push(key);
                else set[key] = value;
            });
            dirtyKeys.clear();
            saveDirtyKeys();

            try {
                const result = await cloudApi('POST', { set, del }, keepalive);
                // 若期間有其他裝置寫入（prev 不等於本機版本），保留舊版本號，下次開啟時會一併下載
                if (result.prev === (Number(localStorage.getItem(CLOUD_REV_KEY)) || 0)) {
                    localStorage.setItem(CLOUD_REV_KEY, String(result.rev));
                }
                localStorage.setItem('cloud_lastSavedTime', new Date().toLocaleString());
                localStorage.setItem('cloud_lastSaveType', '自動儲存');
                updateCloudStatusUI(true);
                showIndicator('☁️ 已自動儲存至雲端', 2000);
                return true;
            } catch (e) {
                console.error('Background sync failed:', e);
                keys.forEach(key => dirtyKeys.add(key));
                saveDirtyKeys();
                showIndicator('❌ 自動儲存失敗：' + e.message);
                if (e.status === 401) handleAuthError(e.message);
                return false;
            } finally {
                isBackgroundSyncing = false;
                if (dirtyKeys.size > 0 && isEditMode) scheduleSync();
            }
        }

        function applyCloudData(result) {
            let changedCount = 0;
            isApplyingRemote = true;
            if (result.full) {
                if (result.rev === 0) {
                    // 雲端尚無資料：編輯模式下把本機現有資料全部上傳
                    if (isEditMode) getSyncKeys().forEach(key => dirtyKeys.add(key));
                } else {
                    // 新裝置第一次連線：以雲端資料為準
                    getSyncKeys().forEach(key => {
                        if (!(key in result.data)) {
                            localStorage.removeItem(key);
                            changedCount++;
                        }
                    });
                    dirtyKeys.clear();
                }
            }
            Object.keys(result.data).forEach(key => {
                if (localStorage.getItem(key) !== result.data[key]) {
                    localStorage.setItem(key, result.data[key]);
                    changedCount++;
                }
                dirtyKeys.delete(key);
            });
            result.del.forEach(key => {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                    changedCount++;
                }
                dirtyKeys.delete(key);
            });
            isApplyingRemote = false;
            saveDirtyKeys();
            localStorage.setItem(CLOUD_REV_KEY, String(result.rev));
            return changedCount;
        }

        function refreshAfterCloudLoad() {
            // 重新同步記憶體中的 classList
            classList = getStoredClassList();

            if (typeof renderClassList === 'function') {
                renderClassList();
            }

            if (currentClass && typeof loadClassData === 'function') {
                loadClassData();
                if (typeof renderStudents === 'function') renderStudents();
                if (typeof renderScoreButtons === 'function') renderScoreButtons();
                if (typeof renderHomeworkList === 'function') renderHomeworkList();
                if (typeof renderGroups === 'function') renderGroups();
            }
        }

        function savePass(pass, remember) {
            cloudPass = pass;
            sessionStorage.removeItem(CLOUD_PASS_KEY);
            localStorage.removeItem(CLOUD_PASS_KEY);
            if (pass) (remember ? localStorage : sessionStorage).setItem(CLOUD_PASS_KEY, pass);
        }

        function handleAuthError(message) {
            isEditMode = false;
            savePass('');
            updateCloudStatusUI(isCloudConnected);
            showCloudSettings(message);
        }

        // 開啟網頁時自動載入雲端資料（只下載有變動的部分）；有密碼就同時驗證並進入編輯模式
        async function autoSyncFromCloudOnLoad() {
            showIndicator('☁️ 正在自動載入雲端最新資料...');
            try {
                let result;
                try {
                    result = await cloudApi('GET');
                } catch (e) {
                    if (e.status !== 401) throw e;
                    // 密碼錯誤：清除密碼後以檢視模式載入
                    getIndicator().style.display = 'none';
                    handleAuthError(e.message);
                    result = await cloudApi('GET');
                }
                isCloudConnected = true;
                isEditMode = result.editable;
                window.cloudHasPass = result.hasPass;
                const changedCount = applyCloudData(result);
                updateCloudStatusUI(true);
                if (changedCount > 0) {
                    refreshAfterCloudLoad();
                    showIndicator('☁️ 雲端最新資料已成功載入！', 2500);
                } else {
                    showIndicator(result.rev === 0 ? '☁️ 雲端資料庫尚無資料' : '☁️ 已是最新資料', 2000);
                }
                if (dirtyKeys.size > 0) pushChanges();
            } catch (e) {
                console.error('Auto load fetch error', e);
                updateCloudStatusUI(false);
                showIndicator('⚠️ 雲端資料載入失敗：' + e.message, 4000);
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            autoSyncFromCloudOnLoad();
        });

        function checkCloudConnection() {
            updateCloudStatusUI(isCloudConnected);
        }

        function updateCloudStatusUI(connected) {
            const statusSpan = document.getElementById('cloudStatus');
            if (statusSpan) {
                statusSpan.textContent = connected ? '已連線 ✅' : '未連線 ❌';
                statusSpan.style.color = connected ? 'green' : 'red';
                statusSpan.style.fontWeight = 'bold';
            }

            const overlayStatus = document.getElementById('overlayCloudStatus');
            if (overlayStatus) {
                if (!connected) overlayStatus.innerHTML = '❌ 雲端未連結';
                else overlayStatus.innerHTML = isEditMode ? '✏️ 編輯模式（雲端已連結）' : '👀 檢視模式（雲端已連結）';
                overlayStatus.style.color = connected ? (isEditMode ? '#2e7d32' : '#1565c0') : '#c62828';
            }

            const lastSavedTimeDisplay = document.getElementById('lastSavedTimeDisplay');
            if (lastSavedTimeDisplay) {
                const lastTime = localStorage.getItem('cloud_lastSavedTime');
                const lastType = localStorage.getItem('cloud_lastSaveType') || '手動儲存';
                lastSavedTimeDisplay.textContent = lastTime ? `上次儲存時間: ${lastTime} (${lastType})` : '上次儲存時間: 尚未儲存';
            }

            const editModeStatus = document.getElementById('editModeStatus');
            if (editModeStatus) {
                editModeStatus.textContent = isEditMode ? '✏️ 編輯模式' : '👀 檢視模式';
                editModeStatus.style.color = isEditMode ? 'green' : '#1565c0';
                editModeStatus.style.fontWeight = 'bold';
            }
            const unlockGroup = document.getElementById('unlockGroup');
            if (unlockGroup) unlockGroup.style.display = isEditMode ? 'none' : 'block';
            const lockGroup = document.getElementById('lockGroup');
            if (lockGroup) lockGroup.style.display = isEditMode ? 'block' : 'none';

            // 主畫面「班級與編輯模式」分頁
            document.getElementById('mainUnlockGroup').style.display = isEditMode ? 'none' : 'block';
            document.getElementById('mainLockGroup').style.display = isEditMode ? 'block' : 'none';
            const mainPassHint = document.getElementById('mainPassHint');
            if (window.cloudHasPass === false) {
                mainPassHint.textContent = '尚未設定管理密碼：現在輸入的密碼會成為這個網站的管理密碼，請牢記。';
                mainPassHint.style.color = '#e65100';
            } else {
                mainPassHint.textContent = '未輸入密碼時只能查看資料，輸入管理密碼後才能新增班級或修改資料。';
                mainPassHint.style.color = '';
            }

            const editModeBtn = document.getElementById('editModeBtn');
            if (editModeBtn) {
                editModeBtn.textContent = isEditMode ? '✏️' : '🔒';
                editModeBtn.title = isEditMode ? '編輯模式（點此鎖定）' : '檢視模式（點此輸入密碼）';
                editModeBtn.style.background = isEditMode ? '#4CAF50' : '#607D8B';
            }

            // 更新雲端按鈕狀態（只有編輯模式可以上傳）
            const saveCloudBtn = document.getElementById('saveCloudBtn');
            if (saveCloudBtn) {
                if (connected && isEditMode) {
                    saveCloudBtn.classList.remove('disabled');
                    saveCloudBtn.style.pointerEvents = 'auto';
                } else {
                    saveCloudBtn.classList.add('disabled');
                    saveCloudBtn.style.pointerEvents = 'none';
                }
            }
        }

        function showCloudSettings(message) {
            document.getElementById('cloudPassInput').value = '';
            const hint = document.getElementById('cloudPassHint');
            if (typeof message === 'string') {
                hint.textContent = message;
                hint.style.color = '#c62828';
            } else if (window.cloudHasPass === false) {
                hint.textContent = '尚未設定管理密碼：現在輸入的密碼會成為這個網站的管理密碼，請牢記。';
                hint.style.color = '#e65100';
            } else {
                hint.textContent = '未輸入密碼時只能查看資料。請輸入管理密碼進入編輯模式。';
                hint.style.color = '';
            }
            document.getElementById('cloudSettingsOverlay').style.display = 'flex';
            updateCloudStatusUI(isCloudConnected);
            if (!isEditMode) document.getElementById('cloudPassInput').focus();
        }

        function hideCloudSettings() {
            document.getElementById('cloudSettingsOverlay').style.display = 'none';
        }

        function toggleEditMode() {
            if (isEditMode) lockEditMode();
            else showCloudSettings();
        }

        // 輸入密碼進入編輯模式
        async function saveCloudSettings() {
            const pass = document.getElementById('cloudPassInput').value.trim();
            if (!pass) {
                alert('請輸入管理密碼');
                return;
            }
            savePass(pass, document.getElementById('rememberPassInput').checked);
            const hint = document.getElementById('cloudPassHint');
            hint.textContent = '驗證中...';
            hint.style.color = '#666';
            await autoSyncFromCloudOnLoad();
            if (isEditMode) {
                hideCloudSettings();
                alert('已進入編輯模式，可以修改資料了。');
            }
        }

        // 主畫面的密碼欄：沿用設定視窗的驗證流程（密碼錯誤時會開啟設定視窗顯示原因）
        function unlockFromMain() {
            const input = document.getElementById('mainPassInput');
            document.getElementById('cloudPassInput').value = input.value;
            document.getElementById('rememberPassInput').checked = document.getElementById('mainRememberPass').checked;
            input.value = '';
            saveCloudSettings();
        }

        // 離開編輯模式：先上傳尚未同步的變動，再清除密碼
        async function lockEditMode() {
            if (!confirm('確定要離開編輯模式嗎？之後要修改資料需重新輸入密碼。')) return;
            clearTimeout(syncTimer);
            syncTimer = null;
            while (isBackgroundSyncing) await new Promise(r => setTimeout(r, 200));
            if (!(await pushChanges())) {
                alert('尚有資料未上傳成功，請確認網路後再試一次。');
                return;
            }
            isEditMode = false;
            savePass('');
            updateCloudStatusUI(isCloudConnected);
            hideCloudSettings();
        }

        // 手動上傳：只上傳尚未同步的變動
        async function syncToCloud() {
            if (!requireEditMode()) return;
            if (dirtyKeys.size === 0 && !isBackgroundSyncing) {
                alert('雲端已是最新資料，不需要上傳。');
                return;
            }
            const loadingOverlay = document.getElementById('cloudLoadingOverlay');
            loadingOverlay.style.display = 'flex';
            clearTimeout(syncTimer);
            syncTimer = null;
            // 等待進行中的自動上傳完成
            while (isBackgroundSyncing) await new Promise(r => setTimeout(r, 200));
            const ok = await pushChanges();
            loadingOverlay.style.display = 'none';
            if (ok) {
                localStorage.setItem('cloud_lastSaveType', '手動儲存');
                updateCloudStatusUI(true);
                alert('雲端儲存成功！');
            } else {
                alert('雲端儲存失敗，請檢查網路後再試一次。');
            }
        }

        // 一次性搬移：從舊版 GAS Web App 下載全部資料並上傳到 Cloudflare
        async function importFromGas() {
            const url = document.getElementById('gasImportUrlInput').value.trim();
            if (!url.startsWith('https://script.google.com')) {
                alert('請貼上舊版的 GAS Web App 網址（https://script.google.com/ 開頭）');
                return;
            }
            if (!isEditMode) {
                alert('請先輸入管理密碼進入編輯模式。');
                return;
            }
            if (!confirm('警告：這將以舊版資料覆蓋目前所有資料，確定要繼續嗎？')) return;

            const loadingOverlay = document.getElementById('cloudLoadingOverlay');
            loadingOverlay.style.display = 'flex';
            try {
                const response = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=load&t=' + Date.now());
                const result = await response.json();
                if (result.status !== 'success' || !result.data) throw new Error(result.message || '舊版沒有回傳資料');

                // 舊版的連線設定與儲存時間不需要搬移
                const skipKeys = ['gas_web_app_url', 'lastSavedTime', 'lastSaveType'];
                const data = {};
                Object.keys(result.data).forEach(key => {
                    if (!skipKeys.includes(key) && isSyncKey(key)) data[key] = String(result.data[key]);
                });
                getSyncKeys().forEach(key => { if (!(key in data)) localStorage.removeItem(key); });
                Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));

                clearTimeout(syncTimer);
                syncTimer = null;
                while (isBackgroundSyncing) await new Promise(r => setTimeout(r, 200));
                if (!(await pushChanges())) throw new Error('上傳到 Cloudflare 失敗');
                alert(`已匯入 ${Object.keys(data).length} 筆資料，網頁將重新整理。`);
                location.reload();
            } catch (e) {
                console.error(e);
                alert('匯入失敗: ' + e.message + '\n請確認舊版 GAS 的存取權限為「任何人」。');
            } finally {
                loadingOverlay.style.display = 'none';
            }
        }

        // 分享網址不含密碼：別人打開只能查看
        function generateShareLink() {
            const fullUrl = window.location.origin + window.location.pathname;

            document.getElementById('shareUrlInput').value = fullUrl;

            // Generate QR Code
            const qrImg = document.getElementById('qrCodeImage');
            qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(fullUrl);
            qrImg.style.display = 'block';
        }

        function copyShareUrl() {
            const copyText = document.getElementById("shareUrlInput");
            copyText.select();
            document.execCommand("copy");
            alert("連結已複製！");
        }

        // 切換分頁或關閉網頁時，立即送出尚未上傳的變動
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && dirtyKeys.size > 0) {
                clearTimeout(syncTimer);
                syncTimer = null;
                pushChanges(true);
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (isEditMode && (dirtyKeys.size > 0 || isBackgroundSyncing)) {
                e.preventDefault();
                e.returnValue = '資料尚未完全上傳至雲端，請等待自動儲存完成後再關閉！';
                return e.returnValue;
            }
        });
