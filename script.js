let segmentCount = 0;
const segments = [];

function addSegment(){
    segmentCount++;
    const container = document.getElementById("segmentsContainer");
    const div = document.createElement("div");
    div.classList.add("segment");
    div.id = "segment"+segmentCount;
    div.innerHTML = `
        <h3>სეგმენტი ${segmentCount}</h3>
        <label>ფაზა</label>
        <select class="phase">
            <option value="single">ერთფაზიანი 220V</option>
            <option value="three">სამფაზიანი 380V</option>
        </select>

        <label>მასალა</label>
        <select class="material">
            <option value="copper">სპილენძი</option>
            <option value="aluminum">ალუმინი</option>
        </select>

        <label>კაბელის სიგრძე (მეტრი)</label>
        <input type="number" class="length" placeholder="მაგ: 40">

        <label>ავტომატის ტიპი</label>
        <select class="breakerType">
            <option value="B">B ტიპი</option>
            <option value="C">C ტიპი</option>
            <option value="D">D ტიპი</option>
        </select>

        <label>ავტომატის ამპერი</label>
    <select class="breakerAmp">
    <option value="10">10A</option>
    <option value="16">16A</option>
    <option value="20">20A</option> <!-- ახალი დამატება -->
    <option value="25">25A</option>
    <option value="32">32A</option>
    <option value="40">40A</option>
    <option value="63">63A</option>
</select>


        <label>კვეთის არჩევა (mm²)</label>
        <select class="cableSize">
            <option value="1.5">1.5</option>
            <option value="2.5">2.5</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="10">10</option>
            <option value="16">16</option>
            <option value="25">25</option>
            <option value="35">35</option>
            <option value="50">50</option>
        </select>

        <label>სიმძლავრე (W)</label>
        <input type="number" class="power" placeholder="მაგ: 5000">
    `;
    container.appendChild(div);
    segments.push(div);
}

function calculate(){
    const cosphi = 0.95;
    let resultsHTML = "";
    let chartData = [];
    let chartLabels = [];
    let colors = [];
    let totalCable = 0;
    let totalBreaker = 0;

    segments.forEach((seg,i)=>{
        const phase = seg.querySelector(".phase").value;
        const material = seg.querySelector(".material").value;
        const L = parseFloat(seg.querySelector(".length").value);
        const breakerAmp = parseFloat(seg.querySelector(".breakerAmp").value);
        const cableSize = parseFloat(seg.querySelector(".cableSize").value);
        const P = parseFloat(seg.querySelector(".power").value);
        if(!L || !P) return;

        const voltage = (phase==="single") ? 220 : 380;
        let I = (phase==="single") ? P/(voltage*cosphi) : P/(Math.sqrt(3)*voltage*cosphi);
        I = parseFloat(I.toFixed(1));

        const rho = (material==="copper") ? 0.0175 : 0.028;
        const deltaU = (phase==="single") ? 2*L*I*rho/cableSize : Math.sqrt(3)*L*I*rho/cableSize;
        const percent = parseFloat((deltaU/voltage*100).toFixed(1));

        const safeCable = percent<=3;
        const safeBreaker = I<=breakerAmp;
        let recommendation = "";
        if(!safeCable) recommendation += "კვეთა უნდა გაიზარდოს. ";
        if(!safeBreaker) recommendation += "ავტომატის ამპერი საკმარისი არაა. ";
        if(safeCable && safeBreaker) recommendation = "სეგმენტი უსაფრთხოა ✅";

        totalCable += L;
        totalBreaker += 1;

        resultsHTML += `<h3>სეგმენტი ${i+1}</h3>
            დენი: <b>${I} A</b><br>
            ძაბვის ვარდნა: <b>${deltaU.toFixed(2)} V (${percent}%)</b><br>
            კაბელის უსაფრთხოება: <b>${safeCable ? "✅" : "❌"}</b><br>
            ავტომატის უსაფრთხოება: <b>${safeBreaker ? "✅" : "❌"}</b><br>
            რეკომენდაცია: <b>${recommendation}</b><br>
            სეგმენტის კაბელი: <b>${L} მ</b><br>
            საჭირო ავტომატები: <b>1 ცალი</b><br><hr>`;

        chartLabels.push(`Seg ${i+1}`);
        chartData.push(percent);
        colors.push(safeCable ? "#28a745" : "#dc3545");
    });

    resultsHTML += `<h3>ჯამური მონაცემები</h3>
        ჯამური კაბელი: <b>${totalCable} მ</b><br>
        ჯამური ავტომატები: <b>${totalBreaker} ცალი</b>
    `;

    document.getElementById("result").innerHTML = resultsHTML;
    drawChartWithAxes(chartLabels, chartData, colors);
}

function drawChartWithAxes(labels, data, colors){
    const canvas = document.getElementById("chart");
    const ctx = canvas.getContext("2d");
    const tooltip = document.getElementById("tooltip");
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const padding = 60;
    const chartWidth = canvas.width - padding*2;
    const chartHeight = canvas.height - padding*2;
    const maxPercent = Math.max(...data)*1.2 || 5;

    // ღერძები X/Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height-padding);
    ctx.lineTo(canvas.width-padding, canvas.height-padding);
    ctx.strokeStyle="#333";
    ctx.lineWidth=2;
    ctx.stroke();

    // Y ღერძის ნიშნები
    ctx.fillStyle="#000";
    ctx.textAlign="right";
    ctx.textBaseline="middle";
    for(let y=0; y<=maxPercent; y+=3){
        const yPos = canvas.height-padding - (y/maxPercent)*chartHeight;
        ctx.fillText(y+"%", padding-5, yPos);
        ctx.beginPath();
        ctx.moveTo(padding, yPos);
        ctx.lineTo(canvas.width-padding, yPos);
        ctx.strokeStyle="#ddd";
        ctx.lineWidth=1;
        ctx.stroke();
    }

    // X ღერძის ნიშნები
    ctx.textAlign="center";
    ctx.textBaseline="top";
    labels.forEach((label,i)=>{
        const x = padding + (i/(labels.length-1 || 1))*chartWidth;
        ctx.fillStyle="#000";
        ctx.fillText(label, x, canvas.height-padding+5);
    });

    // წერტილები
    const points = [];
    data.forEach((val,i)=>{
        const x = padding + (i/(data.length-1 || 1))*chartWidth;
        const y = canvas.height-padding - (val/maxPercent)*chartHeight;
        points.push({x,y,val,i});
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(x,y,10,0,2*Math.PI);
        ctx.fill();
    });

    // Tooltip
    canvas.onmousemove = function(e){
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let found = false;
        points.forEach(pt=>{
            const dist = Math.hypot(mouseX-pt.x, mouseY-pt.y);
            if(dist<12){
                const seg = segments[pt.i];
                tooltip.style.display="block";
                tooltip.style.left = (e.clientX+15)+"px";
                tooltip.style.top = (e.clientY+15)+"px";
                tooltip.innerHTML = `${labels[pt.i]}<br>ძაბვის ვარდნა: ${pt.val}%<br>კვეთა: ${seg.querySelector(".cableSize").value} mm²<br>სიგრძე: ${seg.querySelector(".length").value} მ<br>უსაფრთხოება: ${pt.val<=3 ? "✅" : "❌"}`;
                found = true;
            }
        });
        if(!found) tooltip.style.display="none";
    };
    canvas.onmouseleave = function(){ tooltip.style.display="none"; }
}