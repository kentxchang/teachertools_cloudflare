// ===== 兌獎（點數兌換、兌換紀錄） =====
        // 兌獎功能
        let selectedStudentIndex = null;

        function showRedeemOverlay() {
            renderStudentTable();
            document.getElementById('redeemOverlay').style.display = 'flex';
        }

        function hideRedeemOverlay() {
            document.getElementById('redeemOverlay').style.display = 'none';
        }

        function openRedeemModal(studentIndex) {
            selectedStudentIndex = studentIndex;
            document.getElementById("redeemModal").style.display = "flex";
        }

        function closeModal() {
            document.getElementById("redeemModal").style.display = "none";
            document.getElementById("redeemPoints").value = '';
            document.getElementById("redeemContent").value = '';
        }

        function calculateTotalScore(studentIndex) {
            let totalScore = 0;
            Object.keys(scores).forEach(dateKey => {
                const score = scores[dateKey][`${students[studentIndex]}-${studentIndex}`];
                if (score) totalScore += score;
            });
            return totalScore;
        }

        function getStudentGroupIndex(studentIndex) {
            for (const [groupIndex, members] of Object.entries(groups)) {
                if (members.includes(students[studentIndex])) return parseInt(groupIndex);
            }
            return -1;
        }

        function renderStudentTable(sortedStudents = students.map((student, index) => ({ student, index }))) {
            const studentTableBody = document.querySelector("#studentTable tbody");
            if (!studentTableBody) return;
            studentTableBody.innerHTML = '';
            const groupColors = ["#e0f7fa", "#e8f5e9", "#fce4ec", "#fff3e0", "#ede7f6"];

            sortedStudents.forEach(({ student, index }) => {
                const totalScore = calculateTotalScore(index);
                const studentKey = `${student}-${index}`;
                const redemptionRecords = redemptionHistory[studentKey] || [];
                const groupIndex = getStudentGroupIndex(index);
                const backgroundColor = groupColors[groupIndex % groupColors.length];

                let redemptionDisplay = redemptionRecords.map((record, idx) =>
                    `第${idx + 1}次: ${record.points} 分，${record.content || "無內容"}，${record.date}`
                ).join('<br>');

                const row = document.createElement('tr');
                row.style.backgroundColor = backgroundColor;
                row.innerHTML = `
                    <td>${student}</td>
                    <td>${totalScore}</td>
                    <td><button class="button" onclick="openRedeemModal(${index})">兌換獎勵</button></td>
                    <td>${redemptionDisplay || "無"}</td>
                `;
                studentTableBody.appendChild(row);
            });
        }

        function confirmRedeem() {
            const points = parseInt(document.getElementById("redeemPoints").value);
            const content = document.getElementById("redeemContent").value.trim();

            if (!points || points <= 0) {
                alert("請輸入有效的兌換分數");
                return;
            }

            const totalScore = calculateTotalScore(selectedStudentIndex);
            if (totalScore < points) {
                alert("分數不足以兌換");
                return;
            }

            const studentKey = `${students[selectedStudentIndex]}-${selectedStudentIndex}`;
            const currentDate = new Date().toISOString().split('T')[0];

            if (!scores[currentDate]) scores[currentDate] = {};
            scores[currentDate][studentKey] = (scores[currentDate][studentKey] || 0) - points;

            if (!redemptionHistory[studentKey]) redemptionHistory[studentKey] = [];
            redemptionHistory[studentKey].push({ points, content, date: currentDate });
            setClassData('redemptionHistory', redemptionHistory);
            setClassData('scores', scores);

            // 若目前頁面正顯示當日加扣分表，立即更新
            if (document.getElementById('inputSection').style.display === 'block') {
                const displayedDateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${currentDay}`;
                if (displayedDateKey === currentDate) {
                    updateScoreTables();
                }
            }

            renderStudentTable();
            closeModal();
            alert(`兌換成功！${students[selectedStudentIndex]}的分數減去 ${points}`);
        }

        function saveRedemptionHistoryAsDoc() {
            const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const originalTable = document.querySelector("#studentTable").outerHTML;
            const cleanTable = originalTable
                .replace(/<th>兌換獎勵<\/th>/g, '')
                .replace(/<td><button[^>]*>兌換獎勵<\/button><\/td>/g, '');

            const docContent = `
                <!DOCTYPE html>
                <html lang="zh-TW">
                <head>
                    <meta charset="UTF-8">
                    <title>兌換紀錄</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 10px; border: 1px solid black; text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>學生兌換紀錄 - ${today}</h1>
                    ${cleanTable}
                </body>
                </html>
            `;

            const blob = new Blob([docContent], { type: "application/msword" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `兌換紀錄_${today}.doc`;
            link.click();
        }

        function resetRedemptionData() {
            if (confirm("確定要清空本地儲存的兌換資料嗎？")) {
                removeClassData('redemptionHistory');
                redemptionHistory = {};
                renderStudentTable();
                alert("本地資料已重置");
            }
        }

        function sortTableByGroup() {
            const sortedStudents = students.map((student, index) => ({ student, index }))
                .sort((a, b) => getStudentGroupIndex(a.index) - getStudentGroupIndex(b.index));
            renderStudentTable(sortedStudents);
        }

        function sortTableByScore() {
            const sortedStudents = students.map((student, index) => ({
                student,
                index,
                score: calculateTotalScore(index)
            })).sort((a, b) => b.score - a.score);
            renderStudentTable(sortedStudents);
        }
