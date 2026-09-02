/* =========================================
       ★ 手動拉 Bar 縮放引擎
       ========================================= */
    function manualZoom(value) {
      const wrapper = document.getElementById('scale-wrapper');
      const zoomText = document.getElementById('zoomValue');
      if (wrapper) wrapper.style.transform = `scale(${value})`;
      if (zoomText) zoomText.innerText = Math.round(value * 100) + '%';
    }

    function resetZoom() {
      const slider = document.getElementById('zoomSlider');
      if (slider) {
          slider.value = 1;
          manualZoom(1);
      }
    }

    /* =========================================
       全局變數宣告
       ========================================= */
    const GOOGLE_DRIVE_XLSX_ID = '1D4gTquDZD8Tb0CJ1Mhmne8eg3sFjRrml';
    const KEY_MAP = { 
      '1': ['1','A','B','C'], 
      '2': ['2','D','E','F'], 
      '3': ['3','G','H','I'], 
      '4': ['4','J','K','L'], 
      '5': ['5','M','N','O'], 
      '6': ['6','P','Q','R'], 
      '7': ['7','S','T','U'], 
      '8': ['8','V','W','X'], 
      '9': ['9','Y','Z'], 
      '0': ['0'] 
    };

    let routeKeysList = []; 
    let STATIONS_DB = {}; 
    let SEQUENCES_LIST = []; 
    let searchInput = ""; 
    let lastSearchQuery = ""; 
    let currentKeyDigit = null; 
    let currentKeyIndex = 0; 
    let multiTapTimer = null; 
    let filteredRouteKeysList = []; 
    
    let currentAudioObject = null; 
    let currentAudioResolve = null; 
    let currentSequenceToken = 0; 
    let globalAudioToken = 0;
    
    let isPowerOn = false; 
    let isLoading = false; 
    let currentMode = "STANDBY"; 
    let listNavigated = false; 
    
    let boundsList = []; 
    let typesList = []; 
    let selectedRouteIndex = 0; 
    let selectedBoundIndex = 0; 
    let selectedTypeIndex = 0;
    
    let currentRouteKey = ""; 
    let currentBoundKey = ""; 
    let currentTypeKey = ""; 
    let tempRouteKey = ""; 
    let tempBoundKey = ""; 
    let tempTypeKey = ""; 
    let remoteTempBoundKey = ""; 
    let remoteTempTypeKey = "";
    
    let activeRouteObj = null; 
    let currentIndex = 0; 
    let ledCurrentIndex = 0; 
    let animFrameId = null; 
    let timerId = null; 
    let isStarted = false; 
    let attenCodeNum = 0; 
    let lastBeepedIndex = -1;
    
    let menuMode = "NONE"; 
    let menuIndex = 0; 
    let menuList = []; 
    let isActivelyAnnouncing = false; 
    let isNoMatch = false; 
    let showRouteNotFound = false; 
    let passwordInput = ""; 
    let f2MenuIndex = 0; 
    
    let pidsMode = '24'; // ★ PIDS 模式預設 24 吋

    const f2MenuItems = ["COPY", "本機屬性", "網絡配置", "進階設定", "站點採樣", "數據上傳", "下載本字庫", "更新驅動", "精度設定", "版本序列號"];

    const bootImg1 = new Image(); bootImg1.crossOrigin = "anonymous"; bootImg1.src = "https://rrstopreporter.github.io/kmbsound_A/start1.png";
    const bootImg2 = new Image(); bootImg2.crossOrigin = "anonymous"; bootImg2.src = "https://rrstopreporter.github.io/kmbsound_A/start2.png";
    const bootAudio = new Audio("https://rrstopreporter.github.io/kmbsound_A/start_sound.wav");
    const sectBeepAudio = new Audio("https://rrstopreporter.github.io/kmbsound_A/beep.wav");

    /* ★ PIDS 獨立定時器及狀態變數 */
    let pidsCurrentIndex = 0; 
    let pidsPageIndex = 0;
    let pidsMainTimer = null; 
    
    /* ★ 車長資料 */
    let driverTc = "";
    let driverEn = "";
    let driverNo = "";

    const ANIM_SCROLL_MS = 650; 
    const AUDIO_DELAY_MS = 2400; 
    const POST_AUDIO_HOLD_MS = 0; 
    const SPECIAL_AUDIO_DELAY_MS = 1000; 
    const SPECIAL_POST_HOLD_MS = 0; 
    const STANDBY_PAGE_HOLD_MS = 3500;  
    const TRANSITION_MS_8 = 1500; 
    const TRANSITION_MS_6 = 3500; 
    
    const globalAudioPlayer = new Audio(); 
    globalAudioPlayer.setAttribute('playsinline', '');

    function unlockIosAudio() { 
      globalAudioPlayer.play().then(() => { 
        globalAudioPlayer.pause(); 
      }).catch(err => {}); 
      document.removeEventListener('touchstart', unlockIosAudio); 
      document.removeEventListener('click', unlockIosAudio); 
    }
    
    document.addEventListener('touchstart', unlockIosAudio, { once: true }); 
    document.addEventListener('click', unlockIosAudio, { once: true });

    /* =========================================
       ★ 存檔系統
       ========================================= */
    function saveState() {
      try {
        if (currentMode === "RUNNING" && activeRouteObj) {
          const frame = document.getElementById('storageIframe');
          if (frame && frame.contentWindow) {
              frame.contentWindow.postMessage({
                  action: 'save',
                  route: currentRouteKey,
                  bound: currentBoundKey,
                  type: currentTypeKey,
                  index: currentIndex
              }, '*');
          }
          
          pendingSavedState = {
              route: currentRouteKey,
              bound: currentBoundKey,
              type: currentTypeKey,
              index: currentIndex
          };
          
          const params = new URLSearchParams(window.location.search);
          params.set('route', currentRouteKey);
          params.set('bound', currentBoundKey);
          params.set('type', currentTypeKey);
          params.set('index', currentIndex);
          window.history.replaceState(null, '', window.location.pathname + '?' + params.toString());
        }
      } catch (e) { 
        console.warn("Save state failed:", e); 
      }
    }

    function clearState() {
      try {
        const frame = document.getElementById('storageIframe');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ action: 'clear' }, '*');
        }
        pendingSavedState = null;
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) { 
        console.warn("Clear state failed:", e); 
      }
    }

    function applyDriverInfo() {
        let rawTc = document.getElementById('inputDriverTc').value.trim();
        let rawEn = document.getElementById('inputDriverEn').value.trim();
        let rawNo = document.getElementById('inputDriverNo').value.trim();

        const badWords = ['屌', '閪', '撚', '柒', '笨', 'FUCK', 'SHIT', 'BITCH'];
        const containsBadWord = (text) => badWords.some(word => text.toUpperCase().includes(word));

        if (containsBadWord(rawTc) || containsBadWord(rawEn)) { alert("請勿輸入不當字眼！"); return; }
        if (rawTc && !/^[\u4e00-\u9fa5]{1,2}$/.test(rawTc)) { alert("中文姓氏只能輸入 1-2 個中文字！"); return; }
        if (rawEn && !/^[A-Za-z\s]+$/.test(rawEn)) { alert("英文姓氏只能輸入英文字母！"); return; }
        if (rawNo && !/^\d+$/.test(rawNo)) { alert("員工編號只能輸入數字！"); return; }

        driverTc = rawTc; driverEn = rawEn; driverNo = rawNo;

        let pids = document.getElementById('pidsScreen');
        if (pids && pids.innerHTML !== "") {
            pids.innerHTML = "";
            updatePidsScreen();
        }
    }

    /* =========================================
       實體鍵盤對應
       ========================================= */
    document.addEventListener('keydown', function(event) {
      const blockedKeys = ['F1', 'F2', 'F3', 'F4']; 
      if (blockedKeys.includes(event.key)) event.preventDefault();
      
      if (!isPowerOn || currentMode.startsWith("BOOTING")) return;
      
      const isRemoteStop = event.code === 'Numpad3'; 
      const isPanelDown = event.key === 'ArrowDown'; 
      const isPanelF1 = event.key === 'F1';
      
      if (currentMode === "RUNNING" && isActivelyAnnouncing) { 
        if (!isRemoteStop && !isPanelDown && !isPanelF1) { 
          event.preventDefault(); 
          return; 
        } 
      }
      
      if (event.key === 'F1') return pressF1(); 
      if (event.key === 'F2') return pressF2(); 
      if (event.key === 'F3') return pressReplay(); 
      if (event.key === 'F4') return pressF4();

      const isAdd = event.code === 'NumpadAdd' || event.key === '+'; 
      const isSub = event.code === 'NumpadSubtract' || event.key === '-'; 
      const isMul = event.code === 'NumpadMultiply' || event.key === '*'; 
      const isDiv = event.code === 'NumpadDivide' || event.key === '/'; 
      const isRemoteEnter = event.code === 'NumpadEnter';
      
      if (isAdd) return adjustAttenCode(1); 
      if (isSub) return adjustAttenCode(-1); 
      if (isMul) return adjustAttenCode(10); 
      if (isDiv) { event.preventDefault(); return adjustAttenCode(-10); }

      if (currentMode === "F2_PASSWORD" && event.code.startsWith('Numpad') && /^[0-9]$/.test(event.key)) { 
        event.preventDefault(); return pressMultiTap(event.key); 
      }
      
      if (event.code === 'Numpad8') { event.preventDefault(); if (menuMode !== "NONE") pressMenuUp(); else pressSkip(1); return; }
      if (event.code === 'Numpad5') { event.preventDefault(); if (menuMode !== "NONE") pressMenuDown(); else pressSkip(-1); return; }
      if (event.code === 'Numpad0') { event.preventDefault(); if (menuMode !== "NONE") pressMenuEnter(); else pressAnnounce(true); return; }
      if (event.code === 'Numpad7') { event.preventDefault(); pressDirectionMenu(); return; }
      if (event.code === 'Numpad9') { event.preventDefault(); return pressRemoteRefresh(); }     
      if (event.code === 'Numpad1') { event.preventDefault(); return pressReplay(); }              
      if (isRemoteStop) { event.preventDefault(); return pressStopPlayback(); }        
      if (isRemoteEnter) { event.preventDefault(); return pressPassengerAtten(); } 

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); return pressArrow(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); return pressArrow(1); }
      if (isPanelDown) { event.preventDefault(); return pressDownArrow(); }
      if (event.key === 'Enter' && !isRemoteEnter) { event.preventDefault(); return pressEnter(); }
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); return pressClear(); }
      
      if (event.code.startsWith('Digit') && /^[0-9]$/.test(event.key)) return pressMultiTap(event.key);

      if (/^[a-zA-Z]$/.test(event.key) && currentMode === "SELECT_ROUTE") {
        event.preventDefault(); 
        commitMultiTap();
        if (searchInput.length >= 4) searchInput = searchInput.slice(0, 3);
        searchInput += event.key.toUpperCase(); 
        listNavigated = false; 
        updateFilteredRoutes(); 
        updateScreens(); 
        return;
      }
    });
    
    async function pressRemoteRefresh() { 
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
      isLoading = true; updateScreens(); 
      await fetchExcelFromDrive(); 
      isLoading = false; updateScreens(); 
    }

    /* =========================================
       ★ 數據處理函數 (加強版多重重試防護)
       ========================================= */
    const formatStopNum = num => String(num).padStart(3, '0'); 
    const formatAttenNum = num => String(num).padStart(2, '0');
    
    function getDualPages(textStr, isEnglish = false, isSpecial = false) {
      if (!textStr) return [{ t8: "", t6: "" }];
      
      const str = String(textStr);
      const hasGreater = str.includes('>');
      const hasTilde = str.includes('~');
      const hasPipe = str.includes('|');
      const hasBoth = hasGreater && hasTilde; 
      
      let finalPages = [];

      if (isEnglish) {
        const rawPages = str.split('>');
        for (let i = 0; i < rawPages.length; i++) {
          let mp = rawPages[i].trim();
          if (mp === "") continue;

          if (mp.includes('~')) {
            let t8Str = mp.replace(/~/g, '');
            let t6Str = mp.replace(/~/g, '|');
            finalPages.push({ t8: t8Str, t6: t6Str });
          } else {
            finalPages.push({ t8: mp, t6: mp });
          }
        }
      } else {
        let rawPages = [];
        let separator = '';
        
        if (hasPipe) { rawPages = str.split('|'); separator = '|'; } 
        else { rawPages = str.split('>'); separator = '>'; }

        for (let i = 0; i < rawPages.length; i++) {
          let mp = rawPages[i].trim();
          if (mp === "") continue;

          if (mp.includes('~')) {
            const subPages = mp.split('~').map(p => p.trim());
            const joined8 = subPages.join(''); 
            for (let j = 0; j < subPages.length; j++) {
              let sp = subPages[j];
              if (sp !== "") {
                if (!isSpecial && !hasBoth) {
                  if (separator === '|' && i === 0 && j === 0) sp += " "; 
                  if (j === 1) sp += " "; 
                }
                finalPages.push({ t8: joined8, t6: sp });
              }
            }
          } else {
            let sp = mp;
            if (!isSpecial && !hasBoth) {
               if (separator === '|' && i === 0) sp += " ";
            }
            finalPages.push({ t8: mp, t6: sp });
          }
        }
      }
      return finalPages.length > 0 ? finalPages : [{ t8: str, t6: str }];
    }

    let excelFetchPromise = null;
    async function fetchExcelFromDrive() {
      if (excelFetchPromise) return excelFetchPromise;
      
      excelFetchPromise = (async () => {
          const targetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_DRIVE_XLSX_ID}/export?format=xlsx`;
          const proxyList = [ 
            targetUrl, 
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, 
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` 
          ];
          
          // ★ 最多自動重試 3 次，徹底解決偶爾讀唔到數據嘅問題
          for (let attempt = 1; attempt <= 3; attempt++) {
              for (let url of proxyList) {
                try {
                  const fetchUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
                  const response = await fetch(fetchUrl); 
                  if (!response.ok) continue;
                  
                  const arrayBuffer = await response.arrayBuffer(); 
                  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
                  
                  if (workbook.SheetNames.includes("Stops")) {
                    STATIONS_DB = {}; 
                    XLSX.utils.sheet_to_json(workbook.Sheets["Stops"]).forEach(row => {
                      let sId = row.stop_id || row.stopid || row.STOP_ID || row.STOPID || row['車站編號'];
                      if (sId) {
                        STATIONS_DB[String(sId).trim()] = { 
                          tc: String(row.name_tc || row.NAME_TC || row['中文站名'] || ""), 
                          en: String(row.name_en || row.NAME_EN || row['英文站名'] || ""), 
                          pth: String(row.name_pth || row.NAME_PTH || row['普通話站名'] || row['拼音'] || ""), 
                          audioTc: String(row.audio_tc || row.AUDIO_TC || row['廣播中文'] || ""), 
                          audioEn: String(row.audio_en || row.AUDIO_EN || row['廣播英文'] || ""), 
                          audioPth: String(row.audio_pth || row.AUDIO_PTH || row['廣播普通話'] || "") 
                        };
                      }
                    });
                  }
                  
                  if (workbook.SheetNames.includes("Routes")) {
                    routeKeysList = []; 
                    XLSX.utils.sheet_to_json(workbook.Sheets["Routes"]).forEach(row => {
                      const rCode = row.route || row.ROUTE || row['路線'] || row['路線號碼'] || row[Object.keys(row)[0]];
                      if (rCode && !routeKeysList.includes(String(rCode).trim())) {
                          routeKeysList.push(String(rCode).trim());
                      }
                    });
                  }
                  
                  if (workbook.SheetNames.includes("Sequences")) { 
                      SEQUENCES_LIST = XLSX.utils.sheet_to_json(workbook.Sheets["Sequences"]); 
                  }
                  
                  updateScreens(); 
                  return true; 
                } catch (err) { 
                    console.warn(`Excel Load Attempt ${attempt} Fail via ${url}:`, err); 
                }
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const screenContent = document.getElementById("screenContent");
          if (screenContent) {
              screenContent.innerHTML = `<div style="color: red; font-size: 14px; font-weight: bold;">數據載入失敗！<br>請按面板「更新」掣重試</div>`;
          }
          return false;
      })();
      
      const result = await excelFetchPromise;
      if (!result) excelFetchPromise = null; // 如果失敗就允許再試
      return result;
    }

    function getStopsAudioData(stopId) { 
      const dbObj = STATIONS_DB[String(stopId).trim()] || {}; 
      return { 
          tc: dbObj.tc || "", en: dbObj.en || "", pth: dbObj.pth || "", 
          audioTc: dbObj.audioTc || "", audioEn: dbObj.audioEn || "", audioPth: dbObj.audioPth || "" 
      }; 
    }

    function buildRouteData(routeKey, boundKey, typeKey) {
      const rawRows = SEQUENCES_LIST.filter(item => { 
        return String(item.ROUTE || item.route || item['路線'] || "").trim() === routeKey && 
               String(item.BOUND || item.bound || item['方向'] || "").trim() === boundKey && 
               String(item.type || item.TYPE || item['屬性'] || "正常").trim() === typeKey; 
      });
      
      if (rawRows.length === 0) return { 
          dest: boundKey || "終點站", destEn: "TERMINUS", pidsDestTc: boundKey, pidsDestEn: "TERMINUS", 
          type: typeKey, data: [{ tc: "無數據", en: "NO DATA", pth: "", pre: [], post: [], pidsTc: "無數據", pidsEn: "NO DATA" }], pidsPages: [] 
      };
      
      const processedStops = []; 
      let pendingPre = []; 
      
      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]; 
        const seqNum = Number(row.seq || row.SEQ || row['站序'] || row['站號'] || 0); 
        const stopId = String(row.stopid || row.stop_id || row.STOPID || row.STOP_ID || row['車站編號'] || "").trim();
        
        let dbObj = getStopsAudioData(stopId); 
        let rawTc = row.name_tc ?? row.NAME_TC ?? row['中文站名'] ?? dbObj.tc; 
        let rawEn = row.name_en ?? row.NAME_EN ?? row['英文站名'] ?? dbObj.en; 
        let rawPth = row.name_pth ?? row.NAME_PTH ?? row['普通話站名'] ?? dbObj.pth; 
        
        if (i === 0 && rawTc !== undefined && String(rawTc).includes("歡迎乘搭")) { rawTc = dbObj.tc || rawTc; }
        
        let itemData = { 
          seq: seqNum, stopId: stopId, 
          tc: (rawTc !== undefined ? String(rawTc) : "").trim(), en: (rawEn !== undefined ? String(rawEn) : ""), pth: (rawPth !== undefined ? String(rawPth) : ""), 
          audioTc: row.audio_tc || row.AUDIO_TC || row['廣播中文'] || dbObj.audioTc || "", 
          audioEn: row.audio_en || row.AUDIO_EN || row['廣播英文'] || dbObj.audioEn || "", 
          audioPth: row.audio_pth || row.AUDIO_PTH || row['廣播普通話'] || dbObj.audioPth || "",
          pidsTc: (rawTc !== undefined ? String(rawTc) : "").trim(), pidsEn: (rawEn !== undefined ? String(rawEn) : "")
        };

        if (i === 0) {
          const seq0Row = rawRows.find(r => Number(r.seq || r.SEQ || r['站序'] || 0) === 0);
          const startIdRaw = seq0Row ? String(seq0Row.stopid || seq0Row.stop_id || seq0Row.STOPID || seq0Row['車站編號'] || "").trim() : "";
          let baseStopId = startIdRaw.length >= 10 ? startIdRaw.substring(0, 10) : startIdRaw;
          if (baseStopId) {
              const startDbObj = getStopsAudioData(baseStopId);
              if (startDbObj.tc) { itemData.pidsTc = startDbObj.tc; itemData.pidsEn = startDbObj.en; }
          }
        }
        
        if (seqNum === 998) { pendingPre.push(itemData); } 
        else if (seqNum === 999) { 
            if (processedStops.length > 0) processedStops[processedStops.length - 1].post.push(itemData); 
            else pendingPre.push(itemData); 
        } else { 
            itemData.pre = [...pendingPre]; itemData.post = []; 
            processedStops.push(itemData); pendingPre = []; 
        }
      }
      
      let destEn = "TERMINUS"; let pidsDestTc = boundKey; let pidsDestEn = "TERMINUS";
      if (processedStops.length > 0) { 
        destEn = processedStops[processedStops.length - 1].en.replace(/>/g, '').replace(/~/g, '');
        if (processedStops.length >= 2) {
          const secondToLast = processedStops[processedStops.length - 2];
          pidsDestTc = secondToLast.tc.replace(/>/g, '').replace(/~/g, '').split('|').join('');
          pidsDestEn = secondToLast.en.replace(/>/g, '').replace(/~/g, '').split('|').join(' ');
        } else if (processedStops.length === 1) {
          const last = processedStops[processedStops.length - 1];
          pidsDestTc = last.tc.replace(/>/g, '').replace(/~/g, '').split('|').join('');
          pidsDestEn = last.en.replace(/>/g, '').replace(/~/g, '').split('|').join(' ');
        }
      }

      let normalStops = processedStops.filter(s => {
          if (s.seq === 998 || s.seq === 999) return false;
          if (s.tc && s.tc.includes("多謝乘搭")) return false;
          return true;
      });
      
      let allMapStops = normalStops.map((s, i) => ({...s, globalIdx: i}));
      if (allMapStops.length > 0) allMapStops[0].displayTc = allMapStops[0].pidsTc || allMapStops[0].tc;
      
      let tcMaps = []; let enMaps = []; let total = allMapStops.length; const MAX_STOPS_PER_PAGE = 37; 
      if (total <= MAX_STOPS_PER_PAGE) { tcMaps.push(allMapStops); enMaps.push(allMapStops); } 
      else {
          let i = 0;
          while (i < total) {
              let isFirst = i === 0; let remaining = total - i; let chunk = [];
              if (isFirst) {
                  chunk = allMapStops.slice(0, MAX_STOPS_PER_PAGE);
                  chunk.push({ isDummy: true, dummyText: '•', globalIdx: MAX_STOPS_PER_PAGE - 0.5 });
                  i = MAX_STOPS_PER_PAGE;
              } else {
                  chunk.push({ isDummy: true, dummyText: '•', globalIdx: i - 0.5 });
                  if (remaining > MAX_STOPS_PER_PAGE) {
                      chunk = chunk.concat(allMapStops.slice(i, i + MAX_STOPS_PER_PAGE - 1));
                      chunk.push({ isDummy: true, dummyText: '•', globalIdx: i + MAX_STOPS_PER_PAGE - 1.5 });
                      i += MAX_STOPS_PER_PAGE - 1;
                  } else {
                      chunk = chunk.concat(allMapStops.slice(i)); i = total;
                  }
              }
              tcMaps.push(chunk); enMaps.push(chunk);
          }
      }

      let pidsPages = [];
      pidsPages.push({ type: '3grid' });
      for (let i = 0; i < tcMaps.length; i++) { pidsPages.push({ type: 'map', isEng: false, mapData: tcMaps[i], pageIndex: i, totalPages: tcMaps.length }); }
      for (let i = 0; i < enMaps.length; i++) { pidsPages.push({ type: 'map', isEng: true, mapData: enMaps[i], pageIndex: i, totalPages: enMaps.length }); }

      return { dest: boundKey, destEn: destEn, pidsDestTc, pidsDestEn, type: typeKey, data: processedStops, pidsPages };
    }

    function getBoundsForRoute(routeKey) { 
      const bounds = []; 
      SEQUENCES_LIST.forEach(item => { 
        if (String(item.ROUTE || item.route || item['路線'] || "").trim() === routeKey) { 
          const bVal = String(item.BOUND || item.bound || item['方向'] || "").trim(); 
          if (bVal && !bounds.includes(bVal)) bounds.push(bVal); 
        } 
      }); 
      return bounds.length > 0 ? bounds : ["無方向數據"]; 
    }

    function getTypesForRouteAndBound(routeKey, boundKey) { 
      const types = []; 
      SEQUENCES_LIST.forEach(item => { 
        if (String(item.ROUTE || item.route || item['路線'] || "").trim() === routeKey && String(item.BOUND || item.bound || item['方向'] || "").trim() === boundKey) { 
          const tVal = String(item.type || item.TYPE || item['屬性'] || "正常").trim(); 
          if (tVal && !types.includes(tVal)) types.push(tVal); 
        } 
      }); 
      return types.length > 0 ? types : ["正常"]; 
    }

    /* =========================================
       主 LED (8字) 與 側牌 (6字) 雙屏幕同步引擎
       ========================================= */
    const canvas = document.getElementById('ledCanvas'); 
    const ctx = canvas.getContext('2d', { alpha: false }); 
    const bgCanvas = document.createElement('canvas'); 
    bgCanvas.width = 1024; bgCanvas.height = 128; 
    const bgCtx = bgCanvas.getContext('2d', { alpha: false }); 
    const textCanvas = document.createElement('canvas'); 
    textCanvas.width = 1024; textCanvas.height = 128; 
    const textCtx = textCanvas.getContext('2d'); 

    const sideCanvas = document.getElementById('sideCanvas'); 
    const sideCtx = sideCanvas ? sideCanvas.getContext('2d', { alpha: false }) : null;
    const sideBgCanvas = document.createElement('canvas'); 
    sideBgCanvas.width = 768; sideBgCanvas.height = 128; 
    const sideBgCtx = sideBgCanvas.getContext('2d', { alpha: false }); 
    const sideTextCanvas = document.createElement('canvas'); 
    sideTextCanvas.width = 768; sideTextCanvas.height = 128; 
    const sideTextCtx = sideTextCanvas.getContext('2d'); 

    let currentText8 = null; let currentText6 = null; 
    let currentIsEng8 = null; let currentIsEng6 = null; 
    let currentRenderedMatrix8 = null; let currentRenderedMatrix6 = null;

    bgCtx.fillStyle = "#020202"; bgCtx.fillRect(0, 0, 1024, 128); bgCtx.fillStyle = "#180e00"; 
    for (let r = 0; r < 16; r++) { for (let c = 0; c < 128; c++) { bgCtx.beginPath(); bgCtx.arc(c * 8 + 4, r * 8 + 4, 3.3, 0, Math.PI * 2); bgCtx.fill(); } }
    
    if (sideBgCtx) {
      sideBgCtx.fillStyle = "#020202"; sideBgCtx.fillRect(0, 0, 768, 128); sideBgCtx.fillStyle = "#180e00"; 
      for (let r = 0; r < 16; r++) { for (let c = 0; c < 96; c++) { sideBgCtx.beginPath(); sideBgCtx.arc(c * 8 + 4, r * 8 + 4, 3.3, 0, Math.PI * 2); sideBgCtx.fill(); } }
    }

    function drawDirectLedGrid(matrix8, matrix6, offsetY8 = 0, offsetY6 = 0) {
      if (matrix8 !== undefined && matrix8 !== currentRenderedMatrix8) { 
        textCtx.clearRect(0, 0, 1024, 128); 
        if (matrix8) { 
          textCtx.fillStyle = "#ffc600"; textCtx.shadowColor = "#ffaa00"; textCtx.shadowBlur = 4; 
          for (let r = 0; r < 16; r++) { 
            const rowStr = matrix8[r]; if (!rowStr) continue; 
            for (let c = 0; c < 128; c++) { 
              if (rowStr[c] === '1') { textCtx.beginPath(); textCtx.arc(c * 8 + 4, r * 8 + 4, 3.3, 0, Math.PI * 2); textCtx.fill(); } 
            }
          } 
        } 
        currentRenderedMatrix8 = matrix8; 
      }
      
      if (matrix6 !== undefined && matrix6 !== currentRenderedMatrix6) {
        if (sideTextCtx) {
          sideTextCtx.clearRect(0, 0, 768, 128); 
          if (matrix6) {
            sideTextCtx.fillStyle = "#ff9900"; sideTextCtx.shadowColor = "#e65c00"; sideTextCtx.shadowBlur = 4; 
            for (let r = 0; r < 16; r++) { 
              const rowStr = matrix6[r]; if (!rowStr) continue; 
              for (let c = 0; c < 96; c++) { 
                if (rowStr[c + 16] === '1') { sideTextCtx.beginPath(); sideTextCtx.arc(c * 8 + 4, r * 8 + 4, 3.3, 0, Math.PI * 2); sideTextCtx.fill(); } 
              }
            }
          }
        }
        currentRenderedMatrix6 = matrix6;
      }
      
      ctx.drawImage(bgCanvas, 0, 0); ctx.drawImage(textCanvas, 0, offsetY8 * 8); 
      if (sideCtx) { sideCtx.drawImage(sideBgCanvas, 0, 0); sideCtx.drawImage(sideTextCanvas, 0, offsetY6 * 8); }
    }

    function animateScrollIn(pageObj, isEnglish = false, token) {
      return new Promise(resolve => {
        if (!isPowerOn || (token !== undefined && token !== currentSequenceToken)) return resolve();
        clearAllTimers(); 
        
        const isEng8 = pageObj.isEng8 !== undefined ? pageObj.isEng8 : isEnglish;
        const isEng6 = pageObj.isEng6 !== undefined ? pageObj.isEng6 : isEnglish;

        let processText8 = pageObj.t8 || "";
        if (isEng8) processText8 = processText8.split('|').map(line => line.length % 2 === 0 ? line + " " : line).join('|');

        let processText6 = pageObj.t6 || "";
        if (isEng6) processText6 = processText6.split('|').map(line => line.substring(0, 16)).join('|');

        const animate8 = (currentText8 !== processText8 || currentIsEng8 !== isEng8);
        const animate6 = (currentText6 !== processText6 || currentIsEng6 !== isEng6);

        const mx8 = renderTextTo16x128Matrix(processText8, isEng8, false); 
        const mx6 = renderTextTo16x128Matrix(processText6, isEng6, true); 
        
        if (!animate8 && !animate6) { 
            drawDirectLedGrid(mx8, mx6, 0, 0); 
            setTimeout(() => {
                if (isPowerOn && (token === undefined || token === currentSequenceToken)) {
                    if (pidsMode === '19') renderPids19Inch(pageObj.t8, isEng8);
                    else renderPidsLowerArea(pageObj.t8, isEng8);
                }
            }, 100);
            return resolve(); 
        }

        const duration8 = 650; const duration6 = 850; 
        const actualMax = Math.max(animate8 ? duration8 : 0, animate6 ? duration6 : 0); 
        const startOffset = 16; let startTime = null;
        
        function step(currentTime) {
          if (!isPowerOn || (token !== undefined && token !== currentSequenceToken)) return resolve();
          if (!startTime) startTime = currentTime; 
          const elapsed = currentTime - startTime;
          
          if (elapsed >= actualMax) { 
            drawDirectLedGrid(mx8, mx6, 0, 0); 
            currentText8 = processText8; currentText6 = processText6; currentIsEng8 = isEng8; currentIsEng6 = isEng6; 
            setTimeout(() => {
                if (isPowerOn && (token === undefined || token === currentSequenceToken)) {
                    if (pidsMode === '19') renderPids19Inch(pageObj.t8, isEng8);
                    else renderPidsLowerArea(pageObj.t8, isEng8);
                }
            }, 150);
            resolve(); 
          } else { 
            const progress8 = Math.min(elapsed / duration8, 1); const progress6 = Math.min(elapsed / duration6, 1); 
            const currentOffset8 = startOffset * (1 - progress8); const currentOffset6 = startOffset * (1 - progress6); 
            const off8 = animate8 ? Math.floor(currentOffset8) : 0; const off6 = animate6 ? Math.floor(currentOffset6) : 0;
            drawDirectLedGrid(mx8, mx6, off8, off6); animFrameId = requestAnimationFrame(step); 
          }
        }
        animFrameId = requestAnimationFrame(step);
      });
    }

    function renderTextTo16x128Matrix(textStr, isEnglish = false, isSideScreen = false) {
      const fullMatrix = Array(16).fill("0".repeat(128)); 
      if (!textStr || textStr.trim() === "") return fullMatrix; 
      
      let safeText = textStr || ""; 
      if (!isEnglish) safeText = safeText.replace(/\|/g, ''); 
      const lines = safeText.split('|'); 
      
      if (lines.length > 1) {
        const m1 = renderSingleLineToRows(lines[0], true, isEnglish); 
        const m2 = renderSingleLineToRows(lines[1], true, isEnglish); 
        
        let finalX1 = Math.max(0, Math.floor((128 - m1.width) / 2)); 
        let finalX2 = Math.max(0, Math.floor((128 - m2.width) / 2));
        
        if (isSideScreen && !isEnglish) {
          if (m1.width > 96) finalX1 = 16;
          if (m2.width > 96) finalX2 = 16;
        }
        
        for (let r = 0; r < 7; r++) { 
          const r1 = m1.rows[r] || "0".repeat(m1.width); const r2 = m2.rows[r] || "0".repeat(m2.width); 
          fullMatrix[r] = fullMatrix[r].substring(0, finalX1) + r1 + fullMatrix[r].substring(finalX1 + r1.length); 
          fullMatrix[r+8] = fullMatrix[r+8].substring(0, finalX2) + r2 + fullMatrix[r+8].substring(finalX2 + r2.length); 
        }
      } else {
        const m = renderSingleLineToRows(lines[0], false, isEnglish); 
        let sx = Math.max(0, Math.floor((128 - m.width) / 2));
        if (isSideScreen && !isEnglish) { if (m.width > 96) sx = 16; }
        for (let r = 0; r < 16; r++) { 
          const rStr = m.rows[r] || "0".repeat(m.width); 
          fullMatrix[r] = fullMatrix[r].substring(0, sx) + rStr + fullMatrix[r].substring(sx + rStr.length); 
        }
      }
      return fullMatrix;
    }

    function renderSingleLineToRows(textStr, isDoubleLine = false, isEnglish = false) {
      const chars = textStr.split(''); const glyphs = []; let totalW = 0;
      for (let i = 0; i < chars.length; i++) { 
        const cd = getCharBitsFromTextMap(chars[i], isDoubleLine, isEnglish); 
        const rows = [...cd.rows]; let w = cd.width; 
        if (w < 16 && i < chars.length - 1) { 
            for (let r = 0; r < (isDoubleLine ? 7 : 16); r++) { rows[r] = (rows[r] || "0".repeat(w)) + "0"; } w++; 
        } 
        glyphs.push({ width: w, rows: rows }); totalW += w; 
      }
      const tr = isDoubleLine ? 7 : 16; const finalRows = Array(tr).fill(""); 
      for (let r = 0; r < tr; r++) { for (let g of glyphs) { finalRows[r] += g.rows[r] || "0".repeat(g.width); } }
      return { rows: finalRows, width: totalW };
    }

    function getCharBitsFromTextMap(char, isDoubleLine = false, isEnglish = false) {
      if (!isEnglish) { 
        if (typeof fontTextMap !== 'undefined' && fontTextMap[char]) { 
            const glyph = fontTextMap[char]; 
            return Array.isArray(glyph) ? { width: 16, rows: glyph } : { width: glyph.width || 16, rows: glyph.rows }; 
        } 
        return { width: 8, rows: Array(isDoubleLine ? 7 : 16).fill("00000000") }; 
      } else { 
        const targetChar = String(char); 
        if (typeof EN_FONT_DB !== 'undefined' && EN_FONT_DB[targetChar]) { 
            const raw5x7 = EN_FONT_DB[targetChar]; 
            if (isDoubleLine) return { width: 5, rows: raw5x7 }; 
            else return { width: 5, rows: ["00000", "00000", "00000", "00000", ...raw5x7, "00000", "00000", "00000", "00000", "00000"] }; 
        } 
        if (targetChar === ' ') return { width: 4, rows: Array(isDoubleLine ? 7 : 16).fill("0000") }; 
        return { width: 5, rows: Array(isDoubleLine ? 7 : 16).fill("00000") }; 
      }
    }

    /* =========================================
       遙控器小屏幕渲染引擎
       ========================================= */
    const remoteCanvas = document.getElementById('remoteCanvas'); const remoteCtx = remoteCanvas.getContext('2d');
    function setupHDCanvas() { remoteCanvas.width = 112; remoteCanvas.height = 156; remoteCtx.resetTransform(); }
    
    function drawRemoteScreen(linesData) {
      setupHDCanvas(); remoteCtx.fillStyle = "#050500"; remoteCtx.fillRect(0, 0, remoteCanvas.width, remoteCanvas.height); let currentY = 2; 
      linesData.forEach((item) => {
        const text = item.text || ""; const inverted = item.inverted || false; const align = item.align || "left"; 
        const baseBgColor = item.bgColor || null; const baseTextColor = item.textColor || "#ffeb3b";
        let textW = 0; 
        for (let i = 0; i < text.length; i++) { textW += (getCharBitsFromTextMap(text[i], false, false).width || 16) + 1; } 
        if (textW > 0) textW -= 1;
        
        let currentX = 2; if (align === "center") currentX = Math.floor((remoteCanvas.width - textW) / 2);
        if (inverted && text.length > 0) { remoteCtx.fillStyle = "#0000ff"; remoteCtx.fillRect(currentX - 2, currentY - 1, textW + 4, 18); } 
        else if (baseBgColor && text.length > 0) { remoteCtx.fillStyle = baseBgColor; remoteCtx.fillRect(currentX - 2, currentY - 1, textW + 4, 18); }
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i]; const glyph = getCharBitsFromTextMap(char, false, false); 
          const glyphRows = glyph.rows; const glyphWidth = glyph.width || 16;
          if (currentX > remoteCanvas.width) break; 
          for (let r = 0; r < 16; r++) { 
              const rowStr = glyphRows[r] || "0".repeat(glyphWidth); 
              for (let c = 0; c < glyphWidth; c++) { 
                  if (rowStr[c] === '1') { remoteCtx.fillStyle = inverted ? "#ffffff" : baseTextColor; remoteCtx.fillRect(currentX + c, currentY + r, 1, 1); } 
              } 
          } 
          currentX += glyphWidth + 1; 
        } 
        currentY += 17; 
      });
    }

    function drawRemoteImage(imgObj) {
        setupHDCanvas(); remoteCtx.fillStyle = "#050500"; remoteCtx.fillRect(0, 0, remoteCanvas.width, remoteCanvas.height);
        if (imgObj.complete && imgObj.naturalWidth > 0) { remoteCtx.drawImage(imgObj, 0, 0, remoteCanvas.width, remoteCanvas.height); } 
        else { imgObj.onload = () => { remoteCtx.drawImage(imgObj, 0, 0, remoteCanvas.width, remoteCanvas.height); }; }
    }

    /* =========================================
       UI 與輸入狀態更新
       ========================================= */
    function getDisplaySearchString() { return currentKeyDigit !== null ? searchInput + KEY_MAP[currentKeyDigit][currentKeyIndex] : searchInput; }
    
    function updateFilteredRoutes() { 
      showRouteNotFound = false; const q = getDisplaySearchString().toLowerCase(); filteredRouteKeysList = [...routeKeysList]; 
      if (q !== lastSearchQuery) { 
        lastSearchQuery = q; 
        if (q) { 
          const matchIndex = filteredRouteKeysList.findIndex(r => r.toLowerCase().startsWith(q)); 
          if (matchIndex !== -1) { selectedRouteIndex = matchIndex; isNoMatch = false; } 
          else { isNoMatch = true; } 
        } else { selectedRouteIndex = 0; isNoMatch = false; } 
      } 
    }
    
    function commitMultiTap() { 
        if (multiTapTimer) { clearTimeout(multiTapTimer); multiTapTimer = null; } 
        if (currentKeyDigit !== null) { searchInput += KEY_MAP[currentKeyDigit][currentKeyIndex]; currentKeyDigit = null; currentKeyIndex = 0; } 
    }
    
    function adjustAttenCode(delta) { 
      if (!isPowerOn || isLoading) return; 
      if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
      let tens = Math.floor(attenCodeNum / 10); let units = attenCodeNum % 10; 
      if (Math.abs(delta) === 10) { tens = (tens + (delta > 0 ? 1 : -1) + 10) % 10; } 
      else if (Math.abs(delta) === 1) { units = (units + (delta > 0 ? 1 : -1) + 10) % 10; }
      attenCodeNum = tens * 10 + units; updateScreens(); 
    }

    function getRemoteLinesData() {
      if (menuMode === "DIR_MENU") { 
          let lines = [{text:""}, {text:"選擇行車方向"}, {text:""}]; 
          menuList.forEach((item, idx) => { lines.push({text: item, inverted: idx === menuIndex}); if (idx < menuList.length - 1) lines.push({text:""}); }); 
          return lines; 
      } else if (menuMode === "TYPE_MENU") { 
          let lines = [{text:""}, {text:"選擇服務類別"}, {text:""}]; 
          menuList.forEach((item, idx) => { lines.push({text: item, inverted: idx === menuIndex}); }); 
          return lines; 
      }
      
      const attStr = formatAttenNum(attenCodeNum); const attenData = getStopsAudioData(`ATTEN10${attStr}0`); 
      const line7 = ` 通告:${attStr}`; let line8 = "", line9 = "";
      if (attenData && attenData.tc) { const pgs = getDualPages(attenData.tc, false, true); line8 = pgs.length > 0 ? pgs[0].t8 : ""; line9 = pgs.length > 1 ? pgs[1].t8 : ""; }
      
      if (activeRouteObj && activeRouteObj.data && currentMode !== "STANDBY") {
        const stop = activeRouteObj.data[currentIndex]; 
        let cleanName = stop && stop.tc ? stop.tc.replace(/[>~|]/g, '') : ""; 
        let nameL1 = cleanName.length > 6 ? cleanName.substring(0, 6) : cleanName; let nameL2 = cleanName.length > 6 ? cleanName.substring(6) : "";
        return [ 
            { text: ` 路:${currentRouteKey}` }, { text: activeRouteObj.dest }, { text: activeRouteObj.type }, 
            { text: ` 下一站:${formatStopNum(currentIndex)}` }, { text: nameL1 }, { text: nameL2 }, { text: line7 }, { text: line8 }, { text: line9 } 
        ];
      } else {
        return [ { text: ` 路:` }, { text: "" }, { text: "" }, { text: ` 下一站:` }, { text: "" }, { text: "" }, { text: line7 }, { text: line8 }, { text: line9 } ];
      }
    }

    function buildRadioList(list, selectedIdx) {
      let itemsHtml = ''; const getCircle = (idx) => idx === selectedIdx ? `<span class="radio-circle" style="font-size: 12px;">◉</span>` : `<span class="radio-circle" style="font-size: 10px;">○</span>`; 
      let st = 0; let ed = list.length; 
      if (list.length > 5) { st = Math.max(0, selectedIdx - 2); if (st + 5 > list.length) st = list.length - 5; ed = st + 5; }
      const displayCount = ed - st; let rowGap = '2px'; 
      if (displayCount === 2) rowGap = '23px'; else if (displayCount === 3) rowGap = '14px'; else if (displayCount === 4) rowGap = '10px'; 
      for (let i = st; i < ed; i++) { 
          const activeClass = i === selectedIdx ? ' selected' : ''; 
          itemsHtml += `<div class="route-ui-radio-item${activeClass}">${getCircle(i)} <span class="radio-text">${list[i]}</span></div>`; 
      }
      return `<div style="position: absolute; top: 11px; bottom: 6px; left: 2px; right: 4px; display: flex; flex-direction: column; justify-content: center; gap: ${rowGap};">${itemsHtml}</div>`;
    }   

    /* =========================================
       主畫面更新邏輯 (UI 介面)
       ========================================= */
    function updateScreens() {
      try {
          const screen = document.getElementById("dduScreen"); 
          const content = document.getElementById("screenContent"); 
          const verFooter = document.getElementById("versionFooter"); 
          const dbInitMsg = document.getElementById("dbInitMsg"); 
          const pwrLed = document.getElementById("pwrLed"); 
          const sdLed = document.getElementById("sdLed"); 
          const pwrSwitch = document.getElementById("pwrSwitch");
          
          if (!isPowerOn) {
            screen.classList.remove("on"); pwrLed.classList.remove("on"); if(sdLed) sdLed.classList.remove("on"); 
            if(pwrSwitch) { pwrSwitch.classList.remove("on"); pwrSwitch.classList.add("off"); }
            content.innerHTML = ""; remoteCtx.fillStyle = "#000"; remoteCtx.fillRect(0, 0, remoteCanvas.width, remoteCanvas.height); 
            if(verFooter) verFooter.style.display = "none"; 
            updatePidsScreen(); return;
          }
          
          screen.classList.add("on"); pwrLed.classList.add("on"); 
          if(pwrSwitch) { pwrSwitch.classList.remove("off"); pwrSwitch.classList.add("on"); }
          if(sdLed) { (routeKeysList.length > 0 && !isLoading) ? sdLed.classList.add("on") : sdLed.classList.remove("on"); }

          if (currentMode === "BOOTING_1" || currentMode === "BOOTING_2") {
              if (currentMode === "BOOTING_1") { content.innerHTML = `<img src="${bootImg1.src}" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; z-index: 10; border-radius: 4px;" />`; } 
              else { content.innerHTML = `<img src="${bootImg2.src}" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; z-index: 10; border-radius: 4px;" />`; }
              drawRemoteScreen([ { text: "" }, { text: "(V2.0.5)", align: "center", bgColor: "#0000ff", textColor: "#ffffff" }, { text: "" }, { text: "Connecting BSAS", align: "left", textColor: "#ffeb3b" } ]); 
              if(verFooter) verFooter.style.display = "none"; updatePidsScreen(); return;
          }

          if (isLoading) { 
              content.innerHTML = ``; drawRemoteScreen([ { text: "" }, { text: "(V2.0.5)", align: "center", bgColor: "#0000ff", textColor: "#ffffff" }, { text: "" }, { text: "Connecting BSAS", align: "left", textColor: "#ffeb3b" } ]); 
              if(verFooter) verFooter.style.display = "none"; updatePidsScreen(); return; 
          }

          if (currentMode === "STANDBY" || currentMode === "RUNNING") { 
              if(verFooter) verFooter.style.display = "block"; if(dbInitMsg) dbInitMsg.style.display = (currentMode === "STANDBY") ? "block" : "none"; 
          } else { if(verFooter) verFooter.style.display = "none"; }

          if (currentMode === "STANDBY") {
            content.innerHTML = `<div class="screen-line">路線:</div><div class="screen-line">開往:</div><div class="screen-line">屬性:</div><div class="screen-line">下一站:</div><div class="screen-line"></div>`; 
            drawRemoteScreen(getRemoteLinesData());
          } else if (currentMode === "SELECT_ROUTE") {
            let q = getDisplaySearchString(); let listHtml = '';
            if (showRouteNotFound) { listHtml = `<div class="route-ui-list"><div class="route-ui-item" style="color:#d32f2f;">線路不存在</div></div>`; } 
            else { 
              let lHtml = ''; 
              if (isNoMatch && q !== "") { lHtml = `<div class="route-ui-item">${q}</div>`; } 
              else { const st = selectedRouteIndex; const ed = Math.min(filteredRouteKeysList.length, st + 5); for (let i = st; i < ed; i++) { lHtml += `<div class="route-ui-item" style="padding: 0 4px;">${filteredRouteKeysList[i]}</div>`; } } 
              listHtml = `<div class="route-ui-list">${lHtml}</div>`; 
            }
            content.innerHTML = `<div class="route-ui-container"><div class="route-ui-title">輸入路線編號</div><div class="route-ui-input">${q}</div>${listHtml}</div>`; 
            drawRemoteScreen(getRemoteLinesData());
          } else if (currentMode === "SELECT_BOUND") {
            content.innerHTML = `<fieldset class="route-ui-fieldset"><legend class="route-ui-legend">選擇行車方向</legend>${buildRadioList(boundsList, selectedBoundIndex)}</fieldset>`; 
            drawRemoteScreen(getRemoteLinesData());
          } else if (currentMode === "SELECT_TYPE") {
            content.innerHTML = `<fieldset class="route-ui-fieldset"><legend class="route-ui-legend">選擇服務類別</legend>${buildRadioList(typesList, selectedTypeIndex)}</fieldset>`; 
            drawRemoteScreen(getRemoteLinesData());
          } else if (currentMode === "RUNNING" || menuMode === "DIR_MENU") {
            const stop = (activeRouteObj && activeRouteObj.data) ? activeRouteObj.data[currentIndex] : null; 
            
            let cleanName = stop && stop.tc ? stop.tc.replace(/[>~|]/g, '') : "";
            const destText = activeRouteObj ? activeRouteObj.dest : "";
            const typeText = activeRouteObj ? activeRouteObj.type : "";

            content.innerHTML = `<div class="screen-line">路線: ${currentRouteKey}</div><div class="screen-line">開往: ${destText}</div><div class="screen-line">屬性: ${typeText}</div><div class="screen-line">下一站:  ${formatStopNum(currentIndex)}</div><div class="screen-line stop-name">${cleanName}</div>`; 
            drawRemoteScreen(getRemoteLinesData());
          } else if (currentMode === "F2_PASSWORD") {
            const displayPwd = "●".repeat(passwordInput.length);
            content.innerHTML = `<div style="display: flex; flex-direction: column; height: 100%; padding: 0px;"><div style="flex-grow: 1; display: flex; align-items: center; justify-content: flex-start; padding-left: 4px; font-size: 14px; font-weight: bold; letter-spacing: 1px;">請輸入密碼</div><div style="background-color: #ffffff; border: 1px solid #111; height: 20px; display: flex; align-items: center; padding: 0 4px; font-size: 10px; color: #111; letter-spacing: 4px;">${displayPwd}</div></div>`; 
            drawRemoteScreen([{ text: "" }, { text: "輸入密碼", align: "center" }]);
          } else if (currentMode === "F2_MENU") {
            let f2MenuHtml = ''; 
            for (let i = 0; i < f2MenuItems.length; i++) { 
                const isSel = (i === f2MenuIndex); const circle = isSel ? '◉' : '○'; 
                f2MenuHtml += `<div style="font-size: 16px; color: #111; display: flex; align-items: center; gap: 2px; row-gap: 6px; white-space: nowrap;"><span style="font-size: 9px; margin-top: -1px;">${circle}</span> ${f2MenuItems[i]}</div>`; 
            }
            content.innerHTML = `<fieldset class="route-ui-fieldset" style="margin: 0; padding: 2px 4px; height: 100%;"><legend class="route-ui-legend" style="font-size: 20px; font-weight: bold; margin-left: 2px; padding: 2px 4px;">功能</legend><div style="display: grid; grid-template-columns: 80px 1fr; grid-template-rows: repeat(5, 1fr); grid-auto-flow: column; row-gap: 3px; column-gap: 4px; padding: 6px 0 0 4px;">${f2MenuHtml}</div></fieldset>`; 
            drawRemoteScreen([{ text: "" }, { text: "功能選單", align: "center" }]);
          }
          
          const lockTargetBtns = document.querySelectorAll('.btn, .remote-btn');
                lockTargetBtns.forEach(btn => {
                    btn.style.pointerEvents = isRestoringMemory ? 'none' : 'auto';
          });
          
          updatePidsScreen();
      } catch (err) {
          console.error("主畫面更新錯誤:", err);
      }
    }

    /* =========================================
       音效播放引擎 
       ========================================= */
    const delay = (ms, token) => new Promise(resolve => {
      if (!isPowerOn || (token !== undefined && token !== currentSequenceToken)) return resolve();
      let elapsed = 0; const step = 50;
      const timer = setInterval(() => { 
          elapsed += step; 
          if (!isPowerOn || (token !== undefined && token !== currentSequenceToken) || elapsed >= ms) { clearInterval(timer); resolve(); } 
      }, step);
    });

    function clearAllTimers() { 
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; } 
        if (timerId) { clearTimeout(timerId); timerId = null; } 
    }
    
    function stopAllAudio() { 
        globalAudioToken++; 
        if (currentAudioObject) { currentAudioObject.pause(); currentAudioObject.onended = null; currentAudioObject.onerror = null; currentAudioObject = null; } 
        if (currentAudioResolve) { currentAudioResolve({ played: false, duration: 0 }); currentAudioResolve = null; } 
    }
    
    function stopAll() { 
        clearAllTimers(); stopAllAudio(); currentSequenceToken++; isActivelyAnnouncing = false; 
        currentText8 = null; currentText6 = null; currentIsEng8 = null; currentIsEng6 = null; 
        drawDirectLedGrid(null, null, 0, 0); 
    }

    function playAudioFile(audioUrl, token) {
      return new Promise(resolve => {
        if (currentAudioObject) { currentAudioObject.pause(); currentAudioObject.onended = null; currentAudioObject.onerror = null; currentAudioObject = null; }
        if (currentAudioResolve) { currentAudioResolve({ played: false, duration: 0 }); currentAudioResolve = null; }
        currentAudioResolve = resolve;

        if (!audioUrl || !audioUrl.trim()) { currentAudioResolve = null; return resolve({ played: false, duration: 0 }); }
        
        let u = audioUrl.trim();
        if (u.includes('github.com') && u.includes('/blob/')) u = u.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        else if (u.includes('1drv.ms/u/c/')) u = u.replace('1drv.ms/u/c/', 'onedrive.live.com/download?cid=');
        else if (u.includes('onedrive.live.com')) u = u.replace('/redir?', '/download?').replace('/embed?', '/download?');
        else if (u.includes('dropbox.com')) u = u.replace('dl=0', 'raw=1');
        else if (!u.startsWith('http')) u = `https://docs.google.com/uc?export=open&id=${u}`;

        const attemptPlay = (testUrl, isFallback = false) => {
          if (token !== globalAudioToken) return resolve({ played: false, duration: 0 });
          
          const au = globalAudioPlayer; currentAudioObject = au; let hasFallbackTriggered = false; au.onended = null; au.onerror = null;
          au.onended = () => { 
              if (token !== globalAudioToken) return resolve({ played: false, duration: 0 }); 
              let dur = au.duration || 0; currentAudioObject = null; 
              if (currentAudioResolve) { currentAudioResolve({ played: true, duration: dur }); currentAudioResolve = null; } 
          };
          
          const handleFailure = () => {
            if (token !== globalAudioToken) return resolve({ played: false, duration: 0 }); 
            if (hasFallbackTriggered) return; 
            hasFallbackTriggered = true;
            if (!isFallback) { 
                let fb = null; 
                if (testUrl.endsWith('.mp3')) fb = testUrl.slice(0, -4) + '.MP3'; 
                else if (testUrl.endsWith('.MP3')) fb = testUrl.slice(0, -4) + '.mp3'; 
                else if (testUrl.endsWith('.wav')) fb = testUrl.slice(0, -4) + '.WAV'; 
                else if (testUrl.endsWith('.WAV')) fb = testUrl.slice(0, -4) + '.wav'; 
                if (fb) return attemptPlay(fb, true); 
            }
            currentAudioObject = null; 
            if (currentAudioResolve) { currentAudioResolve({ played: false, duration: 0 }); currentAudioResolve = null; } 
          };
          
          au.onerror = handleFailure; au.src = testUrl; au.load(); 
          const playPromise = au.play(); 
          if (playPromise !== undefined) { playPromise.catch((err) => handleFailure()); }
        };
        attemptPlay(u); 
      });
    }

    async function playPhaseMultiPage(rawText, isEnglish, audioId, myToken, enableAudio = true, isSpecial = false) {
      if (!isPowerOn || myToken !== currentSequenceToken) return false; 
      if (rawText === "" && (!audioId || !audioId.trim())) return true;
      
      const pages = getDualPages(rawText, isEnglish, isSpecial); 
      const hasAudio = !!(audioId && audioId.trim());
      const currentDelay = isSpecial ? SPECIAL_AUDIO_DELAY_MS : AUDIO_DELAY_MS; 
      const currentHold = isSpecial ? SPECIAL_POST_HOLD_MS : POST_AUDIO_HOLD_MS;
      
      let audioPromise = (async () => {
        if (!enableAudio || !hasAudio) return { played: false, duration: 0 }; 
        if (currentDelay > 0) await delay(currentDelay, myToken); 
        if (!isPowerOn || myToken !== currentSequenceToken) return { played: false, duration: 0 }; 
        return await playAudioFile(audioId, globalAudioToken);
      })();
      
      await animateScrollIn(pages[0], isEnglish, myToken);
      if (pages.length === 1) { 
          let audioResult = await audioPromise; 
          if (!isPowerOn || myToken !== currentSequenceToken) return false; 
          let isZeroAudio = audioResult && audioResult.played && audioResult.duration < 0.1; 
          if (hasAudio && !isZeroAudio) await delay(currentHold, myToken); 
          return true; 
      }
      
      for (let i = 1; i < pages.length; i++) { 
          if (myToken !== currentSequenceToken) return false; 
          await delay(1500, myToken);  
          if (myToken !== currentSequenceToken) return false; 
          await animateScrollIn(pages[i], isEnglish, myToken); 
      }
      
      let audioResult = await audioPromise;
      if (myToken === currentSequenceToken) { 
          let isZeroAudio = audioResult && audioResult.played && audioResult.duration < 0.1; 
          if (hasAudio && !isZeroAudio) await delay(currentHold, myToken); 
          return true; 
      }
      return false;
    }

    async function runDisplayLoop(stopData, myToken) {
      const isSpecial = (stopData.seq === 999);
      const tPgs = getDualPages(stopData.tc, false, isSpecial);
      const ePgs = getDualPages(stopData.en, true, isSpecial);

      function buildTimeline(pages, isEng, transMs) {
        let uniquePages = []; 
        for (let i = 0; i < pages.length; i++) { if (i === 0 || pages[i] !== pages[i - 1]) uniquePages.push(pages[i]); }
        let seq = []; 
        for (let i = 0; i < uniquePages.length; i++) { seq.push({ text: uniquePages[i], isEng: isEng, holdTime: (i === uniquePages.length - 1) ? STANDBY_PAGE_HOLD_MS : transMs }); }
        return seq;
      }

      const seq8_E = buildTimeline(ePgs.map(p => p.t8), true, TRANSITION_MS_8); const seq8_C = buildTimeline(tPgs.map(p => p.t8), false, TRANSITION_MS_8); const seq8 = [...seq8_E, ...seq8_C];
      const seq6_E = buildTimeline(ePgs.map(p => p.t6), true, TRANSITION_MS_6); const seq6_C = buildTimeline(tPgs.map(p => p.t6), false, TRANSITION_MS_6); const seq6 = [...seq6_E, ...seq6_C];

      let idx8 = 0; let idx6 = 0; let time8 = seq8[0].holdTime; let time6 = seq6[0].holdTime; let currentTime = 0;
      await animateScrollIn({ t8: seq8[0].text, isEng8: seq8[0].isEng, t6: seq6[0].text, isEng6: seq6[0].isEng }, false, myToken);

      while (isPowerOn && myToken === currentSequenceToken) {
        let nextEventTime = Math.min(time8, time6); let wait = nextEventTime - currentTime;
        if (wait > 0) { await delay(wait, myToken); if (!isPowerOn || myToken !== currentSequenceToken) return; currentTime += wait; }

        let update8 = false; let update6 = false;
        if (currentTime >= time8) { idx8 = (idx8 + 1) % seq8.length; time8 += seq8[idx8].holdTime; update8 = true; }
        if (currentTime >= time6) { idx6 = (idx6 + 1) % seq6.length; time6 += seq6[idx6].holdTime; update6 = true; }

        if (update8 || update6) { await animateScrollIn({ t8: seq8[idx8].text, isEng8: seq8[idx8].isEng, t6: seq6[idx6].text, isEng6: seq6[idx6].isEng }, false, myToken); }
      }
    }

    async function playAnnouncementPhase(itemData, myToken, isSpecial = false) {
      if (itemData.stopId && itemData.stopId.trim().toUpperCase() === 'SECT100010') {
          if (lastBeepedIndex !== currentIndex) {
              sectBeepAudio.currentTime = 0; sectBeepAudio.play().catch(e => console.warn(e)); lastBeepedIndex = currentIndex; 
          }
      }

      if (!(await playPhaseMultiPage(itemData.tc, false, itemData.audioTc, myToken, true, isSpecial))) return false;
      if (!(await playPhaseMultiPage(itemData.en, true, itemData.audioEn, myToken, true, isSpecial))) return false;
      
      const hasPthText = itemData.pth && itemData.pth.trim() !== ""; const hasPthAudio = itemData.audioPth && itemData.audioPth.trim() !== "";
      if (hasPthText || hasPthAudio) { 
          const pthText = hasPthText ? itemData.pth : itemData.tc; 
          if (!(await playPhaseMultiPage(pthText, false, itemData.audioPth, myToken, true, isSpecial))) return false; 
      }
      return true;
    }

    /* =========================================
       按鈕操作邏輯
       ========================================= */
    async function pressPassengerAtten() {
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
      
      const attStr = formatAttenNum(attenCodeNum); const attenObj = getStopsAudioData(`ATTEN10${attStr}0`); 
      if (!attenObj.tc && !attenObj.audioTc) return;
      
      stopAllAudio(); currentSequenceToken++; const myToken = currentSequenceToken; isActivelyAnnouncing = true; 
      const played = await playAnnouncementPhase(attenObj, myToken, true, true);
      
      if (myToken === currentSequenceToken) { 
          isActivelyAnnouncing = false; 
          if (played && currentMode === "RUNNING") {
              if (currentIndex > 0 || (activeRouteObj && activeRouteObj.hasPlayed000)) { isStarted = true; }
              resumeDisplayLoopNoAudio(); 
          }
      }
    }

    function resumeDisplayLoopNoAudio() { 
        if (!isPowerOn || !activeRouteObj) return; 
        stopAll(); runDisplayLoop(activeRouteObj.data[ledCurrentIndex], currentSequenceToken); 
    }

    async function togglePower() {
      stopAll(); stopPidsTimers(); isPowerOn = !isPowerOn;
      
      if (isPowerOn) {
      	isRestoringMemory = true;
        bootAudio.load(); sectBeepAudio.load();

        const myToken = currentSequenceToken; drawDirectLedGrid(null, null, 0, 0); 
        currentText8 = "        "; currentText6 = "        "; currentIsEng8 = false; currentIsEng6 = false;
        
        currentMode = "BOOTING_1"; updateScreens(); await new Promise(resolve => setTimeout(resolve, 3000)); 
        if (!isPowerOn || currentSequenceToken !== myToken) return;
        
        currentMode = "BOOTING_2"; updateScreens();

        const mx8_blank = renderTextTo16x128Matrix("        ", false); const mx6_loading = renderTextTo16x128Matrix("Loading", false); 
        drawDirectLedGrid(mx8_blank, mx6_loading, 0, 0); currentText6 = "Loading";
        
        // ★ 確保 Excel 數據完全加載完畢，未載好前不跳出開機畫面
        if (routeKeysList.length === 0) { 
            isLoading = true; 
            await fetchExcelFromDrive(); 
            isLoading = false; 
        } else { 
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
        if (!isPowerOn || currentSequenceToken !== myToken) return;
        
        await animateScrollIn({t8: "        ", t6: "V-170110  "}, false, myToken); await new Promise(resolve => setTimeout(resolve, 1000)); 
        if (!isPowerOn || currentSequenceToken !== myToken) return;
        
        currentText8 = "        "; currentText6 = "V-170110  "; currentIsEng8 = false; currentIsEng6 = false;
        
        await animateScrollIn({t8: "────────", t6: "V-170110  "}, false, myToken); await new Promise(resolve => setTimeout(resolve, 700)); 
        if (!isPowerOn || currentSequenceToken !== myToken) return;
        
        await animateScrollIn({t8: "────────", t6: "──────"}, false, myToken);
        
        searchInput = ""; currentKeyDigit = null; lastSearchQuery = ""; 

        // ★ 1. 開機動畫播完，強制入 STANDBY 畫面
        currentMode = "STANDBY"; 
        updateScreens();
        
        // ★ 加返開機 BEEP 聲 + 啟動長聲
        sectBeepAudio.currentTime = 0;
        sectBeepAudio.play().catch(e => console.warn(e));
        
        bootAudio.currentTime = 0;
        bootAudio.play().catch(e => console.warn("Boot audio play failed:", e));
        
        // ★ 2. 停頓 3 秒鐘 (畫面停留 3 秒)
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (!isPowerOn || currentSequenceToken !== myToken) return; 
        
        // ★ 3. 三秒後檢查有無 Save Record，有就自動還原進度
        if (pendingSavedState && pendingSavedState.route) {
            currentRouteKey = pendingSavedState.route;
            currentBoundKey = pendingSavedState.bound || "";
            currentTypeKey = pendingSavedState.type || "正常";
            currentIndex = parseInt(pendingSavedState.index || "0", 10);
            ledCurrentIndex = currentIndex;
            pidsCurrentIndex = currentIndex;
            
            boundsList = getBoundsForRoute(currentRouteKey);
            typesList = getTypesForRouteAndBound(currentRouteKey, currentBoundKey);
            activeRouteObj = buildRouteData(currentRouteKey, currentBoundKey, currentTypeKey);
            
            currentMode = "RUNNING";
            isStarted = currentIndex > 0;

            if (currentIndex >= activeRouteObj.data.length - 1 && activeRouteObj.data.length > 0) {
                menuMode = "DIR_MENU";
                menuList = boundsList;
                menuIndex = menuList.indexOf(currentBoundKey);
                if (menuIndex === -1) menuIndex = 0;
            } else {
                menuMode = "NONE";
            }
            
            // ★ 1. 有記憶：先解鎖，後更新畫面！
            isRestoringMemory = false; 
            updateScreens(); 
            startPidsTimers(); 
            resumeDisplayLoopNoAudio();
        } else {
            // ★ 2. 無記憶 (初次開機)：都要解鎖兼更新畫面！
            isRestoringMemory = false;
            updateScreens();
        }

      } else { 
        isRestoringMemory = false; // ★ 3. 啪掣熄機：立刻解鎖！
        currentMode = "STANDBY"; 
        updateScreens(); 
      }
    }

    function pressF1() { 
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      stopPidsTimers(); currentMode = "SELECT_ROUTE"; searchInput = ""; currentKeyDigit = null; lastSearchQuery = ""; 
      selectedRouteIndex = 0; attenCodeNum = 0; lastBeepedIndex = -1; isNoMatch = false; showRouteNotFound = false; listNavigated = false; 
      updateFilteredRoutes(); updateScreens(); 
    }
    
    function pressF2() { 
        if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
        if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
        stopPidsTimers(); currentMode = "F2_PASSWORD"; passwordInput = ""; f2MenuIndex = 0; updateScreens(); 
    }
    
    function pressF4() {
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (menuMode !== "NONE") { menuMode = "NONE"; updateScreens(); return; }
      if (currentMode === "F2_PASSWORD" || currentMode === "F2_MENU") { 
          if (activeRouteObj) { currentMode = "RUNNING"; startPidsTimers(); } else { currentMode = "STANDBY"; }
          updateScreens(); return; 
      }
      if (currentMode === "SELECT_TYPE") { currentMode = "SELECT_BOUND"; updateScreens(); } 
      else if (currentMode === "SELECT_BOUND") { currentMode = "SELECT_ROUTE"; listNavigated = false; updateScreens(); } 
      else if (currentMode === "SELECT_ROUTE") { 
          if (activeRouteObj) { currentMode = "RUNNING"; startPidsTimers(); } else { currentMode = "STANDBY"; } updateScreens(); 
      }
    }

    function pressMultiTap(digit) { 
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "F2_PASSWORD") { if (passwordInput.length < 10) passwordInput += digit; updateScreens(); return; }
      if (currentMode !== "SELECT_ROUTE") return; 
      
      if (currentKeyDigit === digit) { currentKeyIndex = (currentKeyIndex + 1) % KEY_MAP[digit].length; } 
      else { 
          commitMultiTap(); if (searchInput.length >= 4) searchInput = searchInput.slice(0, 3); 
          currentKeyDigit = digit; currentKeyIndex = 0; 
      } 
      listNavigated = false;
      
      if (multiTapTimer) clearTimeout(multiTapTimer); 
      multiTapTimer = setTimeout(() => { commitMultiTap(); updateFilteredRoutes(); updateScreens(); }, 800); 
      updateFilteredRoutes(); updateScreens(); 
    }

    function pressClear() { 
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "RUNNING") return; 
      
      if (currentMode === "F2_PASSWORD") { if (passwordInput.length > 0) { passwordInput = passwordInput.slice(0, -1); updateScreens(); } return; }
      if (currentMode === "SELECT_BOUND" || currentMode === "SELECT_TYPE") return;
      
      if (currentMode === "SELECT_ROUTE") { 
        if (multiTapTimer) { clearTimeout(multiTapTimer); multiTapTimer = null; } 
        if (currentKeyDigit !== null) { currentKeyDigit = null; currentKeyIndex = 0; } 
        else if (searchInput.length > 0) { searchInput = searchInput.slice(0, -1); }
        listNavigated = false; updateFilteredRoutes(); updateScreens(); 
      } else { 
        stopAll(); stopPidsTimers(); isPowerOn = true; currentMode = "STANDBY"; attenCodeNum = 0; lastBeepedIndex = -1;
        animateScrollIn({t8: "────────", t6: "──────"}, false, currentSequenceToken); updateScreens(); 
      } 
    }
    
    function pressArrow(dir) {
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
      
      if (currentMode === "SELECT_ROUTE") { 
        commitMultiTap(); 
        if (filteredRouteKeysList.length > 0) { 
            if (!listNavigated) { listNavigated = true; if (dir !== 1) selectedRouteIndex = (selectedRouteIndex + dir + filteredRouteKeysList.length) % filteredRouteKeysList.length; } 
            else { selectedRouteIndex = (selectedRouteIndex + dir + filteredRouteKeysList.length) % filteredRouteKeysList.length; }
            searchInput = filteredRouteKeysList[selectedRouteIndex]; lastSearchQuery = searchInput.toLowerCase(); 
            isNoMatch = false; showRouteNotFound = false; updateScreens(); 
        } 
      } 
      else if (currentMode === "SELECT_BOUND") { selectedBoundIndex = (selectedBoundIndex + dir + boundsList.length) % boundsList.length; updateScreens(); } 
      else if (currentMode === "SELECT_TYPE") { selectedTypeIndex = (selectedTypeIndex + dir + typesList.length) % typesList.length; updateScreens(); }
      else if (currentMode === "F2_MENU") { 
          f2MenuIndex += dir; if (f2MenuIndex < 0) f2MenuIndex = 0; else if (f2MenuIndex >= f2MenuItems.length) f2MenuIndex = f2MenuItems.length - 1; 
          updateScreens(); 
      }
    }

    function pressDownArrow() { 
        if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
        if (currentMode === "RUNNING") pressAnnounce(false); else pressArrow(1); 
    }
    
    function pressEnter() {
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING")) return; 
      if (currentMode === "RUNNING" && isActivelyAnnouncing) return; 
      
      if (currentMode === "SELECT_ROUTE") { 
        commitMultiTap(); updateFilteredRoutes(); let val = searchInput; 
        if (val.trim() === "" || !routeKeysList.includes(val)) { showRouteNotFound = true; updateScreens(); return; }
        tempRouteKey = val; boundsList = getBoundsForRoute(tempRouteKey); selectedBoundIndex = 0; currentMode = "SELECT_BOUND"; updateScreens(); 
      } else if (currentMode === "SELECT_BOUND") { 
        tempBoundKey = boundsList[selectedBoundIndex]; typesList = getTypesForRouteAndBound(tempRouteKey, tempBoundKey); selectedTypeIndex = 0; currentMode = "SELECT_TYPE"; updateScreens(); 
      } else if (currentMode === "SELECT_TYPE") { 
        tempTypeKey = typesList[selectedTypeIndex]; currentRouteKey = tempRouteKey; currentBoundKey = tempBoundKey; currentTypeKey = tempTypeKey; 
        activeRouteObj = buildRouteData(currentRouteKey, currentBoundKey, currentTypeKey); 
        menuMode = "NONE"; currentMode = "RUNNING"; currentIndex = 0; ledCurrentIndex = 0; pidsCurrentIndex = 0; isStarted = false; attenCodeNum = 0; lastBeepedIndex = -1;
        saveState(); updateScreens(); startPidsTimers(); resumeDisplayLoopNoAudio(); 
      } else if (currentMode === "F2_PASSWORD") { 
        if (passwordInput === "9876") { currentMode = "F2_MENU"; passwordInput = ""; updateScreens(); } 
        else { passwordInput = ""; updateScreens(); } 
      }
    }

    function pressDirectionMenu() { 
        if (!isPowerOn || isLoading || currentMode !== "RUNNING" || currentMode.startsWith("BOOTING")) return; 
        if (isActivelyAnnouncing) return; 
        stopPidsTimers(); menuMode = "DIR_MENU"; menuList = boundsList; menuIndex = menuList.indexOf(currentBoundKey); 
        if (menuIndex === -1) menuIndex = 0; updateScreens(); 
    }
    
    function pressMenuUp() { if (menuIndex > 0) menuIndex--; updateScreens(); }
    function pressMenuDown() { if (menuIndex < menuList.length - 1) menuIndex++; updateScreens(); }

    function pressMenuEnter() {
      if (menuMode === "DIR_MENU") { 
          remoteTempBoundKey = menuList[menuIndex]; menuMode = "TYPE_MENU"; 
          typesList = getTypesForRouteAndBound(currentRouteKey, remoteTempBoundKey); menuList = typesList; menuIndex = typesList.indexOf(currentTypeKey); 
          if (menuIndex === -1) menuIndex = 0; 
      } 
      else if (menuMode === "TYPE_MENU") { 
          remoteTempTypeKey = menuList[menuIndex]; currentBoundKey = remoteTempBoundKey; currentTypeKey = remoteTempTypeKey; 
          activeRouteObj = buildRouteData(currentRouteKey, currentBoundKey, currentTypeKey); 
          menuMode = "NONE"; currentMode = "RUNNING"; currentIndex = 0; ledCurrentIndex = 0; pidsCurrentIndex = 0; isStarted = false; attenCodeNum = 0; lastBeepedIndex = -1;
          stopAll(); saveState(); updateScreens(); startPidsTimers(); resumeDisplayLoopNoAudio(); 
      }
      updateScreens();
    }

    function pressSkip(dir) { 
      if (!isPowerOn || isLoading || currentMode !== "RUNNING" || currentMode.startsWith("BOOTING")) return; 
      if (isActivelyAnnouncing) return; 

      let wasSect = false;
      if (activeRouteObj && activeRouteObj.data) {
          let oldStop = activeRouteObj.data[currentIndex];
          if (oldStop) {
              if (oldStop.stopId && oldStop.stopId.trim().toUpperCase() === 'SECT100010') wasSect = true;
              if (oldStop.pre && oldStop.pre.some(p => p.stopId && p.stopId.trim().toUpperCase() === 'SECT100010')) wasSect = true;
              if (oldStop.post && oldStop.post.some(p => p.stopId && p.stopId.trim().toUpperCase() === 'SECT100010')) wasSect = true;
          }
      }
      
      if (dir > 0) { 
          if (currentIndex < activeRouteObj.data.length - 1) currentIndex++; 
          else return pressDirectionMenu(); 
      } 
      else if (dir < 0) { if (currentIndex > 0) currentIndex--; } 
      
      ledCurrentIndex = currentIndex; saveState(); updateScreens(); 

      let currentStopData = activeRouteObj.data[currentIndex]; let isSect = false;
      if (currentStopData) {
          if (currentStopData.stopId && currentStopData.stopId.trim().toUpperCase() === 'SECT100010') isSect = true;
          if (currentStopData.pre && currentStopData.pre.some(p => p.stopId && p.stopId.trim().toUpperCase() === 'SECT100010')) isSect = true;
          if (currentStopData.post && currentStopData.post.some(p => p.stopId && p.stopId.trim().toUpperCase() === 'SECT100010')) isSect = true;
      }
      
      let shouldBeep = false;
      if (dir > 0 && isSect) shouldBeep = true;
      if (dir < 0 && wasSect) shouldBeep = true;
      if (dir < 0 && currentIndex === 0) shouldBeep = true;

      if (shouldBeep) { sectBeepAudio.currentTime = 0; sectBeepAudio.play().catch(e => console.warn(e)); lastBeepedIndex = currentIndex; }
    }
    
    function pressReplay() { 
      if (!isPowerOn || isLoading || currentMode !== "RUNNING" || menuMode !== "NONE") return; 
      if (isActivelyAnnouncing) return; 
      
      stopAll(); isStarted = true; ledCurrentIndex = currentIndex; pidsCurrentIndex = currentIndex; 
      saveState(); updateScreens(); startPidsTimers(); startAnnouncementSequence(false); 
    }
    
    function pressStopPlayback() { 
      if (!isPowerOn || isLoading || currentMode.startsWith("BOOTING") || currentMode !== "RUNNING") return; 
      if (menuMode !== "NONE") { menuMode = "NONE"; startPidsTimers(); updateScreens(); return; } 
      
      stopAll(); isStarted = false; 
      if (pidsMode === '24') { renderPidsTopRow(); renderPidsMidArea(); renderPidsLowerArea("", false); }
      else { renderPids19Inch("", false); }
      updateScreens(); 
    }

    function pressAnnounce(isFromRemote = false) {
      if (!isPowerOn || isLoading || currentMode !== "RUNNING" || menuMode !== "NONE") return; 
      if (isFromRemote && isActivelyAnnouncing) return; 
      
      let targetIndex = currentIndex;
      if (currentIndex === 0 && !activeRouteObj.hasPlayed000) { 
        targetIndex = (!isFromRemote && activeRouteObj.data.length > 1) ? 1 : 0;
        if (targetIndex === 0) activeRouteObj.hasPlayed000 = true; 
      } else { 
        if (!isFromRemote && currentIndex >= activeRouteObj.data.length - 2) {
            tempRouteKey = currentRouteKey; boundsList = getBoundsForRoute(currentRouteKey); selectedBoundIndex = boundsList.indexOf(currentBoundKey);
            if (selectedBoundIndex === -1) selectedBoundIndex = 0;
            currentMode = "SELECT_BOUND"; stopPidsTimers(); stopAll(); updateScreens(); return;
        }
        if (currentIndex < activeRouteObj.data.length - 1) { targetIndex = currentIndex + 1; } 
        else { stopAll(); return pressDirectionMenu(); } 
      }

      stopAllAudio(); isActivelyAnnouncing = true; currentSequenceToken++; let myToken = currentSequenceToken;
      isStarted = true; currentIndex = targetIndex; ledCurrentIndex = targetIndex; pidsCurrentIndex = targetIndex; 
      saveState(); updateScreens(); startPidsTimers();
      
      const targetStop = activeRouteObj.data[targetIndex];
      (async () => {
          if (targetStop && targetStop.pre && targetStop.pre.length > 0) {
              for (let p of targetStop.pre) { if (!(await playAnnouncementPhase(p, myToken, false, false))) return; }
          }
          if (myToken !== currentSequenceToken) return;
          startAnnouncementSequence(true);
      })();
    }

    async function startAnnouncementSequence(skipPre = false) {
      if (!isPowerOn || !activeRouteObj) return; 
      const myToken = currentSequenceToken; isActivelyAnnouncing = true; 
      const stopData = activeRouteObj.data[ledCurrentIndex]; const isSpecial = (stopData.seq === 999);
      
      if (!skipPre && stopData && stopData.pre && stopData.pre.length > 0) { 
          for (let p of stopData.pre) { if (!(await playAnnouncementPhase(p, myToken, false, false))) return; } 
      }
      if (stopData) { if (!(await playAnnouncementPhase(stopData, myToken, false, isSpecial))) { if (myToken === currentSequenceToken) isActivelyAnnouncing = false; return; } }
      if (stopData && stopData.post && stopData.post.length > 0) { 
          for (let p of stopData.post) { if (!(await playAnnouncementPhase(p, myToken, true, false))) { if (myToken === currentSequenceToken) isActivelyAnnouncing = false; return; } } 
      }
      
      if (myToken === currentSequenceToken) { 
          isActivelyAnnouncing = false; if (stopData) runDisplayLoop(stopData, myToken); 
          if (ledCurrentIndex === activeRouteObj.data.length - 1) { pressDirectionMenu(); } 
      }
    }

    /* =========================================
       ★ 跨網域記憶卡通訊 (GitHub Bridge)
       ========================================= */
    let excelLoaded = false;
    let storageIframeReady = false;
    let pendingSavedState = null;
    let isRestoringMemory = false;

    window.addEventListener('message', function(event) {
        if (!event.data) return;

        if (event.data.action === 'ready') {
            storageIframeReady = true;
            if (excelLoaded) {
                const frame = document.getElementById('storageIframe'); 
                if (frame && frame.contentWindow) frame.contentWindow.postMessage({ action: 'load' }, '*');
            }
        }
        else if (event.data.action === 'loaded' && event.data.route) {
            // ★ 收到記憶只放入暫存，絕對唔擅自著機，強制等 user 撳電源掣！
            pendingSavedState = event.data;
        }
    });    

    // ★ 開機自動載入進度 (全面封鎖非同步干擾)
    window.onload = async () => { 
        const w = window.innerWidth; const h = window.innerHeight;
        let initialScale = Math.min((w - 40) / 820, (h - 40) / 1100, 1);
        if (initialScale < 0.3) initialScale = 0.3;
        
        const slider = document.getElementById('zoomSlider');
        if (slider) { slider.value = initialScale; manualZoom(initialScale); }

        drawDirectLedGrid(null, null, 0, 0); updateScreens(); 
        
        // 確保 Excel 數據在後台靜默載入，絕不提前觸發任何畫面
        await fetchExcelFromDrive(); 
        excelLoaded = true;

        const frame = document.getElementById('storageIframe');
        if (frame) {
            const requestLoad = () => {
                if (frame.contentWindow) {
                    frame.contentWindow.postMessage({ action: 'load' }, '*');
                }
            };
            requestLoad();
            frame.addEventListener('load', requestLoad);
        }
    };
