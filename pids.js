    /* =========================================
       ★ PIDS 模式切換器
       ========================================= */
    function switchPidsMode(val) {
        pidsMode = val;
        const pids = document.getElementById("pidsScreen");
        const scaleWrapper = document.getElementById("pidsScaleWrapper");
        const outerContainer = document.getElementById("pidsOuterContainer");
        const sticker = document.getElementById("testSticker");
        if (!pids || !scaleWrapper) return;

        if (pidsMode === '17') {
            pids.style.width = "620px";
            pids.style.height = "387px";
            pids.style.border = "15px solid #111"; 
            pids.style.borderRadius = "16px";
            scaleWrapper.style.transform = "scale(0.7)"; 
            if (outerContainer) outerContainer.style.height = "300px"; 
            if (sticker) { sticker.style.left = "220px"; sticker.style.bottom = "-20px"; }
        } else {
            pids.style.width = "800px";
            pids.style.height = "450px";
            pids.style.border = "15px solid #111"; 
            pids.style.borderRadius = "12px";
            scaleWrapper.style.transform = "scale(0.7)"; 
            if (outerContainer) outerContainer.style.height = "350px"; 
            if (sticker) { sticker.style.left = "300px"; sticker.style.bottom = "-20px"; }
        }
        updatePidsScreen();
    }

    /* =========================================
       ★ 智能等比例縮小引擎 (防止字體變形)
       ========================================= */
    function applyAutoSqueeze() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const textElements = document.querySelectorAll('.auto-text, .auto-text-left');
          textElements.forEach(el => {
            el.style.transform = 'scale(1)';
            el.style.webkitTransform = 'scale(1)';
            void el.offsetHeight;
            const parentWidth = el.parentElement.clientWidth;
            const textWidth = el.scrollWidth;
            if (textWidth > parentWidth && textWidth > 0) {
              const ratio = (parentWidth / textWidth) * 0.96; 
              el.style.transform = `scale(${ratio})`;
              el.style.webkitTransform = `scale(${ratio})`;
            }
          });
        });
      }); 
    }

    /* =========================================
       ★ PIDS 定時器管理
       ========================================= */
    function startPidsTimers() {
        stopPidsTimers();
        pidsPageIndex = 0;
        if (currentMode === "RUNNING" && activeRouteObj) {
            if (pidsMode === '24') { renderPidsTopRow(); renderPidsMidArea(); }
            pidsMainTimer = setInterval(() => {
                let isRouteStart = (pidsCurrentIndex === 0);
                let validPages = activeRouteObj.pidsPages.filter(p => !isRouteStart || p.type === 'map');
                pidsPageIndex = (pidsPageIndex + 1) % validPages.length;
                if (pidsMode === '24') { renderPidsTopRow(); renderPidsMidArea(); }
            }, 5000);
        }
    }

    function stopPidsTimers() {
        if (pidsMainTimer) { clearInterval(pidsMainTimer); pidsMainTimer = null; }
    }

    /* =========================================
       ★ PIDS 渲染函數 (17 吋 3 站模式)
       ========================================= */
    function renderPids17Inch(text, isEng) {
        const pids = document.getElementById("pidsScreen");
        if (!activeRouteObj || !pids) return;

        let cleanText = text ? text.replace(/~/g, '').trim() : "";
        let isAlert = false;
        
        if (!isStarted && currentMode === "RUNNING") isAlert = true;
        else if (cleanText === "") isAlert = true;
        else if (currentMode !== "RUNNING") isAlert = true;
        else if (!isStarted && !isActivelyAnnouncing) isAlert = true;
        
        const normalStops = activeRouteObj.data.filter(s => {
            if (s.seq === 998 || s.seq === 999) return false;
            if (s.seq === 0 || (s.tc && s.tc.includes("歡迎乘搭"))) return false; 
            if (s.tc && s.tc.includes("多謝乘搭")) return false; 
            return true;
        });

        const currentStop = activeRouteObj.data[pidsCurrentIndex] || normalStops[0];
        const isWelcome = currentStop.seq === 0 || (currentStop.tc && currentStop.tc.includes("歡迎乘搭"));

        let stop1, stop2, stop3;
        let showArrows = true; 

        if (isWelcome) {
            stop1 = null; 
            stop2 = normalStops[0];
            stop3 = normalStops[1];
        } else {
            let safeIndex = normalStops.findIndex(s => s.seq === currentStop.seq);
            if (safeIndex === -1) safeIndex = normalStops.length > 0 ? normalStops.length - 1 : 0;
            
            stop1 = normalStops[safeIndex];
            stop2 = normalStops[safeIndex + 1];
            stop3 = normalStops[safeIndex + 2];
        }

        const getNames = (s) => {
            if (!s) return {tc: "", en: ""};
            let tc = (s.displayTc || s.pidsTc || s.tc).replace(/[>~|]/g, '').trim();
            let rawEn = (s.pidsEn || s.en).replace(/[>~|]/g, ' ').trim();
            
            let enWords = rawEn.split(' ').filter(w => w !== '');
            let en = rawEn;
            if (enWords.length > 5) {
                en = enWords.slice(0, 5).join(' ') + '<br>' + enWords.slice(5).join(' ');
            }
            
            return {tc, en};
        };

        let n1 = getNames(stop1);
        let n2 = getNames(stop2);
        let n3 = getNames(stop3);

        let dot1Html = (stop1 || isWelcome) ? `<div class="dot-current-17"></div>` : ``;
        let dot2Html = stop2 ? `<div class="dot-next-17"></div>` : ``;
        let dot3Html = stop3 ? `<div class="dot-next-17"></div>` : ``;

        let topHalfHtml = `
            <div style="display: flex; height: 50%; width: 100%; box-sizing: border-box;">
                <div style="width: 14%; height: 100%; background: #FF1E27; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #ddd; border-bottom: 3px solid #fff; box-sizing: border-box; position: relative;">
                    ${showArrows ? `
                    <div style="display: flex; flex-direction: column; position: absolute; top: 20px;">
                        <svg width="45" height="20" viewBox="0 0 30 15"><path d="M 2 2 L 15 12 L 28 2" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <svg width="45" height="20" viewBox="0 0 30 15" style="margin-top: -6px;"><path d="M 2 2 L 15 12 L 28 2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <svg width="45" height="20" viewBox="0 0 30 15" style="margin-top: -6px;"><path d="M 2 2 L 15 12 L 28 2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    ` : ``}
                    <div style="position: absolute; bottom: 50px;">${dot1Html}</div>
                </div>
                <div style="width: 86%; height: 100%; background: #fff; display: flex; flex-direction: column; justify-content: center; padding: 0 20px; overflow: hidden; box-sizing: border-box; border-bottom: 2px solid #e0e0e0;">
                   ${stop1 ? `
                   <div class="auto-box-left" style="width: 100%; margin-left: -5px; margin-bottom: -5px;"><div class="auto-text-left" style="font-size: 70px; font-family: '微軟正黑體', sans-serif; color: #000; font-weight: bold;">${n1.tc}</div></div>
                   <div class="auto-box-left" style="width: 100%; margin-left: -5px;"><div class="auto-text-left" style="font-size: 36px; font-weight: bold; font-family: Noto Sans HK, sans-serif; color: #000; text-transform: uppercase; line-height: 1.1;">${n1.en}</div></div>
                   ` : ``}
                </div>
            </div>
        `;

        let bottomHalfHtml = '';
        if (isAlert) {
            bottomHalfHtml = `
                <div style="height: 50%; width: 100%; background: #FF9800; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 5px; box-sizing: border-box; border-top: 2px solid #e0e0e0;">
                   <div class="auto-box"><div class="auto-text" style="font-size: 80px; font-family: '微軟正黑體', sans-serif; font-weight: 900; color: #000; letter-spacing: 1px;">請緊握扶手</div></div>
                   <div class="auto-box"><div class="auto-text pids-en-bold" style="font-size: 32px; font-family: Noto Sans HK, sans-serif; font-weight: normal; color: #000; line-height: 1;">Please hold the handrail</div></div>
                </div>
            `;
        } else {
            // ★ 第二、三行
            bottomHalfHtml = `
                <!-- 第二行 (下一站 25%) -->
                <div style="display: flex; height: 25%; width: 100%; box-sizing: border-box;">
                    <div style="width: 14%; height: 100%; background: #FF1E27; display: flex; align-items: center; justify-content: center; border-right: 2px solid #ddd; border-bottom: 3px solid #fff; box-sizing: border-box;">
                        ${dot2Html}
                    </div>
                    <div style="width: 86%; height: 100%; background: #fff; position: relative; overflow: hidden; box-sizing: border-box; border-bottom: 2px solid #fff;">
                       ${stop2 ? `
                       <!-- ★ 絕對定位鎖死喺 top: 5px -->
                       <div style="position: absolute; top: 0px; z-index: 10;">
                           <div class="auto-box-left" style="width: 100%; margin-left: 5px; margin-bottom: -5px;"><div class="auto-text-left" style="font-size: 48px; font-family: '微軟正黑體', sans-serif; color: #000; font-weight: bold;">${n2.tc}</div></div>
                           <div class="auto-box-left" style="width: 100%; margin-left: 5px;"><div class="auto-text-left" style="font-size: 22px; font-family: Noto Sans HK, sans-serif; color: #000; font-weight: bold; text-transform: uppercase; line-height: 1.1;">${n2.en}</div></div>
                       </div>
                       ` : ``}
                    </div>
                </div>
                <!-- 第三行 (再下一站 25%) -->
                <div style="display: flex; height: 25%; width: 100%; box-sizing: border-box;">
                    <div style="width: 14%; height: 100%; background: #FF1E27; display: flex; align-items: center; justify-content: center; border-right: 2px solid #ddd; box-sizing: border-box;">
                        ${dot3Html}
                    </div>
                    <div style="width: 86%; height: 100%; background: #fff; position: relative; overflow: hidden; box-sizing: border-box;">
                       ${stop3 ? `
                       <!-- ★ 絕對定位鎖死喺 top: 5px -->
                       <div style="position: absolute; top: 0px; z-index: 10;">
                           <div class="auto-box-left" style="width: 100%; margin-left: 5px; margin-bottom: -5px;"><div class="auto-text-left" style="font-size: 48px; font-family: '微軟正黑體', sans-serif; color: #000; font-weight: bold;">${n3.tc}</div></div>
                           <div class="auto-box-left" style="width: 100%; margin-left: 5px;"><div class="auto-text-left" style="font-size: 22px; font-family: Noto Sans HK, sans-serif; color: #000; font-weight: bold; text-transform: uppercase; line-height: 1.1;">${n3.en}</div></div>
                       </div>
                       ` : ``}
                    </div>
                </div>
            `;
        }

        pids.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #fff;">
                ${topHalfHtml}
                ${bottomHalfHtml}
            </div>
        `;
        applyAutoSqueeze();
    }

    /* =========================================
       ★ PIDS 渲染函數 (24 吋標準模式 頂部橫幅)
       ========================================= */
    function renderPidsTopRow() {
      const topRow = document.getElementById("pidsTopRow");
      if (!topRow || !activeRouteObj) return;
      
      let isRouteStart = (pidsCurrentIndex === 0);
      let validPages = activeRouteObj.pidsPages.filter(p => !isRouteStart || p.type === 'map');
      const pageInfo = validPages[pidsPageIndex];
      if (!pageInfo) return;

      let isEng = pageInfo.isEng || false;
      let routeNumScale = currentRouteKey.length >= 4 ? 'scaleX(0.85)' : 'scaleX(1)';

      const pidsArrowSvg = `
        <svg width="60" height="42" viewBox="0 0 65 48" style="margin: 0 4px 0 2px; flex-shrink: 0; filter: drop-shadow(1px 2px 1px rgba(0,0,0,0.4));">
          <g fill="#e4e8e8" stroke="#222" stroke-width="1.5" stroke-linejoin="round">
            <path d="M 2 3 L 11 3 L 24 24 L 11 45 L 2 45 L 15 24 Z" />
            <path d="M 20 3 L 29 3 L 42 24 L 29 45 L 20 45 L 33 24 Z" />
            <path d="M 38 3 L 47 3 L 60 24 L 47 45 L 38 45 L 51 24 Z" />
          </g>
        </svg>
      `;

      if (isRouteStart) {
          let isEngDest = pidsPageIndex % 2 !== 0; 
          let destText = isEngDest ? activeRouteObj.pidsDestEn.toUpperCase() : activeRouteObj.pidsDestTc;
          let routePrefix = isEngDest ? "Route" : "路線"; 
          
          topRow.innerHTML = `
              <div style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; padding: 0 25px; box-sizing: border-box; background: #000;">
                  <div style="display: flex; align-items: center; justify-content: center; max-width: 100%; flex-shrink: 1; min-width: 0;">
                      <div style="font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-size: 28px; font-weight: bold; color: white; margin-right: 12px; flex-shrink: 0;">${routePrefix}</div>
                      <div style="font-size: 55px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; margin-right: 5px; flex-shrink: 0; padding-bottom: 2px; color: white; transform: ${routeNumScale}; transform-origin: center;">${currentRouteKey}</div>
                      ${pidsArrowSvg}
                      <div style="font-size: 48px; font-weight: ${isEngDest ? '900' : 'bold'}; color: white; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; overflow: hidden; display: flex; align-items: center; justify-content: flex-start; flex-shrink: 1; min-width: 0; line-height: 1; margin-left: 10px;">
                          <div class="auto-box-left" style="width: 100%; display: flex; justify-content: flex-start;"><div class="auto-text-left" style="transform-origin: left center; display: inline-block; white-space: nowrap;">${destText}</div></div>
                      </div>
                  </div>
              </div>
          `;
          applyAutoSqueeze(); return;
      }

      if (pageInfo.type === '3grid') {
          topRow.innerHTML = `
              <div class="pids-top-left" style="flex: 0 0 33.333%; max-width: 33.333%; background: yellow; color: black;">
                  <div class="auto-box"><div class="auto-text" style="font-size: 28px; font-weight: bold; letter-spacing: 1.5px;">下一站</div></div>
                  <div class="auto-box"><div class="auto-text pids-en-bold" style="font-size: 16px;">Next stop</div></div>
              </div>
              <div class="pids-top-right" style="flex: 0 0 66.666%; max-width: 66.666%;">
                  <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; box-sizing: border-box; padding: 0 5px;">
                      <div style="display: flex; align-items: center; max-width: 100%; flex-shrink: 1;">
                          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-right: 6px; line-height: 1.1; flex-shrink: 0;">
                              <div style="font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-size: 22px; font-weight: bold;">路線</div>
                              <div style="font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-size: 20px; font-weight: bold;">Route</div>
                          </div>
                          <div style="font-size: 50px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; margin-right: 0px; flex-shrink: 0; padding-bottom: 2px; transform: ${routeNumScale}; transform-origin: center;">${currentRouteKey}</div>
                          ${pidsArrowSvg}
                          <div style="display: flex; flex-direction: column; justify-content: center; align-items: flex-start; line-height: 1.1; overflow: hidden; flex-shrink: 1; min-width: 0;">
                              <div class="auto-box-left" style="height: 50%; width: 100%;"><div class="auto-text-left" style="font-size: 34px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold;">${activeRouteObj.pidsDestTc}</div></div>
                              <div class="auto-box-left" style="height: 50%; width: 100%;"><div class="auto-text-left" style="font-size: 24px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: 900; transform-origin: left center;">${activeRouteObj.pidsDestEn.toUpperCase()}</div></div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      } else {
          let destText = isEng ? activeRouteObj.pidsDestEn.toUpperCase() : activeRouteObj.pidsDestTc;
          let routePrefix = isEng ? "Route" : "路線";
          topRow.innerHTML = `
              <div class="pids-top-left" style="flex: 0 0 20%; max-width: 20%; background: yellow; color: black;">
                  <div class="auto-box"><div class="auto-text" style="font-size: 28px; letter-spacing: 2px;">下一站</div></div>
                  <div class="auto-box"><div class="auto-text pids-en-bold" style="font-size: 16px;">Next stop</div></div>
              </div>
              <div class="pids-top-right" style="flex: 0 0 80%; max-width: 80%;">
                  <div style="display: flex; align-items: center; justify-content: flex-start; width: 100%; height: 100%; box-sizing: border-box; padding-left: 25px;">
                      <div style="font-size: 26px; font-weight: bold; margin-right: 8px; flex-shrink: 0; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif;">${routePrefix}</div>
                      <div style="font-size: 50px; font-weight: 900; margin-right: 0px; flex-shrink: 0; padding-bottom: 2px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; transform: ${routeNumScale}; transform-origin: center;">${currentRouteKey}</div>
                      ${pidsArrowSvg}
                      <div style="text-align: left; font-size: 42px; font-weight: ${isEng ? '900' : 'bold'}; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; overflow: hidden; display: flex; align-items: center; flex: 1; min-width: 0; line-height: 1;">
                          <div class="auto-box-left" style="width: 100%;"><div class="auto-text-left" style="transform-origin: left center;">${destText}</div></div>
                      </div>
                  </div>
              </div>
          `;
      }
      applyAutoSqueeze();
    }
    
    function generateMidText(rawText, isEng, isLeftBox) {
        if (!rawText) return "";
        let parts = [];
        
        if (isEng) {
            let mergedText = rawText.replace(/\|/g, ' ').trim(); 
            parts = mergedText.split(/[>~]/).map(s => s.trim()).filter(s => s); 
        } else {
            let pureText = rawText.replace(/~/g, '').trim();
            if (pureText.length <= 9) { parts = [pureText]; } 
            else {
                parts = rawText.split(/[>~]/).map(s => s.trim()).filter(s => s);
                if (parts.length >= 3) { parts = [parts[0] + parts[1], parts.slice(2).join('')]; }
            }
        }

        let baseFont = isEng ? (isLeftBox ? 26 : 22) : (isLeftBox ? 42 : 30); 
        let color = "#111"; let fw = "900"; let fontFam = "'微軟正黑體', 'Microsoft JhengHei', sans-serif"; let textClass = "auto-text"; 
        
        if (parts.length > 1) {
            let font1 = Math.floor(baseFont * 0.8); 
            return `
                <div class="auto-box" style="flex: 1; align-items: flex-end; justify-content: center; padding-bottom: 2px;"><div class="${textClass}" style="font-size: ${font1}px; font-weight: ${fw}; font-family: ${fontFam}; color: ${color}; line-height: 0.9; transform-origin: bottom center;">${parts[0]}</div></div>
                <div class="auto-box" style="flex: 1; align-items: flex-start; justify-content: center; padding-top: 2px;"><div class="${textClass}" style="font-size: ${font1}px; font-weight: ${fw}; font-family: ${fontFam}; color: ${color}; line-height: 0.9; transform-origin: top center;">${parts[1]}</div></div>
            `;
        } else {
            if (isEng) {
                return `
                    <div class="auto-box" style="flex: 1;"></div>
                    <div class="auto-box" style="flex: 1; align-items: flex-start; justify-content: center; padding-top: 2px;"><div class="${textClass}" style="font-size: ${baseFont}px; font-weight: ${fw}; font-family: ${fontFam}; color: ${color}; line-height: 0.95; transform-origin: top center;">${parts[0] || ""}</div></div>
                `;
            } else {
                return `<div class="auto-box" style="height: 100%; align-items: flex-end;"><div class="${textClass}" style="font-size: ${baseFont}px; font-weight: ${fw}; font-family: ${fontFam}; color: ${color}; line-height: 1; transform-origin: bottom center;">${parts[0] || ""}</div></div>`;
            }
        }
    }

    function renderPidsMidArea() {
      const upperArea = document.getElementById("pidsUpperArea");
      if (!upperArea || !activeRouteObj) return;

      let isRouteStart = (pidsCurrentIndex === 0);
      let validPages = activeRouteObj.pidsPages.filter(p => !isRouteStart || p.type === 'map');
      const pageInfo = validPages[pidsPageIndex];
      if (!pageInfo) return;

      const normalStops = activeRouteObj.data.filter(s => {
          if (s.seq === 998 || s.seq === 999) return false;
          if (s.tc && s.tc.includes("多謝乘搭")) return false;
          return true;
      });
      
      const currentStop = activeRouteObj.data[pidsCurrentIndex] || normalStops[0];
      let safeIndex = normalStops.findIndex(s => s.seq === currentStop.seq);
      if (safeIndex === -1) { safeIndex = normalStops.length > 0 ? normalStops.length - 1 : 0; }
      
      const actualCurrentStop = normalStops[safeIndex];

      if (pageInfo.type === '3grid') {
          const next1 = normalStops[safeIndex + 1];
          const next2 = normalStops[safeIndex + 2];
          
          const isLast0 = safeIndex === normalStops.length - 1;
          const isLast1 = next1 ? (safeIndex + 1 === normalStops.length - 1) : false;
          const isLast2 = next2 ? (safeIndex + 2 === normalStops.length - 1) : false;

          let line0Style = "left: -10px; right: -10px;";
          if (isLast0) { line0Style = (safeIndex === 0) ? "left: 50%; right: 50%;" : "left: -10px; right: 50%;"; } 
          else { if (safeIndex === 0) line0Style = "left: 50%; right: -10px;"; }

          let line1Style = "display: none;";
          if (next1) {
              if (isLast1) line1Style = "left: -10px; right: 45%;";
              else line1Style = "left: -10px; right: -10px;";
          }

          let line2Style = "display: none;";
          let termBoxHtml = "";
          if (next2) {
              if (isLast2) { line2Style = "left: -10px; right: 45%;"; termBoxHtml = ""; } 
              else {
                  line2Style = "left: -50px; right: 110px;"; 
                  termBoxHtml = `<div class="terminus-group" style="position: absolute; right: 70px; top: 49%; transform: translateY(-50%);"><div class="term-box-1"></div><div class="term-box-2"></div><div class="term-box-3"></div></div>`;
              }
          }

          const pidsCurrTc = actualCurrentStop.pidsTc || actualCurrentStop.tc;
          const pidsCurrEn = actualCurrentStop.pidsEn || actualCurrentStop.en;

          const pidsMapArrowSvg = `
             <div class="pids-arrows">
                <svg class="arr1" width="14" height="20" viewBox="0 0 14 18"><path d="M 2 2 L 9 9 L 2 16 L 5 16 L 12 9 L 5 2 Z" fill="#fff" stroke="#fff" stroke-width="1"/></svg>
                <svg class="arr2" width="14" height="20" viewBox="0 0 14 18"><path d="M 2 2 L 9 9 L 2 16 L 5 16 L 12 9 L 5 2 Z" fill="#fff" stroke="#fff" stroke-width="1"/></svg>
                <svg class="arr3" width="14" height="20" viewBox="0 0 14 18"><path d="M 2 2 L 9 9 L 2 16 L 5 16 L 12 9 L 5 2 Z" fill="#fff" stroke="#fff" stroke-width="1"/></svg>
             </div>
          `;

          let htmlMidLeft = `
            <div style="height: 52px; width: 100%; display: flex; flex-direction: column; justify-content: flex-end;">${generateMidText(pidsCurrTc, false, true)}</div>
            <div style="height: 8px; width: 100%;"></div>
            <div style="height: 40px; width: 100%; display: flex; flex-direction: column; justify-content: flex-start;">${generateMidText(pidsCurrEn, true, true)}</div>
            <div class="route-graphics">
              <div class="route-line" style="${line0Style}"></div>
              ${ (!isLast0 && safeIndex > 0) ? pidsMapArrowSvg : '' }
              <div class="dot-current-static"></div>
            </div>
          `;

          let htmlMidCenter = next1 ? `
            <div style="height: 52px; width: 100%; display: flex; flex-direction: column; justify-content: flex-end;">${generateMidText(next1.tc, false, false)}</div>
            <div style="height: 8px; width: 100%;"></div>
            <div style="height: 40px; width: 100%; display: flex; flex-direction: column; justify-content: flex-start;">${generateMidText(next1.en, true, false)}</div>
            <div class="route-graphics"><div class="route-line" style="${line1Style}"></div><div class="dot-next" style="min-width: 14px; min-height: 14px;"></div></div>
          ` : `<div style="height: 52px; width: 100%;"></div><div style="height: 12px; width: 100%;"></div><div style="height: 40px; width: 100%;"></div><div class="route-graphics"><div class="route-line" style="${line1Style}"></div></div>`;
          
          let htmlMidRight = next2 ? `
            <div style="height: 52px; width: 100%; display: flex; flex-direction: column; justify-content: flex-end;">${generateMidText(next2.tc, false, false)}</div>
            <div style="height: 8px; width: 100%;"></div>
            <div style="height: 40px; width: 100%; display: flex; flex-direction: column; justify-content: flex-start;">${generateMidText(next2.en, true, false)}</div>
            <div class="route-graphics"><div class="route-line" style="${line2Style}"></div><div class="dot-next" style="min-width: 14px; min-height: 14px;"></div>${termBoxHtml}</div>
          ` : `<div style="height: 52px; width: 100%;"></div><div style="height: 12px; width: 100%;"></div><div style="height: 40px; width: 100%;"></div><div class="route-graphics"><div class="route-line" style="${line2Style}"></div>${termBoxHtml}</div>`;

          let bgLines = `<div style="position: absolute; left: 33.333%; top: 0; bottom: 0; width: 2px; background: #ccc; z-index: 0;"></div>`;
          upperArea.innerHTML = bgLines + `<div class="pids-mid-left">${htmlMidLeft}</div><div class="pids-mid-center">${htmlMidCenter}</div><div class="pids-mid-right">${htmlMidRight}</div>`;

      } else if (pageInfo.type === 'map') {
          let stopsToRender = pageInfo.mapData;
          let isEngMap = pageInfo.isEng;
          let totalStopsInRoute = normalStops.length;
          
          let stopStart, fixedGap;
          let lenMinus1 = Math.max(1, stopsToRender.length - 1);

          if (totalStopsInRoute <= 10) { stopStart = 30; fixedGap = 40 / lenMinus1; } 
          else if (totalStopsInRoute <= 37) { stopStart = 3.5; fixedGap = 85 / lenMinus1; } 
          else {
              fixedGap = 90 / 40; 
              if (stopsToRender[0].isDummy) stopStart = 3.5 + (fixedGap * 2);
              else stopStart = 3.5;
          }

          let timelineHtml = `<div style="position: relative; width: 100%; height: 100%; display: flex; align-items: flex-end; padding: 0 0 25px 0; box-sizing: border-box;">`;

          let lastPassedIdx = -1;
          stopsToRender.forEach((s, idx) => { if (s.globalIdx < safeIndex) lastPassedIdx = idx; });

          let firstStopPos = stopStart;
          let lastStopPos = stopStart + ((stopsToRender.length - 1) * fixedGap);
          let pageLastStopGlobalIdx = stopsToRender[stopsToRender.length - 1].globalIdx;

          let hasStartDummy = stopsToRender[0].isDummy;
          let hasEndDummy = stopsToRender[stopsToRender.length - 1].isDummy;

          let firstStopLinePerc = hasStartDummy ? firstStopPos - (fixedGap * 2) : firstStopPos;
          let lastStopLinePerc = hasEndDummy ? lastStopPos + (fixedGap * 2) : lastStopPos;

          let extStart = '10px'; let extEnd = '10px';
          let splitPosPerc = stopStart;
          let isAllRed = false; let isAllGrey = false;

          if (stopsToRender.length > 0 && safeIndex > pageLastStopGlobalIdx) isAllGrey = true;
          else if (lastPassedIdx !== -1) splitPosPerc = stopStart + (lastPassedIdx * fixedGap);
          else isAllRed = true;

          let greyLeft = `calc(${firstStopLinePerc}% - ${extStart})`;
          let greyWidth = isAllGrey ? `calc((${lastStopLinePerc}% + ${extEnd}) - (${firstStopLinePerc}% - ${extStart}))` : (isAllRed ? `0px` : `calc(${splitPosPerc}% - (${firstStopLinePerc}% - ${extStart}))`);
          let redLeft = isAllRed ? `calc(${firstStopLinePerc}% - ${extStart})` : `${splitPosPerc}%`;
          let redWidth = isAllRed ? `calc((${lastStopLinePerc}% + ${extEnd}) - (${firstStopLinePerc}% - ${extStart}))` : (isAllGrey ? `0px` : `calc((${lastStopLinePerc}% + ${extEnd}) - ${splitPosPerc}%)`);

          timelineHtml += `
            <div style="position: absolute; left: ${greyLeft}; width: ${greyWidth}; height: 14px; background: #999; bottom: 38px; z-index: 1;"></div>
            <div style="position: absolute; left: ${redLeft}; width: ${redWidth}; height: 14px; background: #FF1E27; bottom: 38px; z-index: 1;"></div>
          `;

          let leftCapColor = isAllRed ? '#FF1E27' : '#999';
          if (pageInfo.pageIndex === 0) {
              timelineHtml += `
                  <div style="position: absolute; left: calc(${firstStopLinePerc}% - ${extStart}); bottom: 12px; transform: translateX(-130%); width: 10px; height: 40px; display: flex; justify-content: space-between; background: #f4f6f7; z-index: 3;">
                      <div style="width: 4px; height: 100%; border: 1px solid ${leftCapColor}; background: #f4f6f7; box-sizing: border-box;"></div>
                      <div style="width: 4px; height: 100%; border: 1px solid ${leftCapColor}; background: #f4f6f7; box-sizing: border-box;"></div>
                  </div>
              `;
          }
          if (pageInfo.pageIndex === pageInfo.totalPages - 1) {
              timelineHtml += `
                  <div style="position: absolute; left: calc(${lastStopLinePerc}% + ${extEnd}); bottom: 12px; transform: translateX(5px); width: 10px; height: 40px; display: flex; justify-content: space-between; background: #f4f6f7; z-index: 3;">
                      <div style="width: 4px; height: 100%; border: 1px solid #FF1E27; background: #f4f6f7; box-sizing: border-box;"></div>
                      <div style="width: 4px; height: 100%; border: 1px solid #FF1E27; background: #f4f6f7; box-sizing: border-box;"></div>
                  </div>
              `;
          }

          stopsToRender.forEach((stop, idx) => {
              let isPassed = stop.globalIdx < safeIndex;
              let isCurrent = !stop.isDummy && stop.globalIdx === safeIndex;
              let textColor = isPassed ? '#888' : '#111';
              let leftPos = stopStart + (idx * fixedGap);
              
              if (stop.isDummy) {
                  let isStart = (idx === 0);
                  let offset0 = isStart ? (leftPos - fixedGap * 2) : leftPos;
                  let offset1 = isStart ? (leftPos - fixedGap) : (leftPos + fixedGap);
                  let offset2 = isStart ? leftPos : (leftPos + fixedGap * 2);
                  let dotClass = isPassed ? "dot-passed" : "dot-next";
                  timelineHtml += `
                      <div class="${dotClass}" style="position: absolute; left: ${offset0}%; bottom: 45px; transform: translate(-50%, 50%); min-width: 14px; min-height: 14px; margin: 0; z-index: 2;"></div>
                      <div class="${dotClass}" style="position: absolute; left: ${offset1}%; bottom: 45px; transform: translate(-50%, 50%); min-width: 14px; min-height: 14px; margin: 0; z-index: 2;"></div>
                      <div class="${dotClass}" style="position: absolute; left: ${offset2}%; bottom: 45px; transform: translate(-50%, 50%); min-width: 14px; min-height: 14px; margin: 0; z-index: 2;"></div>
                  `;
                  let bdb = `position: absolute; bottom: 52px; transform: translateX(-50%); font-size: 20px; color: ${textColor}; line-height: 1; z-index: 2; margin: 0; padding: 0;`;
                  timelineHtml += `<div style="${bdb} left: ${offset0}%;">•</div><div style="${bdb} left: ${offset1}%;">•</div><div style="${bdb} left: ${offset2}%;">•</div>`;
              } else {
                  let dotHtml = '';
                  if (isCurrent) dotHtml = `<div class="dot-current" style="position: absolute; left: ${leftPos}%; bottom: 45px; transform: translate(-50%, 50%); z-index: 2;"></div>`;
                  else if (isPassed) dotHtml = `<div class="dot-passed" style="position: absolute; left: ${leftPos}%; bottom: 45px; transform: translate(-50%, 50%); z-index: 2;"></div>`;
                  else dotHtml = `<div class="dot-next" style="position: absolute; left: ${leftPos}%; bottom: 45px; transform: translate(-50%, 50%); z-index: 2;"></div>`;
                  
                  let stName = isEngMap ? (stop.pidsEn || stop.en) : (stop.displayTc || stop.tc);
                  stName = stName.replace(/[>~|]/g, '').trim();
                  
                  let fontWeight = isCurrent ? '900' : '500';
                  let fontStyle = `font-size: ${isEngMap ? '10px' : '14px'}; font-weight: ${fontWeight}; color: ${textColor};`;
                  let alignLeft = isEngMap ? '6px' : '6px'; let alignBottom = '55px'; let textMaxWidth = isEngMap ? '160px' : '160px';

                  timelineHtml += `
                      ${dotHtml}
                      <div style="position: absolute; left: ${leftPos}%; bottom: ${alignBottom}; z-index: 2;">
                          <div style="position: absolute; left: ${alignLeft}; bottom: 0; transform: rotate(-70deg); transform-origin: left bottom; width: ${textMaxWidth}; display: flex; align-items: flex-end; justify-content: flex-start;">
                              <div class="auto-box-left" style="width: 100%; flex-shrink: 0;"><div class="auto-text-left" style="${fontStyle}">${stName}</div></div>
                          </div>
                      </div>
                  `;
              }
          });
          timelineHtml += `</div>`;
          upperArea.innerHTML = timelineHtml;
      }
      applyAutoSqueeze();
    }

    function renderPidsLowerArea(text, isEng) {
      const lowerDiv = document.getElementById("pidsLowerArea");
      if (!lowerDiv) return;

      let cleanText = text ? text.replace(/~/g, '').trim() : "";
      let isAlert = false;
      
      if (!isStarted && currentMode === "RUNNING") isAlert = true;
      else if (cleanText === "") isAlert = true;
      else if (currentMode !== "RUNNING") isAlert = true;
      else if (!isStarted && !isActivelyAnnouncing) isAlert = true;
      
      if (isAlert) {
          lowerDiv.className = "pids-lower-row";
          lowerDiv.style.backgroundColor = "#FF9800"; 
          lowerDiv.innerHTML = `
            <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 40px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; color: #000000; letter-spacing: 1.5px; white-space: nowrap;">請緊握扶手</div></div>
            <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text pids-en-bold" style="font-size: 28px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: normal; color: #000000; letter-spacing: 1px; white-space: nowrap;">Please hold the handrail</div></div>
          `;
          return;
      }

      lowerDiv.className = "pids-lower-row";
      lowerDiv.style.backgroundColor = "#ffffff";
      
      let parts = cleanText.split('|').map(s => s.trim()); 
      let html = '';
      if (isEng) {
          if (parts.length > 1 && parts[1] !== "") {
              html = `
                <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 45px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: 900; color: #111; line-height: 1; white-space: nowrap;">${parts[0]}</div></div>
                <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 45px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: 900; color: #111; line-height: 1; white-space: nowrap;">${parts[1]}</div></div>
              `;
          } else {
              html = `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 80px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: 900; color: #111; line-height: 1; white-space: nowrap;">${parts[0] || ""}</div></div>`;
          }
      } else {
          if (parts.length > 1 && parts[1] !== "") {
              html = `
                <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 65px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; color: #111; line-height: 1; white-space: nowrap;">${parts[0]}</div></div>
                <div style="height: 50%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 65px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; color: #111; line-height: 1; white-space: nowrap;">${parts[1]}</div></div>
              `;
          } else {
              html = `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; overflow: visible;"><div class="auto-text" style="font-size: 80px; font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; font-weight: bold; color: #111; line-height: 1; white-space: nowrap;">${parts[0] || ""}</div></div>`;
          }
      }
      lowerDiv.innerHTML = html;
      applyAutoSqueeze();
    }

    function updatePidsScreen() {
      try {
          const pids = document.getElementById("pidsScreen");
          if (!pids) return;

          pids.style.display = "flex";

          if (!isPowerOn) { pids.innerHTML = `<div style="width: 100%; height: 100%; background: #000000;"></div>`; return; }

          if (currentMode === "STANDBY" || isLoading || currentMode.startsWith("SELECT") || currentMode.startsWith("F2") || currentMode.startsWith("BOOTING")) {
            pids.innerHTML = `<div style="width: 100%; height: 100%; background: #ffffff; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #222222;"><div style="font-size: 30px; font-weight: bold;">系統更新中</div><div style="font-size: 30px; font-weight: bold; margin-top: 2px;">稍後會回復正常</div></div>`;
            return;
          }

          if (currentMode === "RUNNING") {
              let initText = currentText8;
              let initIsEng = currentIsEng8;
              
              let currentStopData = activeRouteObj ? activeRouteObj.data[pidsCurrentIndex] : null;
              if (!currentStopData && activeRouteObj && activeRouteObj.data.length > 0) {
                  currentStopData = activeRouteObj.data[activeRouteObj.data.length - 1];
              }

              if (!initText && activeRouteObj && currentStopData) {
                  const pgs = getDualPages(currentStopData.tc, false, false);
                  if (pgs.length > 0) initText = pgs[0].t8;
                  initIsEng = false;
              }
              
              if (pidsMode === '17') {
                  renderPids17Inch(initText, initIsEng);
              } else {
                  if (!pids.querySelector('.pids-top-row')) {
                      let tcPart = driverTc ? `${driverTc}車長` : `車長`;
                      let enPart = driverEn ? `Bus Captain ${driverEn}` : `Bus Captain`;
                      let noPart = driverNo ? driverNo : ``;
                      pids.innerHTML = `<div class="pids-top-row" id="pidsTopRow"></div><div class="pids-mid-row" id="pidsUpperArea"></div><div class="pids-lower-row" id="pidsLowerArea"></div><div class="pids-footer">${tcPart}正為您服務  ${enPart} is serving you &nbsp;&nbsp;&nbsp; 員工編號 Staff No.: ${noPart}</div>`;
                  }
                  if (activeRouteObj) { renderPidsTopRow(); renderPidsMidArea(); renderPidsLowerArea(initText, initIsEng); }
              }
          }
      } catch (e) {
          console.error("PIDS 渲染保護機制攔截到錯誤:", e);
      }
    }
