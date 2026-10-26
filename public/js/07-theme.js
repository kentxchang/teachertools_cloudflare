// ===== 馬卡龍主題配色、狀態表切換與左右滑動 =====
        const macaronPalettes = [
            { bg: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e1 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#ffb6c1', secondary: '#ffc0cb', accent: '#ff69b4', text: '#5d4037' }, // Pink
            { bg: 'linear-gradient(135deg, #e0ffff 0%, #e6e6fa 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#b0e0e6', secondary: '#add8e6', accent: '#87cefa', text: '#2f4f4f' }, // Blue
            { bg: 'linear-gradient(135deg, #f5fffa 0%, #e0eee0 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#98fb98', secondary: '#90ee90', accent: '#3cb371', text: '#1b5e20' }, // Mint
            { bg: 'linear-gradient(135deg, #fffacd 0%, #fff8dc 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#f0e68c', secondary: '#bdb76b', accent: '#ffd700', text: '#5c4033' }, // Lemon
            { bg: 'linear-gradient(135deg, #e6e6fa 0%, #d8bfd8 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#dda0dd', secondary: '#ee82ee', accent: '#ba55d3', text: '#4a148c' }, // Lavender
            { bg: 'linear-gradient(135deg, #ffefd5 0%, #ffe4b5 100%)', cardBg: 'rgba(255, 255, 255, 0.75)', primary: '#ffdab9', secondary: '#ffa07a', accent: '#ff7f50', text: '#bf360c' }  // Peach
        ];

        function applyMacaronTheme(className) {
            // Simple hash function for string
            let hash = 0;
            for (let i = 0; i < className.length; i++) {
                hash = className.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % macaronPalettes.length;
            const palette = macaronPalettes[index];
            
            const root = document.documentElement;
            root.style.setProperty('--theme-bg', palette.bg);
            root.style.setProperty('--theme-card-bg', palette.cardBg);
            root.style.setProperty('--theme-primary', palette.primary);
            root.style.setProperty('--theme-secondary', palette.secondary);
            root.style.setProperty('--theme-accent', palette.accent);
            root.style.setProperty('--theme-text', palette.text);
            document.body.style.background = palette.bg;
            document.body.style.color = palette.text;
        }



        function toggleStatusTables() {
            const statusContainer = document.getElementById('statusContainer');
            if (statusContainer.style.display === 'none') {
                statusContainer.style.display = 'flex';
            } else {
                statusContainer.style.display = 'none';
            }
        }

        function slideRight(contentId) {
            const content = document.getElementById(contentId);
            const summarySection = content.querySelector('.summarySection');
            const leftArrow = content.querySelector('.leftArrow');
            const rightArrow = content.querySelector('.rightArrow');
            summarySection.style.transform = 'translateX(-100%)';
            leftArrow.style.display = 'block';
            rightArrow.style.display = 'none';
        }

        function slideLeft(contentId) {
            const content = document.getElementById(contentId);
            const summarySection = content.querySelector('.summarySection');
            const leftArrow = content.querySelector('.leftArrow');
            const rightArrow = content.querySelector('.rightArrow');
            summarySection.style.transform = 'translateX(0)';
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'block';
        }
