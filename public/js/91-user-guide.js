// ===== 教學應用指南視窗 =====
document.addEventListener('DOMContentLoaded', () => {
    const guideHTML = `
    <div id="userGuideOverlay" class="overlay">
        <div class="overlayContent" style="max-width: 800px; width: 90%; border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 25px; color: white; text-align: center; position: relative;">
                <h2 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">👨‍🏫 教學應用指南</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 15px;">教師課堂管理整合工具 - 核心功能與實戰心法</p>
                <button onclick="closeUserGuide()" style="position: absolute; right: 20px; top: 20px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
            </div>

            <!-- Scrollable Content -->
            <div style="max-height: 65vh; overflow-y: auto; padding: 25px 30px; background: #f8fafc; text-align: left;">
                
                <style>
                    .guide-card {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        border-left: 5px solid #6366f1;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                        transition: transform 0.2s;
                    }
                    .guide-card:hover { transform: translateY(-2px); box-shadow: 0 6px 10px -1px rgba(0,0,0,0.1); }
                    .guide-title {
                        color: #1e293b;
                        font-size: 18px;
                        font-weight: 700;
                        margin-top: 0;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .guide-content { color: #475569; font-size: 15px; line-height: 1.6; margin: 0; padding-left: 35px; }
                    .guide-content ul { padding-left: 20px; margin-top: 8px; margin-bottom: 0; }
                    .guide-content li { margin-bottom: 6px; }
                    .highlight-text { background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 13px; }
                </style>

                <div class="guide-card" style="border-left-color: #3b82f6;">
                    <h3 class="guide-title"><span>👥</span> 1. 班級建置與名單管理</h3>
                    <div class="guide-content">
                        剛接手新班級時，先在初始畫面點擊 <span class="highlight-text">➕ 新增班級</span> 建立專屬課堂。<br>
                        接著點開左側選單選擇 <span class="highlight-text">輸入學生姓名</span>，開啟學生名單管理視窗：
                        <ul>
                            <li><b>新增：</b> 在上方輸入姓名後按 Enter 逐一新增，或按 <span class="highlight-text">📋 批次新增</span> 一次貼上全班名單（可直接從 Excel 複製整欄）。</li>
                            <li><b>改名／刪除：</b> 名單中可直接修改姓名，或按 🗑️ 刪除（按 ↩️ 可復原）。改名時，該生的加扣分、點名、作業與兌獎紀錄會自動跟著搬移。</li>
                            <li>所有修改按 <span class="highlight-text">💾 儲存變更</span> 後才會生效。</li>
                        </ul>
                        系統會自動產出互動式座位表與學生圖卡，讓您立刻擁有專屬的視覺化管理介面！
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #10b981;">
                    <h3 class="guide-title"><span>⭐</span> 2. 加扣分系統與座位表 (正向增強)</h3>
                    <div class="guide-content">
                        首先，請在日曆上點擊當天的<span class="highlight-text">日期數字</span>，即可進入專屬的加扣分介面。
                        <ul>
                            <li><b>個人計分：</b> 您可以在此介面排定專屬的「座位表」，並直接點擊學生座位或圖卡上的 + / - 按鈕，快速給予分數回饋。</li>
                            <li><b>群組計分：</b> 點擊右上角的星星 ⭐ 切換為群組模式。非常適合用在「小組討論」或「秩序競賽」，點擊組別就能一次為整組加分！</li>
                        </ul>
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #f59e0b;">
                    <h3 class="guide-title"><span>✅</span> 3. 作業檢核與聯絡簿 (追蹤利器)</h3>
                    <div class="guide-content">
                        完美的作業追蹤流程：
                        <ol style="margin-top: 8px; margin-bottom: 10px; padding-left: 20px;">
                            <li>先點擊日期格中的 <span class="highlight-text">作</span> 按鈕來設定當日作業。</li>
                            <li>點擊 <span class="highlight-text">聯</span> 按鈕可開啟全屏大畫面，非常適合投影讓學生抄寫聯絡簿。</li>
                            <li>隔天收作業時，點擊 <span class="highlight-text">檢</span> 按鈕進入檢核表！</li>
                        </ol>
                        在檢核表中直接點擊學生的格子，顏色會依序變換：<br>
                        <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                            <span style="background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 4px; font-size: 12px;">灰：未開始</span>
                            <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">紅：未交</span>
                            <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">綠：已交</span>
                            <span style="background: #f97316; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">橘：待訂正</span>
                            <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">藍：已訂正</span>
                        </div>
                        <p style="margin-top: 10px; margin-bottom: 0;">這能極大化減少追作業的混亂，誰欠作業一目了然！</p>
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #8b5cf6;">
                    <h3 class="guide-title"><span>🎲</span> 4. 隨機抽籤 (活絡氣氛)</h3>
                    <div class="guide-content">
                        害怕冷場嗎？使用右上角的 <span class="highlight-text">🎲 抽籤</span> 按鈕，隨機挑選一位學生來回答問題。<br>
                        更進階的用法是「隨機抽出一個小組」來發表，讓整組產生榮譽感與連坐感，增加課堂的刺激感與專注力。
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #ec4899;">
                    <h3 class="guide-title"><span>🏆</span> 5. 兌獎系統 (動機轉換)</h3>
                    <div class="guide-content">
                        學生累積的分數可以怎麼運用？打開左側選單的 <span class="highlight-text">🏆 兌獎</span> 功能。<br>
                        您可以與學生約定各種獎勵項目（例如：10分換免死金牌、20分換優先選座位）。當學生來兌換時，直接從系統扣除點數，系統會自動幫您記錄下所有兌換歷史！
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #0ea5e9;">
                    <h3 class="guide-title"><span>📊</span> 6. 報表下載 (親師溝通)</h3>
                    <div class="guide-content">
                        <ul>
                            <li><b>下載作業清單：</b> 期中或期末時，一鍵匯出精美的 PDF。系統會列出每天的作業，並特別標註出「誰沒交」或「誰還沒訂正」，印出來給家長看非常有說服力！</li>
                            <li><b>下載加扣分總表：</b> 匯出每個學生的總得分 Word 檔。不管是打平時成績、發放期末小禮物，都能極速結算，幫您省下大量計算時間。</li>
                        </ul>
                    </div>
                </div>

                <div class="guide-card" style="border-left-color: #64748b;">
                    <h3 class="guide-title"><span>☁️</span> 7. 雲端同步與檢視／編輯模式</h3>
                    <div class="guide-content">
                        所有班級資料都存放在 Cloudflare 雲端資料庫，不論在教室或辦公室的電腦，只要開啟同一個網址，就能看到同一份資料。
                        <ul>
                            <li><b>👀 檢視模式：</b> 未輸入密碼時只能查看資料，無法修改，不怕學生亂加扣分。</li>
                            <li><b>✏️ 編輯模式：</b> 點右下角的 <span class="highlight-text">🔒</span> 浮動按鈕輸入管理密碼（第一次輸入的密碼就會成為管理密碼）。勾選「記住密碼」，這台電腦下次開啟時就不必再輸入。</li>
                            <li><b>自動存檔：</b> 編輯模式下修改資料後，約 5 秒會自動上傳到雲端，只傳有變動的部分；想立即上傳可按右下角的 <span class="highlight-text">☁️</span> 按鈕。</li>
                            <li><b>離開前鎖定：</b> 使用完教室電腦，記得點右下角的 <span class="highlight-text">✏️</span> 按鈕鎖定，回到檢視模式。</li>
                        </ul>
                    </div>
                </div>

            </div>

            <!-- Footer -->
            <div style="background: white; padding: 15px 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                <button onclick="closeUserGuide()" style="background: #4f46e5; color: white; border: none; padding: 10px 25px; border-radius: 8px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); transition: background 0.2s;">
                    我知道了，開始使用！
                </button>
            </div>

        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', guideHTML);
});

function openUserGuide() {
    document.getElementById('userGuideOverlay').style.display = 'flex';
}

function closeUserGuide() {
    document.getElementById('userGuideOverlay').style.display = 'none';
}
