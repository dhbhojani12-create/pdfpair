(function(){class jsPDF{constructor(o){this.o=o||{};this.pages=1;this.calls=0;this.texts=[];this.images=0;this.fs=12}
_c(){this.calls++;return this}
setFillColor(){return this._c()}setDrawColor(){return this._c()}setTextColor(){return this._c()}setFont(){return this._c()}setFontSize(s){this.fs=s;return this._c()}setLineWidth(){return this._c()}
getTextWidth(t){return String(t).length*this.fs*.5}splitTextToSize(t,w){const per=Math.max(1,Math.floor(w/(this.fs*.5)));const out=[];String(t).split("\n").forEach(l=>{for(let i=0;i<l.length||i===0;i+=per)out.push(l.slice(i,i+per))});return out}
roundedRect(){return this._c()}rect(){return this._c()}line(){return this._c()}
text(t){this.texts.push(String(t));return this._c()}addImage(d){if(!/^data:image\/jpeg;base64,/.test(d))throw new Error("bad image");this.images++;return this._c()}
addPage(){this.pages++;return this._c()}
output(k){window.__lastPdf={pages:this.pages,images:this.images,texts:this.texts.slice(0,400),calls:this.calls,o:this.o};return new Blob([JSON.stringify(window.__lastPdf)],{type:"application/pdf"})}}
window.jspdf={jsPDF};})();
