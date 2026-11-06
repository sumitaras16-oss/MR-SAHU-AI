const $=id=>document.getElementById(id);
const welcome=$("welcome"),chatArea=$("chatArea"),messages=$("messages"),voicePanel=$("voicePanel"),photoPanel=$("photoPanel"),comingPanel=$("comingPanel"),composerWrap=$("composerWrap");
let chatTitles=[];
let conversation=[];
let sessions=[];
let activeSessionId=null;
const SYSTEM_NOTE="You are MR SAHU AI, a helpful, safe, friendly assistant. Reply in the language used by the user (Odia, Hindi, or English). Explain school topics clearly and age-appropriately. Do not claim to be ChatGPT; you are MR SAHU AI, created by Smruti Ranjan Sahu.";
function show(view){
 welcome.hidden=view!=="home";chatArea.hidden=view!=="chat";voicePanel.hidden=view!=="voice";photoPanel.hidden=view!=="photo";comingPanel.hidden=view!=="coming";
 composerWrap.hidden=view==="voice"||view==="photo"||view==="coming";
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
 if(view==="chat"||view==="home")$("chatNav").classList.add("active");
 if(view==="voice")$("voiceJump").classList.add("active");
 if(view==="photo")$("photoJump").classList.add("active");
}
function addMessage(text,who){
 const row=document.createElement("div");row.className="message-row "+(who==="user"?"user":"assistant");
 const avatar=document.createElement("div");avatar.className="message-avatar";avatar.textContent=who==="user"?"Y":"S";
 const body=document.createElement("div");body.className="message-content";body.textContent=text;
 row.append(avatar,body);
 if(who!=="user"){const actions=document.createElement("div");actions.className="message-actions";const copy=document.createElement("button");copy.textContent="Copy";copy.onclick=()=>navigator.clipboard?.writeText(text);actions.append(copy);body.append(actions);}
 messages.append(row);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}
async function askAI(q){
 const response=await fetch("/api/chat",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({message:q,history:conversation.slice(-12),instructions:SYSTEM_NOTE})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||"AI service is not available right now.");
 return data.reply||"I couldn't create a response. Please try again.";
}

function refreshHistory(){
 const list=$("historyList");list.innerHTML="";
 if(!sessions.length){const empty=document.createElement("p");empty.className="empty-history";empty.textContent="Your recent chats will appear here.";list.append(empty);return;}
 sessions.slice().reverse().forEach(session=>{
  const b=document.createElement("button");b.className="history-item"+(session.id===activeSessionId?" active":"");b.textContent=session.title;
  b.onclick=()=>openSession(session.id);list.append(b);
 });
}
function openSession(id){
 const session=sessions.find(x=>x.id===id);if(!session)return;
 activeSessionId=id;conversation=session.conversation.slice();messages.innerHTML="";
 session.messages.forEach(m=>addMessage(m.content,m.role));show("chat");refreshHistory();$("sidebar").classList.remove("open");
}
function startSession(title){
 const session={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:title.slice(0,34),messages:[],conversation:[]};
 sessions.push(session);if(sessions.length>10)sessions.shift();activeSessionId=session.id;refreshHistory();return session;
}
async function send(text){
 const q=(text??$("prompt").value).trim();if(!q)return;
 if(!activeSessionId)startSession(q);
 const session=sessions.find(x=>x.id===activeSessionId);
 show("chat");addMessage(q,"user");
 session?.messages.push({role:"user",content:q});$("prompt").value="";resizePrompt();
 const pending=document.createElement("div");pending.className="message-row assistant";pending.id="pendingReply";
 const av=document.createElement("div");av.className="message-avatar";av.textContent="S";
 const body=document.createElement("div");body.className="message-content";body.textContent="MR SAHU AI is thinking…";pending.append(av,body);messages.append(pending);
 try{
  const reply=await askAI(q);pending.remove();addMessage(reply,"assistant");
  conversation.push({role:"user",content:q},{role:"assistant",content:reply});conversation=conversation.slice(-12);
  if(session){session.conversation=conversation.slice();session.messages.push({role:"assistant",content:reply});}
 }catch(err){pending.remove();addMessage("⚠️ "+err.message,"assistant");}
}
$("chatForm").addEventListener("submit",e=>{e.preventDefault();send();});
$("prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
function resizePrompt(){$("prompt").style.height="auto";$("prompt").style.height=Math.min($("prompt").scrollHeight,160)+"px";}
$("prompt").addEventListener("input",resizePrompt);
$("newChat").onclick=()=>{messages.innerHTML="";conversation=[];activeSessionId=null;$("prompt").value="";resizePrompt();show("home");refreshHistory();$("sidebar").classList.remove("open");};
$("chatNav").onclick=()=>show(messages.children.length?"chat":"home");
document.querySelectorAll(".suggestion[data-prompt]").forEach(b=>b.onclick=()=>send(b.dataset.prompt));
function openVoice(){show("voice");$("voiceStatus").textContent="Tap the microphone and start speaking.";$("sidebar").classList.remove("open");}
$("voiceJump").onclick=$("suggestVoice").onclick=openVoice;
$("photoJump").onclick=()=>{show("photo");$("sidebar").classList.remove("open");};
function coming(title,desc){$("comingTitle").textContent=title;$("comingDescription").textContent=desc;show("coming");$("sidebar").classList.remove("open");}
$("pdfJump").onclick=()=>coming("PDF assistant","PDF upload, summaries and question answering will be added after the secure document-processing backend is ready.");
$("studyJump").onclick=()=>coming("Study assistant","A dedicated learning mode for explanations, practice and homework support is planned for a future build.");
$("backToChat").onclick=()=>show(messages.children.length?"chat":"home");
$("aboutBtn").onclick=()=>$("aboutDialog").showModal();$("closeAbout").onclick=()=>$("aboutDialog").close();
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");$("closeSidebar").onclick=()=>$("sidebar").classList.remove("open");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;let recognition=null;
function startVoice(){
 if(!SpeechRecognition){$("voiceStatus").textContent="Speech recognition is not supported in this browser. Try a supported browser or use text chat.";return;}
 recognition=new SpeechRecognition();recognition.lang="or-IN";recognition.interimResults=true;recognition.continuous=false;
 $("voiceStatus").textContent="Listening…";$("voiceOrb").classList.add("listening");
 recognition.onresult=e=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;$("voiceTranscript").textContent=t;if(e.results[e.results.length-1].isFinal){$("voiceStatus").textContent="Sending your voice message…";askAI(t).then(reply=>{$("voiceStatus").textContent="Response ready";$("voiceTranscript").textContent=t+"\n\nMR SAHU AI: "+reply;if("speechSynthesis"in window){const u=new SpeechSynthesisUtterance(reply);u.lang="or-IN";speechSynthesis.speak(u);}}).catch(err=>{$("voiceStatus").textContent=err.message;});}};
 recognition.onerror=e=>$("voiceStatus").textContent="Voice input error: "+e.error;
 recognition.onend=()=>$("voiceOrb").classList.remove("listening");recognition.start();
}
$("micBtn").onclick=startVoice;$("composerMic").onclick=()=>{openVoice();startVoice();};
$("photoInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);$("photoPreview").src=url;$("photoPreview").hidden=false;$("photoNote").textContent=f.name+" — preview only; AI editing is not connected yet.";};
$("attachBtn").onclick=()=>$("chatFile").click();
$("chatFile").onchange=e=>{const f=e.target.files[0];if(!f)return;$("attachmentName").textContent="Attached: "+f.name+" (upload processing is not connected yet)";};
