// ===== 資料匯出／匯入（單一班級、全部班級、舊格式）、匯出圖片 =====
        // 顯示匯出選項對話框
        function showExportOptions() {
            // 更新按鈕文字以顯示當前班級名稱
            const currentClassButton = document.querySelector('#exportOptionsOverlay button[onclick="exportSingleClass()"]');
            if (currentClassButton) {
                currentClassButton.innerHTML = `📋 匯出當前班級 (${currentClass || '未選擇'})`;
            }
            document.getElementById('exportOptionsOverlay').style.display = 'flex';
        }

        // 隱藏匯出選項對話框
        function hideExportOptions() {
            document.getElementById('exportOptionsOverlay').style.display = 'none';
        }

        // 匯出單一班級資料
        function exportSingleClass() {
            if (!currentClass) {
                alert('請先選擇班級');
                return;
            }

            const data = exportClassData(currentClass);
            downloadData(data, `教師課堂管理工具_${currentClass}_${getFormattedDate()}.json`);
            hideExportOptions();
        }

        // 匯出所有班級資料
        function exportAllClasses() {
            const allData = {
                exportType: 'all_classes',
                classList: classList,
                classes: {},
                exportDate: new Date().toISOString()
            };

            classList.forEach(className => {
                allData.classes[className] = exportClassData(className);
            });

            downloadData(allData, `教師課堂管理工具_所有班級_${getFormattedDate()}.json`);
            hideExportOptions();
        }

        // 匯出指定班級的資料
        function exportClassData(className) {
            const classPrefix = `${fileName}_${className}_`;

            // 收集作業狀態數據
            const checklistData = {};
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(classPrefix + 'checklist_')) {
                    const dateKey = key.replace(classPrefix + 'checklist_', '');
                    if (dateKey) {
                        checklistData[dateKey] = JSON.parse(localStorage.getItem(key));
                    }
                }
            });

            // 收集座位表數據
            const seatingChartData = localStorage.getItem(classPrefix + 'seatingChartData2');

            return {
                className: className,
                students: JSON.parse(localStorage.getItem(classPrefix + 'students')) || [],
                scores: JSON.parse(localStorage.getItem(classPrefix + 'scores')) || {},
                homeworks: JSON.parse(localStorage.getItem(classPrefix + 'homeworks')) || {},
                groups: JSON.parse(localStorage.getItem(classPrefix + 'groups')) || {},
                checklist: checklistData,
                redemptionHistory: JSON.parse(localStorage.getItem(classPrefix + 'redemptionHistory')) || {},
                attendanceRecords: JSON.parse(localStorage.getItem(classPrefix + 'attendanceRecords')) || {},
                seatingChartData: seatingChartData ? JSON.parse(seatingChartData) : null,
                selectedTheme: localStorage.getItem(classPrefix + 'selectedTheme'),
                exportDate: new Date().toISOString()
            };
        }

        // 下載資料檔案
        function downloadData(data, fileName) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');

            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            document.body.removeChild(downloadAnchorNode);
        }

        // 取得格式化日期
        function getFormattedDate() {
            const currentDate = new Date();
            return currentDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');
        }

        // 向後兼容的舊匯出函數（可能被其他地方調用）
        function exportData() {
            showExportOptions();
        }

        // 班級選擇介面的匯入功能
        function importClassData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // 檢查匯入資料格式
                    if (importedData.exportType === 'all_classes') {
                        // 匯入所有班級資料
                        importAllClassesData(importedData);
                    } else if (importedData.className) {
                        // 匯入單一班級資料（新格式）
                        importSingleClassData(importedData);
                    } else {
                        // 舊格式匯入 - 需要讓用戶選擇目標班級
                        handleLegacyImport(importedData);
                    }
                } catch (error) {
                    alert('匯入失敗：檔案格式錯誤');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);

            // 清空檔案輸入，允許重複選擇同一檔案
            event.target.value = '';
        }

        // 處理舊格式匯入
        function handleLegacyImport(importedData) {
            const className = prompt('這是舊格式的資料檔案，請輸入要匯入到的班級名稱：');
            if (!className) return;

            // 將舊格式資料轉換為新格式
            const legacyData = {
                className: className,
                students: importedData.students || [],
                scores: importedData.scores || {},
                homeworks: importedData.homeworks || {},
                groups: importedData.groups || {},
                checklist: importedData.checklist || {},
                redemptionHistory: importedData.redemptionHistory || {},
                attendanceRecords: importedData.attendanceRecords || {},
                seatingChartData: importedData.seatingChartData || null,
                selectedTheme: null
            };

            if (confirm(`將匯入資料到班級「${className}」。如果班級已存在，將會覆蓋現有資料。確定要繼續嗎？`)) {
                // 添加到班級列表（如果不存在）
                if (!classList.includes(className)) {
                    classList.push(className);
                    localStorage.setItem(fileName + '_classList', JSON.stringify(classList));
                }

                importClassDataToStorage(className, legacyData);
                renderClassList();
                alert(`成功匯入資料到班級「${className}」！`);
            }
        }

        function importData(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function (event) {
                try {
                    const importedData = JSON.parse(event.target.result);

                    // 檢查匯入資料格式
                    if (importedData.exportType === 'all_classes') {
                        // 匯入所有班級資料
                        importAllClassesData(importedData);
                    } else if (importedData.className) {
                        // 匯入單一班級資料（新格式）
                        importSingleClassData(importedData);
                    } else {
                        // 舊格式匯入（向後兼容）
                        importLegacyData(importedData);
                    }
                } catch (error) {
                    alert('匯入失敗：檔案格式錯誤');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        }

        // 匯入所有班級資料
        function importAllClassesData(importedData) {
            const importedClasses = importedData.classList || [];
            const existingClasses = classList.filter(c => importedClasses.includes(c));
            const newClasses = importedClasses.filter(c => !classList.includes(c));

            let confirmMessage = '將匯入以下班級：\n';
            if (newClasses.length > 0) {
                confirmMessage += `\n新增班級：${newClasses.join('、')}`;
            }
            if (existingClasses.length > 0) {
                confirmMessage += `
取代現有班級：${existingClasses.join('、')}`;
            }
            confirmMessage += '\n\n確定要繼續嗎？';

            if (confirm(confirmMessage)) {
                // 合併班級列表（保留現有班級，新增新班級）
                importedClasses.forEach(className => {
                    if (!classList.includes(className)) {
                        classList.push(className);
                    }
                });
                localStorage.setItem(fileName + '_classList', JSON.stringify(classList));

                // 匯入每個班級的資料
                Object.keys(importedData.classes).forEach(className => {
                    const classData = importedData.classes[className];
                    importClassDataToStorage(className, classData);
                });

                // 重新載入班級選擇介面
                renderClassList();
                alert(`成功匯入 ${importedClasses.length} 個班級的資料！
新增：${newClasses.length} 個
更新：${existingClasses.length} 個`);
            }
        }

        // 匯入單一班級資料
        function importSingleClassData(importedData) {
            const className = importedData.className;
            const isExisting = classList.includes(className);

            const action = isExisting ? '取代' : '新增';
            if (confirm(`將${action}班級「${className}」的資料。${isExisting ? '這會覆蓋現有資料。' : ''}確定要繼續嗎？`)) {
                // 添加到班級列表（如果不存在）
                if (!isExisting) {
                    classList.push(className);
                    localStorage.setItem(fileName + '_classList', JSON.stringify(classList));
                }

                // 匯入班級資料
                importClassDataToStorage(className, importedData);

                // 重新載入班級選擇介面
                renderClassList();
                alert(`成功${action}班級「${className}」的資料！`);
            }
        }

        // 舊格式匯入（向後兼容）
        function importLegacyData(importedData) {
            const className = prompt('這是舊格式的資料檔案，請輸入要匯入到的班級名稱：');
            if (!className) return;

            const isExisting = classList.includes(className);
            const action = isExisting ? '取代' : '新增';

            // 將舊格式資料轉換為新格式
            const legacyData = {
                className: className,
                students: importedData.students || [],
                scores: importedData.scores || {},
                homeworks: importedData.homeworks || {},
                groups: importedData.groups || {},
                checklist: importedData.checklist || {},
                redemptionHistory: importedData.redemptionHistory || {},
                attendanceRecords: importedData.attendanceRecords || {},
                seatingChartData: importedData.seatingChartData || null,
                selectedTheme: null
            };

            if (confirm(`將${action}班級「${className}」的資料。${isExisting ? '這會覆蓋現有資料。' : ''}確定要繼續嗎？`)) {
                // 添加到班級列表（如果不存在）
                if (!isExisting) {
                    classList.push(className);
                    localStorage.setItem(fileName + '_classList', JSON.stringify(classList));
                }

                importClassDataToStorage(className, legacyData);
                renderClassList();
                alert(`成功${action}班級「${className}」的資料！`);
            }
        }

        // 匯入班級資料到localStorage
        function importClassDataToStorage(className, classData) {
            const classPrefix = `${fileName}_${className}_`;

            // 儲存基本資料
            localStorage.setItem(classPrefix + 'students', JSON.stringify(classData.students || []));
            localStorage.setItem(classPrefix + 'scores', JSON.stringify(classData.scores || {}));
            localStorage.setItem(classPrefix + 'homeworks', JSON.stringify(classData.homeworks || {}));
            localStorage.setItem(classPrefix + 'groups', JSON.stringify(classData.groups || {}));
            localStorage.setItem(classPrefix + 'redemptionHistory', JSON.stringify(classData.redemptionHistory || {}));
            localStorage.setItem(classPrefix + 'attendanceRecords', JSON.stringify(classData.attendanceRecords || {}));

            // 儲存座位表資料
            if (classData.seatingChartData) {
                localStorage.setItem(classPrefix + 'seatingChartData2', JSON.stringify(classData.seatingChartData));
            }

            // 儲存主題設定
            if (classData.selectedTheme) {
                localStorage.setItem(classPrefix + 'selectedTheme', classData.selectedTheme);
            }

            // 清除舊的作業狀態數據
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(classPrefix + 'checklist_')) {
                    localStorage.removeItem(key);
                }
            });

            // 匯入作業狀態數據
            if (classData.checklist) {
                Object.keys(classData.checklist).forEach(dateKey => {
                    localStorage.setItem(`${classPrefix}checklist_${dateKey}`, JSON.stringify(classData.checklist[dateKey]));
                });
            }
        }

        function exportImage() {
            const element = document.querySelector('#checklistSection');
            html2canvas(element).then(canvas => {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = `checklist-${document.getElementById('checklistDate').dataset.dateKey}.png`;
                link.click();
            });
        }

