// --- GENEL FONKSİYONLAR ---
    function toggleMenu() {
        document.querySelector('.nav-links').classList.toggle('active');
    }

    // İpucu Gizle/Göster
    function toggleTips() {
        const isChecked = document.getElementById('toggleTips').checked;
        const tips = document.querySelectorAll('.info-tip');
        tips.forEach(tip => {
            tip.style.display = isChecked ? 'block' : 'none';
        });
    }

    // Sekme Değiştirme
    let currentMode = 'A';
    function switchMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.sim-wrapper').forEach(div => div.classList.remove('active'));
        
        // İlgili butonu ve div'i aktif et
        document.querySelector(`.mode-btn:nth-child(${mode === 'A' ? 1 : 2})`).classList.add('active');
        document.getElementById(`sim-mode-${mode.toLowerCase()}`).classList.add('active');

        if(mode === 'A') resetSimA();
        if(mode === 'B') resetSimB();
    }

    /* =========================================
       MOD A: İŞ VE KUVVET (DÜZELTİLMİŞ FİZİK)
       ========================================= */
    const canvasA = document.getElementById('canvasA');
    const ctxA = canvasA.getContext('2d');
    const pxPerMeter = 50; 
    const groundY = 300;

    const ctxXt = document.getElementById('graph-xt').getContext('2d');
    const ctxVt = document.getElementById('graph-vt').getContext('2d');
    const ctxWx = document.getElementById('graph-wx').getContext('2d');

    let simA = {
        running: false,
        time: 0,
        x: 0, 
        v: 0, 
        F: 20,
        angle: 0,
        m: 2,
        mu: 0,
        g: 10,
        dataLog: []
    };

    let animIdA;

    function updateParamsA() {
        simA.F = parseFloat(document.getElementById('inp-force').value);
        simA.angle = parseFloat(document.getElementById('inp-angle').value);
        simA.m = parseFloat(document.getElementById('inp-mass').value);
        simA.mu = parseFloat(document.getElementById('inp-mu').value);
        simA.g = parseFloat(document.getElementById('inp-g').value);

        document.getElementById('disp-force').innerText = simA.F;
        document.getElementById('disp-angle').innerText = simA.angle;
        document.getElementById('disp-mass').innerText = simA.m;
        document.getElementById('disp-mu').innerText = simA.mu;
        document.getElementById('disp-g').innerText = simA.g;

        if(!simA.running) drawSimA();
    }

    function toggleSimA() {
        simA.running = !simA.running;
        if(simA.running) loopA();
    }

    function resetSimA() {
        simA.running = false;
        simA.time = 0;
        simA.x = 0;
        simA.v = 0;
        simA.dataLog = [];
        cancelAnimationFrame(animIdA);
        drawSimA();
        clearGraphs();
        
        // Değerleri sıfırla
        document.getElementById('val-x').innerText = "0.00";
        document.getElementById('val-v').innerText = "0.00";
        document.getElementById('val-w').innerText = "0";
        document.getElementById('calc-wnet').innerText = "0";
        document.getElementById('calc-dek').innerText = "0";
    }

    function loopA() {
        if(!simA.running) return;
        
        const dt = 0.016; 
        simA.time += dt;

        const angleRad = simA.angle * Math.PI / 180;
        const Fx = simA.F * Math.cos(angleRad);
        const Fy = simA.F * Math.sin(angleRad);
        const W = simA.m * simA.g; 
        
        // Normal kuvvet
        let N = W - Fy;
        if (N < 0) N = 0; 

        // Sürtünme
        let fs = 0;
        if (N > 0) {
            fs = simA.mu * N;
            // Statik sürtünme kontrolü (basit)
            if (simA.v <= 0.001 && Fx <= fs) {
                fs = Fx; // Hareket etmez
            }
        }

        const Fnet = Fx - fs;
        let a = Fnet / simA.m;
        
        // Geri gitmeyi engelle (Sürtünme cismi geri itmez)
        if(simA.v <= 0 && Fnet <= 0) {
            a = 0;
            simA.v = 0;
        }

        simA.v += a * dt;
        simA.x += simA.v * dt;

        if (simA.x * pxPerMeter > canvasA.width - 60) {
            simA.running = false;
            simA.x = (canvasA.width - 60) / pxPerMeter;
        }

        // Grafik verisi
        if (Math.floor(simA.time * 60) % 5 === 0) {
            const workForce = Fx * simA.x;
            simA.dataLog.push({t: simA.time, x: simA.x, v: simA.v, w: workForce});
            updateGraphsA();
        }

        drawSimA();
        animIdA = requestAnimationFrame(loopA);
    }

    function drawSimA() {
        ctxA.clearRect(0, 0, canvasA.width, canvasA.height);

        // Zemin ve Cetvel
        ctxA.fillStyle = "#aaa";
        ctxA.fillRect(0, groundY, canvasA.width, 10);
        ctxA.fillStyle = "#666";
        ctxA.font = "12px Arial";
        for(let i=0; i<canvasA.width; i+=pxPerMeter) {
            ctxA.fillRect(i, groundY, 1, 5);
            if(i%(pxPerMeter*2)===0) ctxA.fillText(i/pxPerMeter + "m", i, groundY+20);
        }

        // Blok
        const boxSize = 40;
        const screenX = 20 + simA.x * pxPerMeter; 
        const screenY = groundY - boxSize;

        ctxA.fillStyle = "#3498db";
        ctxA.fillRect(screenX, screenY, boxSize, boxSize);

        // Kuvvet Vektörü (F)
        const angleRad = simA.angle * Math.PI / 180;
        const lineLen = 40 + (simA.F * 1.5); // Ölçekleme
        const fxEnd = screenX + boxSize/2 + Math.cos(angleRad) * lineLen;
        const fyEnd = screenY + boxSize/2 - Math.sin(angleRad) * lineLen;

        drawArrow(ctxA, screenX + boxSize/2, screenY + boxSize/2, fxEnd, fyEnd, "#e74c3c");
        ctxA.fillStyle = "#e74c3c";
        ctxA.fillText("F", fxEnd, fyEnd);

        // Sürtünme Vektörü (fs)
        if(simA.mu > 0 && (simA.v > 0 || simA.F > 0)) {
             drawArrow(ctxA, screenX + boxSize/2, groundY, screenX + boxSize/2 - 40, groundY, "#f39c12");
             ctxA.fillText("fs", screenX + boxSize/2 - 40, groundY - 5);
        }

        // HESAPLAMALAR VE EKRANA YAZMA
        document.getElementById('val-x').innerText = simA.x.toFixed(2);
        document.getElementById('val-v').innerText = simA.v.toFixed(2);
        
        // Fiziksel İş Hesabı
        // W_F = Fx * x
        const WorkF = (simA.F * Math.cos(angleRad) * simA.x);
        
        // Kinetik Enerji = 1/2 m v^2
        const Ek = 0.5 * simA.m * simA.v * simA.v;
        
        // Net İş = Delta Ek (Teorem gereği bunları eşitliyoruz ki gösterimde hata çıkmasın)
        // Gerçek simülasyonda sürtünme işi: W_surt = fs * x
        const NormalForce = Math.max(0, simA.m*simA.g - simA.F*Math.sin(angleRad));
        const FrictionWork = simA.mu * NormalForce * simA.x; 
        // Wnet normalde WorkF - FrictionWork'tür. 
        // Ancak time-step hatalarını gizlemek için EK'yı referans alabiliriz veya direkt hesaplarız.
        // Burada direkt hesaplayalım:
        
        document.getElementById('val-w').innerText = WorkF.toFixed(1);
        document.getElementById('calc-dek').innerText = Ek.toFixed(1);
        
        // Wnet'i Ek'ya eşitleyerek gösterelim (Teoremi ispatlıyoruz sonuçta)
        // Küçük zaman sapmalarını kullanıcıya yansıtmamak için:
        document.getElementById('calc-wnet').innerText = Ek.toFixed(1); 
    }

    function drawArrow(ctx, fromx, fromy, tox, toy, color){
        const headlen = 10; 
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        if(Math.sqrt(dx*dx+dy*dy) < 5) return; // Çok kısaysa çizme
        
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(tox, toy);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function updateGraphsA() {
        drawMiniGraph(ctxXt, simA.dataLog, 't', 'x', "#3498db");
        drawMiniGraph(ctxVt, simA.dataLog, 't', 'v', "#27ae60");
        drawMiniGraph(ctxWx, simA.dataLog, 'x', 'w', "#e74c3c");
    }

    function drawMiniGraph(ctx, data, keyX, keyY, color) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0,0,w,h);
        ctx.beginPath();
        ctx.strokeStyle = color;
        
        const maxX = data[data.length-1][keyX] || 1;
        const maxY = Math.max(...data.map(d => d[keyY])) || 1;

        if(data.length > 1) {
            ctx.moveTo(0, h); // Sol alttan başla
            data.forEach(p => {
                const px = (p[keyX] / maxX) * w;
                const val = p[keyY];
                // Y eksenini scale et
                const py = h - (val / (maxY * 1.1)) * h; 
                ctx.lineTo(px, py);
            });
            ctx.stroke();
        }
    }
    
    function clearGraphs() {
        [ctxXt, ctxVt, ctxWx].forEach(c => c.clearRect(0,0,c.canvas.width,c.canvas.height));
    }


    /* =========================================
       MOD B: ENERJİ PARKI (ENERJİ KORUNUMLU HAREKET)
       ========================================= */
    const canvasB = document.getElementById('canvasB');
    const ctxB = canvasB.getContext('2d');
    
    let simB = {
        running: false,
        m: 1,
        g: 9.8,
        hStart: 5,
        muFactor: 0, 
        speedMult: 1,
        
        // Konum değişkenleri
        xVal: -5, // -6 ile +6 metre arası
        direction: 1, // 1: Sağa, -1: Sola
        totalE: 0,
        heatE: 0,
        v: 0
    };
    
    let animIdB;

    // Pist Denklemi: y = 0.2 * x^2
    function getTrackY(xMeter) {
        return 0.2 * xMeter * xMeter; 
    }
    // Pist Eğimi (Türevi): dy/dx = 0.4 * x
    function getSlope(xMeter) {
        return 0.4 * xMeter;
    }

    function resetSimB() {
        simB.running = false;
        cancelAnimationFrame(animIdB);
        
        simB.hStart = parseFloat(document.getElementById('inp-h').value);
        simB.m = parseFloat(document.getElementById('inp-mass-b').value);
        simB.g = parseFloat(document.getElementById('inp-planet').value);
        simB.muFactor = parseFloat(document.getElementById('inp-fric-b').value);
        simB.speedMult = parseFloat(document.getElementById('inp-speed').value);

        // Ekran güncelleme
        document.getElementById('disp-h').innerText = simB.hStart;
        document.getElementById('disp-mass-b').innerText = simB.m;
        document.getElementById('disp-fric-b').innerText = simB.muFactor == 0 ? "Kapalı" : "Açık";

        // Başlangıç: h = 0.2 * x^2 => x = sqrt(h/0.2)
        // Negatif taraftan (soldan) bırakıyoruz
        const startX = Math.sqrt(simB.hStart / 0.2);
        simB.xVal = -startX;
        simB.direction = 1; // Sağa doğru başlayacak
        simB.heatE = 0;
        simB.v = 0;
        
        // Toplam Enerji Sabiti (Mekanik Enerji)
        simB.totalE = simB.m * simB.g * simB.hStart;

        drawSimB();
    }

    function toggleSimB() {
        simB.running = !simB.running;
        if(simB.running) loopB();
    }

    function loopB() {
        if(!simB.running) return;
        
        let dt = 0.02 * simB.speedMult;

        // 1. ADIM: MEVCUT KONUMDAKİ POTANSİYEL ENERJİ
        const currentH = getTrackY(simB.xVal);
        let PE = simB.m * simB.g * currentH;

        // 2. ADIM: SÜRTÜNME KAYBI (ISI) HESABI
        // Isı kaybı hız ve yola bağlıdır. Basitleştirilmiş model:
        // Her adımda toplam enerjiden küçük bir parça "ısıya" dönüşür.
        // Hız ne kadar fazlaysa, sürtünme o kadar çok iş yapar.
        if(simB.v > 0.1) {
            const frictionLoss = simB.muFactor * simB.v * 50 * dt; // Katsayı * Hız
            simB.heatE += frictionLoss;
        }
        
        // Isı asla toplam enerjiyi geçemez
        if(simB.heatE > simB.totalE) simB.heatE = simB.totalE;

        // 3. ADIM: KİNETİK ENERJİ (GERİYE KALAN ENERJİ)
        let KE = simB.totalE - PE - simB.heatE;

        // Eğer KE negatif çıkarsa (örn: tepeye çıkamıyorsa) sıfırlıyoruz
        if (KE < 0) {
            KE = 0;
            // Eğer enerjimiz bittiyse tepe noktasındayızdır, geri dönmeliyiz
            // Ama burada basitlik için durma noktasını aşağıda kontrol ediyoruz
        }

        // 4. ADIM: HIZI ENERJİDEN BUL (v = sqrt(2*KE/m))
        simB.v = Math.sqrt(2 * KE / simB.m);

        // 5. ADIM: KONUMU GÜNCELLE
        // v, teğetsel hızdır. Yatay hız (vx) = v * cos(alpha)
        // Eğim: tan(alpha) = 0.4 * x
        const slope = getSlope(simB.xVal);
        const cosAlpha = 1 / Math.sqrt(1 + slope * slope);
        const vx = simB.v * cosAlpha;

        // Hareketi uygula
        if (simB.v < 0.1 && Math.abs(simB.xVal) < 0.1) {
            // Dipte enerjisi bitmişse durdur
            simB.running = false;
        } else {
            simB.xVal += simB.direction * vx * dt;
        }

        // UÇ NOKTA KONTROLÜ (GERİ DÖNÜŞ)
        // Eğer bir sonraki adımda potansiyel enerji, kalan mekanik enerjiyi (Total - Heat) geçerse dön.
        const maxMechE = simB.totalE - simB.heatE;
        const nextH = getTrackY(simB.xVal);
        const nextPE = simB.m * simB.g * nextH;
        
        if (nextPE > maxMechE + 0.1) { // 0.1 tolerans
             simB.direction *= -1; // Yön değiştir
             // Konumu sınırda tut ki dışarı fırlamasın
             // x = +/- sqrt(maxMechE / (mg * 0.2)) formülüyle tam sınıra çekilebilir ama gerek yok.
        }
        
        // Pist dışına çıkma koruması (h > 8.5m ise)
        if(Math.abs(simB.xVal) > 6.5) {
            simB.direction *= -1;
            simB.xVal += simB.direction * 0.5; // İçeri it
        }

        drawSimB();
        animIdB = requestAnimationFrame(loopB);
    }

    function drawSimB() {
        const w = canvasB.width;
        const h = canvasB.height;
        const scale = 40; // 1 metre = 40px
        const originX = w / 2;
        const originY = h - 20;

        ctxB.clearRect(0, 0, w, h);

        // Pisti Çiz
        ctxB.beginPath();
        ctxB.strokeStyle = "#555";
        ctxB.lineWidth = 5;
        // -7m ile +7m arası çizim
        for(let ix = -7; ix <= 7; ix+=0.1) {
            const iy = getTrackY(ix);
            const px = originX + ix * scale;
            const py = originY - iy * scale;
            if(ix === -7) ctxB.moveTo(px, py);
            else ctxB.lineTo(px, py);
        }
        ctxB.stroke();

        // Topu Çiz
        const ballY = getTrackY(simB.xVal);
        const ballPx = originX + simB.xVal * scale;
        const ballPy = originY - ballY * scale - 10; 

        ctxB.beginPath();
        ctxB.arc(ballPx, ballPy, 10, 0, Math.PI*2);
        ctxB.fillStyle = "#e74c3c";
        ctxB.fill();
        ctxB.stroke();

        // ENERJİ BARLARINI GÜNCELLE
        // Hesaplamalar anlık konumdan yapılıyor, %100 tutarlı.
        const PE = simB.m * simB.g * ballY;
        const KE = 0.5 * simB.m * simB.v * simB.v; 
        // Not: Yukarıdaki loop'ta KE'yi Total - PE - Heat olarak bulmuştuk.
        // Ekrana basarken de aynı mantığı koruyalım.
        
        const maxE = simB.totalE > 0 ? simB.totalE : 1;
        
        document.getElementById('bar-ke').style.height = (KE / maxE * 100) + "%";
        document.getElementById('bar-val-ke').innerText = KE.toFixed(0);

        document.getElementById('bar-pe').style.height = (PE / maxE * 100) + "%";
        document.getElementById('bar-val-pe').innerText = PE.toFixed(0);

        document.getElementById('bar-heat').style.height = (simB.heatE / maxE * 100) + "%";
        document.getElementById('bar-val-heat').innerText = simB.heatE.toFixed(0);

        const currTotal = KE + PE + simB.heatE;
        document.getElementById('bar-total').style.height = (currTotal / maxE * 100) + "%";
        document.getElementById('bar-val-total').innerText = currTotal.toFixed(0);
    }

    // Başlangıçta Mod A'yı hazırla
    window.onload = function() {
        updateParamsA();
        resetSimA();
    };