// ===== 側邊選單、學生名單管理（新增、改名、刪除，並同步搬移相關紀錄）、分組入口按鈕、隱藏已完成學生 =====
        // 側邊選單功能
        function toggleSideMenu() {
            const sideMenu = document.getElementById('sideMenu');

            if (sideMenu.classList.contains('open')) {
                sideMenu.classList.remove('open');
            } else {
                sideMenu.classList.add('open');
            }
        }

        function closeSideMenu() {
            const sideMenu = document.getElementById('sideMenu');
            sideMenu.classList.remove('open');
        }

        function showSideMenuToggle() {
            document.getElementById('menuToggle').style.display = 'flex';
        }

        function hideSideMenuToggle() {
            document.getElementById('menuToggle').style.display = 'none';
            closeSideMenu(); // 確保選單也關閉
        }

        // 名單編輯中的暫存資料：orig 為原本姓名（新增的為 null），按「儲存變更」才寫入
        let studentEditRows = [];

        function showStudentNamesInput() {
            studentEditRows = students.map(name => ({ orig: name, name, deleted: false }));
            document.getElementById('newStudentName').value = '';
            document.getElementById('studentNames').value = '';
            document.getElementById('bulkAddBox').style.display = 'none';
            renderStudentEditList();
            document.getElementById('studentNamesInput').style.display = 'flex';
            document.getElementById('studentNamesInputOverlay').style.display = 'block';
            document.getElementById('newStudentName').focus();
        }

        function hideStudentNamesInput() {
            document.getElementById('studentNamesInput').style.display = 'none';
            document.getElementById('studentNamesInputOverlay').style.display = 'none';
        }

        function renderStudentEditList() {
            const list = document.getElementById('studentEditList');
            list.innerHTML = '';
            let no = 0;
            studentEditRows.forEach(row => {
                const div = document.createElement('div');
                const changed = row.orig !== null && row.name.trim() !== row.orig;
                div.className = 'sn-row' + (row.deleted ? ' deleted' : row.orig === null ? ' added' : changed ? ' changed' : '');

                const num = document.createElement('span');
                num.className = 'sn-no';
                num.textContent = row.deleted ? '—' : ++no;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = row.name;
                input.disabled = row.deleted;
                input.title = changed ? `原姓名：${row.orig}` : '';
                input.oninput = () => {
                    row.name = input.value;
                    const isChanged = row.orig !== null && row.name.trim() !== row.orig;
                    div.classList.toggle('changed', isChanged);
                    input.title = isChanged ? `原姓名：${row.orig}` : '';
                };

                const del = document.createElement('button');
                del.className = 'sn-del';
                del.textContent = row.deleted ? '↩️' : '🗑️';
                del.title = row.deleted ? '復原' : '刪除';
                del.onclick = () => {
                    if (row.orig === null) studentEditRows.splice(studentEditRows.indexOf(row), 1);
                    else row.deleted = !row.deleted;
                    renderStudentEditList();
                };

                div.append(num, input, del);
                list.appendChild(div);
            });
            if (studentEditRows.length === 0) {
                list.innerHTML = '<div class="sn-empty">目前沒有學生，請從上方新增</div>';
            }
            document.getElementById('studentCountBadge').textContent = `共 ${no} 位`;
        }

        function addStudentRow() {
            const input = document.getElementById('newStudentName');
            const name = input.value.trim();
            if (!name) return;
            studentEditRows.push({ orig: null, name, deleted: false });
            input.value = '';
            renderStudentEditList();
            const list = document.getElementById('studentEditList');
            list.scrollTop = list.scrollHeight;
            input.focus();
        }

        function toggleBulkAdd() {
            const box = document.getElementById('bulkAddBox');
            box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
            if (box.style.display === 'flex') document.getElementById('studentNames').focus();
        }

        function addBulkStudents() {
            const textarea = document.getElementById('studentNames');
            const current = studentEditRows.filter(r => !r.deleted).map(r => r.name.trim());
            textarea.value.split('\n').map(name => name.trim()).forEach(name => {
                if (name && !current.includes(name)) {
                    studentEditRows.push({ orig: null, name, deleted: false });
                    current.push(name);
                }
            });
            textarea.value = '';
            document.getElementById('bulkAddBox').style.display = 'none';
            renderStudentEditList();
        }

        function handleGroupButtonClick() {
            if (Object.keys(scores).length > 0) {
                if (confirm("分組已有加扣分資料，重新分組將清除所有組別分數記錄。是否繼續？")) {
                    clearGroupScores();
                    showGroupCount();
                }
            } else {
                showGroupCount();
            }
        }

        function clearGroupScores() {
            Object.keys(scores).forEach(dateKey => {
                Object.keys(scores[dateKey]).forEach(key => {
                    if (key.startsWith('group-')) {
                        delete scores[dateKey][key];
                    }
                });
            });
            setClassData('scores', scores);
            updateScoreTables();
        }

        function showGroupCount() {
            document.getElementById('groupCountOverlay').style.display = 'flex';
            if (Object.keys(groups).length > 0) {
                document.getElementById('adjustGroupsButton').style.display = 'block';
            } else {
                document.getElementById('adjustGroupsButton').style.display = 'none';
            }
        }

        function hideGroupCount() {
            document.getElementById('groupCountOverlay').style.display = 'none';
        }

        function showGroupStudents() {
            document.getElementById('groupStudentsOverlay').style.display = 'flex';
            renderGroups();
        }

        function hideGroupStudents() {
            document.getElementById('groupStudentsOverlay').style.display = 'none';
        }


        function toggleHideStudents() {
            hideCompletedStudents = !hideCompletedStudents;
            const toggleBtn = document.getElementById('toggleHideBtn');
            if (hideCompletedStudents) {
                toggleBtn.textContent = '顯示已繳交作業學生';
            } else {
                toggleBtn.textContent = '隱藏已繳交作業學生';
            }
            const rows = document.querySelectorAll('#tablesContainer table tbody tr');
            rows.forEach(row => {
                const statusButtons = row.querySelectorAll('.status-button');
                let allCompleted = true;
                statusButtons.forEach(btn => {
                    const bgColor = btn.style.backgroundColor;
                    if (bgColor !== 'green' && bgColor !== 'blue') {
                        allCompleted = false;
                    }
                });
                if (hideCompletedStudents && allCompleted) {
                    row.style.display = 'none';
                } else {
                    row.style.display = '';
                }
            });
        }

        // 依對照表重新命名物件的鍵：對到 null 的刪除；不在對照表、但和新鍵相撞的舊殘留資料也刪除，避免新學生繼承
        function remapKeys(obj, map, newKeys) {
            const out = {};
            Object.keys(obj || {}).forEach(k => {
                if (k in map) {
                    if (map[k] !== null) out[map[k]] = obj[k];
                } else if (!newKeys.has(k)) {
                    out[k] = obj[k];
                }
            });
            return out;
        }

        function submitNames() {
            const kept = studentEditRows.filter(r => !r.deleted);
            const names = kept.map(r => r.name.trim());
            if (names.some(name => !name)) {
                alert('學生姓名不可空白，若要移除請按 🗑️ 刪除。');
                return;
            }
            const dup = names.find((name, i) => names.indexOf(name) !== i);
            if (dup) {
                alert(`姓名「${dup}」重複了，請修改後再儲存。`);
                return;
            }

            const studentsToRemove = studentEditRows.filter(r => r.deleted).map(r => r.orig);
            const studentsToAdd = kept.filter(r => r.orig === null).map(r => r.name.trim());
            const renamed = kept.filter(r => r.orig !== null && r.name.trim() !== r.orig).map(r => `${r.orig} → ${r.name.trim()}`);
            if (studentsToRemove.length + studentsToAdd.length + renamed.length === 0) {
                hideStudentNamesInput();
                return;
            }
            if (studentsToRemove.length > 0 && !confirm(`確定要刪除：${studentsToRemove.join('、')}？\n這些學生的加扣分、點名、作業、兌獎紀錄將一併刪除，無法復原。`)) {
                return;
            }

            // 姓名對照（舊姓名 → 新姓名，刪除為 null）
            const nameMap = {};
            studentEditRows.forEach(r => {
                if (r.orig !== null) nameMap[r.orig] = r.deleted ? null : r.name.trim();
            });
            const newNames = new Set(names);
            // 加扣分與兌獎以「姓名-序號」為鍵，刪除學生會讓後面的序號改變，需一起換算
            const keyMap = {};
            students.forEach((name, i) => {
                const newName = nameMap[name];
                keyMap[`${name}-${i}`] = newName === null ? null : `${newName}-${names.indexOf(newName)}`;
            });
            const newKeys = new Set(names.map((name, i) => `${name}-${i}`));

            Object.keys(scores).forEach(dateKey => {
                scores[dateKey] = remapKeys(scores[dateKey], keyMap, newKeys);
            });
            redemptionHistory = remapKeys(redemptionHistory, keyMap, newKeys);
            Object.keys(attendanceRecords).forEach(dateKey => {
                attendanceRecords[dateKey] = remapKeys(attendanceRecords[dateKey], nameMap, newNames);
            });
            Object.keys(groups).forEach(groupIndex => {
                groups[groupIndex] = (groups[groupIndex] || [])
                    .map(name => name in nameMap ? nameMap[name] : name)
                    .filter(name => name !== null);
            });

            // 作業檢核表：checklist_日期 → { 作業: { 姓名: 狀態 } }
            const checklistPrefix = getClassPrefix() + 'checklist_';
            const checklistKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(checklistPrefix)) checklistKeys.push(key);
            }
            checklistKeys.forEach(key => {
                const statusData = JSON.parse(localStorage.getItem(key) || '{}');
                Object.keys(statusData).forEach(assignment => {
                    statusData[assignment] = remapKeys(statusData[assignment], nameMap, newNames);
                });
                localStorage.setItem(key, JSON.stringify(statusData));
            });

            // 座位表：刪除的學生留下空位
            const seating = getClassData('seatingChartData2', null);
            if (seating && Array.isArray(seating.seatingChartData)) {
                seating.seatingChartData.forEach(seat => {
                    if (seat.name in nameMap) seat.name = nameMap[seat.name] || '';
                });
                setClassData('seatingChartData2', seating);
                seatingChartData2 = seating.seatingChartData;
            }

            students = names;
            setClassData('students', students);
            setClassData('groups', groups);
            setClassData('scores', scores);
            setClassData('redemptionHistory', redemptionHistory);
            setClassData('attendanceRecords', attendanceRecords);

            // 自動分配新學生到分組
            if (studentsToAdd.length > 0) {
                autoAssignNewStudents(studentsToAdd);
            }

            hideStudentNamesInput();
            renderCalendar();

            // 顯示操作結果
            const message = [];
            if (studentsToAdd.length > 0) message.push(`新增學生：${studentsToAdd.join('、')}`);
            if (renamed.length > 0) message.push(`修改姓名：${renamed.join('、')}`);
            if (studentsToRemove.length > 0) message.push(`刪除學生：${studentsToRemove.join('、')}`);
            alert(message.join('\n'));
        }

        function autoAssignNewStudents(newStudents) {
            // 如果沒有分組，先建立一個預設分組
            if (Object.keys(groups).length === 0) {
                groups['0'] = [];
            }

            newStudents.forEach(student => {
                let minGroupIndex = 0;
                let minGroupSize = Infinity;
                Object.keys(groups).forEach(groupIndex => {
                    if (groups[groupIndex] && groups[groupIndex].length < minGroupSize) {
                        minGroupSize = groups[groupIndex].length;
                        minGroupIndex = groupIndex;
                    }
                });

                // 確保目標分組存在
                if (!groups[minGroupIndex]) {
                    groups[minGroupIndex] = [];
                }

                groups[minGroupIndex].push(student);
            });
            setClassData('groups', groups);
        }
