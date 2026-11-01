const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(30000);
 const ev=(t)=>p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File(["x"],"a.pdf",{type:"application/pdf"}));window.dispatchEvent(new DragEvent(t,{dataTransfer:dt,bubbles:true,cancelable:true}))},t);
 await ev("dragenter");await ev("dragenter");await ev("dragenter");await ev("dragover");
 ok(await p.evaluate(()=>!document.querySelector("#drop").hidden),"overlay shows while a file is dragged over");
 await p.waitForTimeout(900);ok(await p.evaluate(()=>document.querySelector("#drop").hidden),"overlay clears itself when the drag stops (was stuck before)");
 await ev("dragenter");await p.mouse.move(100,100);ok(await p.evaluate(()=>document.querySelector("#drop").hidden),"moving the mouse clears a stuck overlay");
 await ev("dragenter");await p.keyboard.press("Escape");ok(await p.evaluate(()=>document.querySelector("#drop").hidden),"Esc clears it");
 const e=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e.length,"no page errors");await b.close()})();
