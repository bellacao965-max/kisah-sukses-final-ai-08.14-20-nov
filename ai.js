
/* AI Chat Pro — complete features */
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const ttsBtn = document.getElementById("ttsBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatListEl = document.getElementById("chatList");
const themeToggle = document.getElementById("themeToggle");
const dashboard = document.getElementById("dashboard");
const openDashboard = document.getElementById("openDashboard");
const closeDashboard = document.getElementById("closeDashboard");
const statsEl = document.getElementById("stats");
const fileInput = document.getElementById("fileInput");
const exportBtn = document.getElementById("exportBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const renameChatBtn = document.getElementById("renameChat");
const deleteChatBtn = document.getElementById("deleteChat");
const searchChats = document.getElementById("searchChats");
const clearAllBtn = document.getElementById("clearAll");

const AVATAR_AI = "https://i.imgur.com/9Qonw1Z.png";
const AVATAR_USER = "https://i.imgur.com/Ct6oZ6C.png";

// Simple markdown renderer (supports code blocks, bold, italic, links)
function renderMarkdown(text){
    // code blocks
    text = text.replace(/```([\s\S]*?)```/g, (m,code)=>'<pre><code>'+escapeHtml(code)+'</code></pre>');
    // inline code
    text = text.replace(/`([^`]+)`/g, (m,code)=>'<code>'+escapeHtml(code)+'</code>');
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // links
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return text;
}
function escapeHtml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

// Chat storage: array of {id, title, messages:[{role,text,ts}]}
let chats = [];
let activeChatId = null;

function saveAll(){ localStorage.setItem("ai_chats_v2", JSON.stringify({chats, activeChatId})); }
function loadAll(){
    const raw = localStorage.getItem("ai_chats_v2");
    if(raw){ try{ const parsed = JSON.parse(raw); chats = parsed.chats||[]; activeChatId = parsed.activeChatId||(chats[0] && chats[0].id); }catch(e){console.warn("corrupt storage",e); chats=[]; } }
    if(!chats.length){ createNewChat(); }
}
function createNewChat(title){ const id = "c_"+Date.now(); const t = title||("Chat "+(chats.length+1)); const c={id, title:t, messages:[]}; chats.unshift(c); activeChatId=id; saveAll(); renderChatList(); renderActiveChat(); }
function deleteActiveChat(){ if(!activeChatId) return; chats = chats.filter(c=>c.id!==activeChatId); activeChatId = chats[0] && chats[0].id; saveAll(); renderChatList(); renderActiveChat(); }
function clearActiveChat(){ const c = chats.find(x=>x.id===activeChatId); if(c) { c.messages=[]; saveAll(); renderActiveChat(); } }
function renameActiveChat(){ const c = chats.find(x=>x.id===activeChatId); if(!c) return; const name = prompt("New name", c.title); if(name) { c.title = name; saveAll(); renderChatList(); renderActiveChat(); } }
function exportAll(){ const blob = new Blob([JSON.stringify(chats, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="ai_chats.json"; a.click(); URL.revokeObjectURL(url); }

function renderChatList(filter=""){
    chatListEl.innerHTML="";
    chats.forEach(c=>{
        if(filter && !c.title.toLowerCase().includes(filter.toLowerCase())) return;
        const li=document.createElement("li");
        li.textContent=c.title;
        if(c.id===activeChatId) li.classList.add("active");
        li.onclick = ()=>{ activeChatId=c.id; saveAll(); renderChatList(); renderActiveChat(); }
        const del = document.createElement("button"); del.textContent="✖"; del.title="Delete chat"; del.onclick = (e)=>{ e.stopPropagation(); if(confirm("Delete chat?")){ chats = chats.filter(x=>x.id!==c.id); if(activeChatId===c.id) activeChatId = chats[0] && chats[0].id; saveAll(); renderChatList(); renderActiveChat(); } }
        li.appendChild(del);
        chatListEl.appendChild(li);
    });
}

function renderActiveChat(){
    const c = chats.find(x=>x.id===activeChatId);
    document.getElementById("chatTitle").textContent = c ? c.title : "No chat";
    messagesEl.innerHTML = "";
    if(!c) return;
    c.messages.forEach(m=>{
        const wrap = document.createElement("div"); wrap.className="msg-wrap";
        const avatar = document.createElement("img"); avatar.className="avatar"; avatar.src = (m.role==="user"?AVATAR_USER:AVATAR_AI);
        const bubble = document.createElement("div"); bubble.className="msg "+m.role;
        bubble.innerHTML = renderMarkdown(escapeHtml(m.text));
        if(m.role==="user"){ wrap.style.justifyContent="flex-end"; wrap.appendChild(bubble); wrap.appendChild(avatar); } else { wrap.appendChild(avatar); wrap.appendChild(bubble); }
        messagesEl.appendChild(wrap);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// message helpers
function pushMessage(role, text){
    const c = chats.find(x=>x.id===activeChatId);
    if(!c) return;
    const m = {role, text, ts:Date.now()};
    c.messages.push(m);
    saveAll();
    renderActiveChat();
    return m;
}

// typing indicator
function addTypingRow(){ const wrap=document.createElement("div"); wrap.className="msg-wrap typing"; const avatar=document.createElement("img"); avatar.className="avatar"; avatar.src=AVATAR_AI; const bubble=document.createElement("div"); bubble.className="msg ai"; bubble.innerHTML = '<div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>'; wrap.appendChild(avatar); wrap.appendChild(bubble); messagesEl.appendChild(wrap); messagesEl.scrollTop = messagesEl.scrollHeight; return wrap; }

// speech recognition (voice input)
let recognition = null;
let listening = false;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e)=>{
        const text = Array.from(e.results).map(r=>r[0].transcript).join('');
        inputEl.value = text;
        send();
    };
    recognition.onend = ()=>{ listening=false; voiceBtn.textContent = "🎤"; }
    voiceBtn.onclick = ()=>{
        if(!recognition) return alert("Voice not supported in this browser");
        if(!listening){ recognition.start(); listening=true; voiceBtn.textContent="⏹️"; }
        else { recognition.stop(); listening=false; voiceBtn.textContent="🎤"; }
    };
} else {
    voiceBtn.onclick = ()=> alert("Voice input not supported in this browser");
}

// TTS read last AI message
function ttsReadLast(){
    const c = chats.find(x=>x.id===activeChatId);
    if(!c) return;
    const last = [...c.messages].reverse().find(m=>m.role==="ai");
    if(!last) return alert("No AI message to read");
    if('speechSynthesis' in window){
        const ut = new SpeechSynthesisUtterance(last.text);
        speechSynthesis.cancel();
        speechSynthesis.speak(ut);
    } else alert("TTS not supported");
}
ttsBtn.onclick = ttsReadLast;

// send flow
async function send(){
    const text = inputEl.value.trim();
    if(!text) return;
    pushMessage("user", text);
    inputEl.value = "";
    const typingRow = addTypingRow();

    try{
        const res = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({prompt:text}) });
        const data = await res.json();
        typingRow.remove();
        pushMessage("ai", data.reply || "(no reply)");
    }catch(e){
        typingRow.remove();
        pushMessage("ai", "Error: "+e.message);
    }
}

// file upload: read text and append as system prompt help
fileInput.addEventListener("change", async (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    const text = await f.text();
    // add system-like message into chat to give context
    pushMessage("user", "[file uploaded: "+f.name+"]");
    pushMessage("ai", "(file content attached to the last user message; you may ask the AI to reference it)");
    // store the file content in sessionStorage keyed by chat id
    sessionStorage.setItem("file_"+activeChatId, text.slice(0,20000)); // cap 20k chars
})

// dashboard and stats
function computeStats(){
    const totalChats = chats.length;
    let totalMsgs = 0; let totalUser=0; let totalAI=0;
    chats.forEach(c=>{ totalMsgs += c.messages.length; totalUser += c.messages.filter(m=>m.role==="user").length; totalAI += c.messages.filter(m=>m.role==="ai").length; });
    return { totalChats, totalMsgs, totalUser, totalAI, lastUpdated: new Date().toLocaleString() };
}
openDashboard.onclick = ()=>{
    const s = computeStats();
    statsEl.innerHTML = `<p>Total chats: <strong>${s.totalChats}</strong></p>
                         <p>Total messages: <strong>${s.totalMsgs}</strong></p>
                         <p>User messages: <strong>${s.totalUser}</strong></p>
                         <p>AI messages: <strong>${s.totalAI}</strong></p>
                         <p>Last updated: ${s.lastUpdated}</p>`;
    dashboard.classList.remove("hidden");
}
if(closeDashboard) closeDashboard.onclick = ()=> dashboard.classList.add("hidden");
if(document.getElementById("closeDashboard")) document.getElementById("closeDashboard").onclick = ()=> dashboard.classList.add("hidden");

// new chat, export, rename, delete, clear
newChatBtn.onclick = ()=> createNewChat();
exportBtn.onclick = ()=> exportAll();
clearChatBtn.onclick = ()=> { if(confirm("Clear conversation?")) clearActiveChat(); }
renameChatBtn.onclick = ()=> renameActiveChat();
deleteChatBtn.onclick = ()=> { if(confirm("Delete this chat?")) deleteActiveChat(); }
clearAllBtn.onclick = ()=> { if(confirm("Clear ALL chats? This cannot be undone.")){ chats=[]; activeChatId=null; createNewChat(); saveAll(); renderChatList(); renderActiveChat(); } }

searchChats.addEventListener("input", ()=> renderChatList(searchChats.value));

// theme
function applyTheme(light){
    if(light) document.body.classList.add("light");
    else document.body.classList.remove("light");
    localStorage.setItem("theme_light", !!light);
    themeToggle.textContent = light ? "☀️" : "🌙";
}
themeToggle.onclick = ()=> { applyTheme(!document.body.classList.contains("light")); };
applyTheme(localStorage.getItem("theme_light")==="true");

// service worker register PWA
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/service-worker.js').then(()=>console.log("SW registered")).catch(e=>console.warn("SW failed",e));
}

// initial load
loadAll();
renderChatList();

// ensure an active chat exists
if(!activeChatId) createNewChat();
renderActiveChat();

// keyboard shortcuts
document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape") { dashboard.classList.add("hidden"); }
    if((e.ctrlKey||e.metaKey) && e.key==="k"){ e.preventDefault(); inputEl.focus(); }
});



// Load runtime config (YouTube ID and social links) from server
async function loadConfigAndRender(){
    try{
        const r = await fetch("/config");
        const cfg = await r.json();
        // render YouTube if provided
        const header = document.getElementById("conversationHeader") || document.body;
        let ytWrap = document.getElementById("youtube_wrap");
        if(!ytWrap){
            ytWrap = document.createElement("div");
            ytWrap.id = "youtube_wrap";
            ytWrap.style.margin = "12px 20px";
            header.parentNode.insertBefore(ytWrap, header.nextSibling);
        }
        ytWrap.innerHTML = "";
        if(cfg.youtubeVideoId){
            const iframe = document.createElement("iframe");
            iframe.width = "320";
            iframe.height = "180";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.src = "https://www.youtube.com/embed/" + encodeURIComponent(cfg.youtubeVideoId);
            ytWrap.appendChild(iframe);
        } else {
            ytWrap.innerHTML = '<div style="color:var(--muted)">No YouTube video configured. Set YOUTUBE_VIDEO_ID in Render env.</div>';
        }

        // social links
        let socialWrap = document.getElementById("social_wrap");
        if(!socialWrap){
            socialWrap = document.createElement("div");
            socialWrap.id = "social_wrap";
            socialWrap.style.margin = "6px 20px 24px 20px";
            header.parentNode.insertBefore(socialWrap, header.nextSibling);
        }
        socialWrap.innerHTML = "";
        const s = cfg.social || {};
        const links = [];
        if(s.twitter) links.push({k:"Twitter",u:s.twitter});
        if(s.instagram) links.push({k:"Instagram",u:s.instagram});
        if(s.facebook) links.push({k:"Facebook",u:s.facebook});
        if(s.youtubeChannel) links.push({k:"YouTube",u:s.youtubeChannel});
        if(links.length){
            links.forEach(li=>{
                const a = document.createElement("a");
                a.href = li.u;
                a.target = "_blank";
                a.rel = "noopener";
                a.style.marginRight = "12px";
                a.textContent = li.k;
                socialWrap.appendChild(a);
            });
        } else {
            socialWrap.innerHTML = '<div style="color:var(--muted)">No social links configured.</div>';
        }
    }catch(e){
        console.warn("Could not load config", e);
    }
}
loadConfigAndRender();
