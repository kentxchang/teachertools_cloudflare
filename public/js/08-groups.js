// ===== 學生分組（設定組數、拖曳分組） =====
        function submitGroupCount() {
            const groupCount = document.getElementById('groupCountInput').value;
            groups = {};
            for (let i = 0; i < groupCount; i++) {
                groups[i] = [];
            }

            students.forEach((student, index) => {
                groups[index % groupCount].push(student);
            });

            setClassData('groups', groups);
            hideGroupCount();
            showGroupStudents();
        }

        function renderGroups() {
            const groupContainer = document.getElementById('groupContainer');
            groupContainer.innerHTML = '';
            Object.keys(groups).forEach(groupIndex => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'group';
                groupDiv.innerHTML = `<h4>第 ${parseInt(groupIndex) + 1} 組</h4><ul id="group-${groupIndex}">${groups[groupIndex].map(student => `<li draggable="true" ondragstart="drag(event)" id="${student}">${student}</li>`).join('')}</ul>`;
                groupContainer.appendChild(groupDiv);
            });

            const uls = document.querySelectorAll('.group ul');
            uls.forEach(ul => {
                ul.ondragover = function (event) {
                    event.preventDefault();
                };
                ul.ondrop = function (event) {
                    event.preventDefault();
                    const studentId = event.dataTransfer.getData("text");
                    const studentElement = document.getElementById(studentId);
                    if (studentElement) {
                        ul.appendChild(studentElement);
                        updateGroups();
                    }
                };
            });
        }

        function drag(event) {
            event.dataTransfer.setData("text", event.target.id);
        }

        function updateGroups() {
            const groupCount = document.getElementById('groupCountInput').value;
            groups = {};
            for (let i = 0; i < groupCount; i++) {
                groups[i] = [];
            }

            Object.keys(groups).forEach(groupIndex => {
                const ul = document.getElementById(`group-${groupIndex}`);
                ul.querySelectorAll('li').forEach(studentElement => {
                    groups[groupIndex].push(studentElement.id);
                });
            });

            setClassData('groups', groups);
        }

        function submitGroups() {
            setClassData('groups', groups);
            hideGroupStudents();
        }

        function adjustGroups() {
            renderGroups();
        }
