/* Aurils — gerenciador de moedas de RPG (pt-BR) */
const MOEDAS = [
  { id:'platina', nome:'Platina', icone:'🔵', aurils:10,   abrev:'P'  },
  { id:'auril',   nome:'Auril',   icone:'🟡', aurils:1,    abrev:'A'  },
  { id:'prata',   nome:'Prata',   icone:'⚪', aurils:0.1,  abrev:'Pr' },
  { id:'copo',    nome:'Copo',    icone:'🟤', aurils:0.01, abrev:'C'  },
];
const M = Object.fromEntries(MOEDAS.map(m => [m.id, m]));
const KEY = 'aurils.campanha.v1';

const ITENS_BASE = [
  { id:'i1',  nome:'Poção de vida',        preco:2,   moeda:'auril', cat:'Consumível',  icone:'🧪' },
  { id:'i2',  nome:'Antídoto',             preco:5,   moeda:'prata', cat:'Consumível',  icone:'🍵' },
  { id:'i3',  nome:'Ração de viagem (1 dia)',preco:5, moeda:'prata', cat:'Consumível',  icone:'🥖' },
  { id:'i4',  nome:'Tocha',                preco:1,   moeda:'copo',  cat:'Equipamento', icone:'🔥' },
  { id:'i5',  nome:'Corda de cânhamo (15m)',preco:1,  moeda:'auril', cat:'Equipamento', icone:'🪢' },
  { id:'i6',  nome:'Mochila',              preco:2,   moeda:'auril', cat:'Equipamento', icone:'🎒' },
  { id:'i7',  nome:'Lanterna furta-fogo',  preco:10,  moeda:'auril', cat:'Equipamento', icone:'🏮' },
  { id:'i8',  nome:'Kit de ladrão',        preco:25,  moeda:'auril', cat:'Equipamento', icone:'🗝️' },
  { id:'i9',  nome:'Adaga',                preco:2,   moeda:'auril', cat:'Arma',        icone:'🗡️' },
  { id:'i10', nome:'Espada longa',         preco:15,  moeda:'auril', cat:'Arma',        icone:'⚔️' },
  { id:'i11', nome:'Arco longo',           preco:50,  moeda:'auril', cat:'Arma',        icone:'🏹' },
  { id:'i12', nome:'Escudo',               preco:10,  moeda:'auril', cat:'Armadura',    icone:'🛡️' },
  { id:'i13', nome:'Armadura de couro',    preco:10,  moeda:'auril', cat:'Armadura',    icone:'🥋' },
  { id:'i14', nome:'Cota de malha',        preco:120, moeda:'auril', cat:'Armadura',    icone:'🦺' },
  { id:'i15', nome:'Cavalo',               preco:150, moeda:'auril', cat:'Montaria',    icone:'🐎' },
  { id:'i16', nome:'Pernoite na estalagem', preco:8,  moeda:'prata', cat:'Serviço',     icone:'🛏️' },
  { id:'i17', nome:'Gema pequena',         preco:5,   moeda:'platina',cat:'Tesouro',    icone:'💎' },
];

let dados = carregar();

function carregar(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY));
    if(d && d.personagens) return d;
  }catch(e){}
  return { personagens:[], transacoes:[], itens:[] };
}
function salvar(){ localStorage.setItem(KEY, JSON.stringify(dados)); }
const uid = () => Math.random().toString(36).slice(2,10);

/* ---- conversões ---- */
const round2 = n => Math.round(n*100)/100;
function paraAurils(qtd, moeda){ return round2(qtd * M[moeda].aurils); }
function totalAurils(c){ return round2(MOEDAS.reduce((s,m)=> s + c.moedas[m.id]*m.aurils, 0)); }
function fmt(n){ return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtA(n){ return fmt(n)+' A'; }
/* decompõe aurils em moedas inteiras (troco) */
function decompor(aurils){
  let copos = Math.round(aurils*100), out = {};
  for(const m of MOEDAS){
    const v = Math.round(m.aurils*100);
    out[m.id] = Math.floor(copos / v);
    copos -= out[m.id]*v;
  }
  return out;
}
function trocoTexto(aurils){
  const d = decompor(Math.abs(aurils));
  const p = MOEDAS.filter(m=>d[m.id]>0).map(m=>`${d[m.id]} ${m.icone} ${m.nome}`);
  return p.length ? p.join('  ·  ') : '0 🟤 Copo';
}

/* ---- carteira ---- */
function podePagar(c, aurils){ return totalAurils(c) + 1e-9 >= aurils; }
function debitar(c, aurils){
  let copos = Math.round(totalAurils(c)*100) - Math.round(aurils*100);
  if(copos < 0) return false;
  const d = decompor(copos/100);
  MOEDAS.forEach(m => c.moedas[m.id] = d[m.id]);
  return true;
}
function creditar(c, aurils){
  const copos = Math.round(totalAurils(c)*100) + Math.round(aurils*100);
  const d = decompor(copos/100);
  MOEDAS.forEach(m => c.moedas[m.id] = d[m.id]);
}

/* ---- toast ---- */
let toastT;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---- abas ---- */
document.getElementById('tabs').addEventListener('click', e=>{
  const b = e.target.closest('.tab'); if(!b) return;
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('tab-'+b.dataset.tab).classList.add('active');
});

/* ---- selects de moeda ---- */
['txMoeda','itemMoeda','convMoeda'].forEach(id=>{
  document.getElementById(id).innerHTML =
    MOEDAS.map(m=>`<option value="${m.id}"${m.id==='auril'?' selected':''}>${m.icone} ${m.nome}</option>`).join('');
});

/* ---- render ---- */
function render(){
  renderChars(); renderSelects(); renderTx(); renderItens(); renderConv();
  document.getElementById('partyTotal').textContent =
    fmtA(round2(dados.personagens.reduce((s,c)=>s+totalAurils(c),0)));
  salvar();
}

function renderChars(){
  const el = document.getElementById('charList');
  if(!dados.personagens.length){
    el.innerHTML = '<div class="card empty">Nenhum herói recrutado ainda. Some ouro à mesa!</div>';
    return;
  }
  el.innerHTML = dados.personagens.map(c=>`
    <div class="char">
      <div class="char-head">
        <div><h3>${esc(c.nome)}</h3><small>${esc(c.classe||'Aventureiro(a)')}</small></div>
        <div class="char-total">${fmtA(totalAurils(c))}</div>
      </div>
      <div class="coins">
        ${MOEDAS.map(m=>`
          <div class="coin">
            <div class="cname">${m.icone} ${m.nome}</div>
            <div class="cval">${c.moedas[m.id]}</div>
            <div class="ctrl">
              <button data-ajuste="-1" data-c="${c.id}" data-m="${m.id}">−</button>
              <button data-ajuste="1" data-c="${c.id}" data-m="${m.id}">+</button>
            </div>
          </div>`).join('')}
      </div>
      <div class="char-foot">
        <small class="hint">Troco: ${trocoTexto(totalAurils(c))}</small>
        <button class="linkbtn" data-remover="${c.id}">dispensar</button>
      </div>
    </div>`).join('');
}

function renderSelects(){
  const opts = dados.personagens.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  ['txChar','mercadoChar'].forEach(id=>{
    const s = document.getElementById(id), old = s.value;
    s.innerHTML = opts || '<option value="">— recrute um personagem —</option>';
    if(old && dados.personagens.some(c=>c.id===old)) s.value = old;
  });
}

function renderTx(){
  const el = document.getElementById('txList');
  if(!dados.transacoes.length){ el.innerHTML='<div class="empty">Sem transações registradas.</div>'; return; }
  el.innerHTML = dados.transacoes.map(t=>{
    const c = dados.personagens.find(p=>p.id===t.charId);
    return `<div class="tx ${t.tipo}">
      <div>
        <div>${esc(t.desc||(t.tipo==='ganho'?'Ganho':'Gasto'))}</div>
        <div class="who">${esc(c?c.nome:'(removido)')} · ${new Date(t.data).toLocaleString('pt-BR')}</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="amt">${t.tipo==='ganho'?'+':'−'}${fmtA(t.aurils)}</span>
        <button class="linkbtn" data-desfazer="${t.id}">desfazer</button>
      </div>
    </div>`;
  }).join('');
}

function renderItens(){
  const busca = document.getElementById('buscaItem').value.trim().toLowerCase();
  const todos = [...ITENS_BASE, ...dados.itens];
  const lista = todos.filter(i => !busca || i.nome.toLowerCase().includes(busca) || i.cat.toLowerCase().includes(busca));
  const el = document.getElementById('itemList');
  if(!lista.length){ el.innerHTML='<div class="card empty">Nenhum item encontrado.</div>'; return; }
  el.innerHTML = lista.map(i=>{
    const a = paraAurils(i.preco, i.moeda);
    return `<div class="item">
      <div class="ih"><span class="ic">${i.icone||'✨'}</span>
        <div><b>${esc(i.nome)}</b><div class="cat">${esc(i.cat)}</div></div></div>
      <div class="price">${i.preco} ${M[i.moeda].icone} ${M[i.moeda].nome} <span style="color:var(--dim);font-weight:400">= ${fmtA(a)}</span></div>
      <div class="acts">
        <button class="buy" data-comprar="${a}" data-nome="${esc(i.nome)}">Comprar</button>
        <button class="sell" data-vender="${round2(a*0.5)}" data-nome="${esc(i.nome)}">Vender 50%</button>
      </div>
    </div>`;
  }).join('');
}

function renderConv(){
  const v = parseFloat(document.getElementById('convVal').value)||0;
  const moeda = document.getElementById('convMoeda').value;
  const a = v * M[moeda].aurils;
  document.getElementById('convOut').innerHTML = MOEDAS.map(m=>
    `<div><span>${m.icone} ${m.nome}</span><b>${fmt(a/m.aurils)}</b></div>`).join('');
  document.getElementById('convTroco').textContent = trocoTexto(a);
}

const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---- eventos ---- */
document.getElementById('formChar').addEventListener('submit', e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  dados.personagens.push({
    id:uid(), nome:f.get('nome').trim(), classe:f.get('classe').trim(),
    moedas:Object.fromEntries(MOEDAS.map(m=>[m.id, Math.max(0, parseInt(f.get(m.id))||0)]))
  });
  e.target.reset();
  MOEDAS.forEach(m=>e.target[m.id].value=0);
  render(); toast('Personagem recrutado!');
});

document.getElementById('charList').addEventListener('click', e=>{
  const aj = e.target.closest('[data-ajuste]');
  if(aj){
    const c = dados.personagens.find(p=>p.id===aj.dataset.c);
    c.moedas[aj.dataset.m] = Math.max(0, c.moedas[aj.dataset.m] + (+aj.dataset.ajuste));
    render(); return;
  }
  const rm = e.target.closest('[data-remover]');
  if(rm && confirm('Dispensar este personagem?')){
    dados.personagens = dados.personagens.filter(p=>p.id!==rm.dataset.remover);
    render(); toast('Personagem dispensado.');
  }
});

document.getElementById('formTx').addEventListener('submit', e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const c = dados.personagens.find(p=>p.id===f.get('charId'));
  if(!c) return toast('Recrute um personagem primeiro.');
  const a = paraAurils(parseFloat(f.get('qtd'))||0, f.get('moeda'));
  if(a<=0) return toast('Informe um valor válido.');
  aplicar(c, f.get('tipo'), a, f.get('desc').trim());
  e.target.desc.value='';
});

function aplicar(c, tipo, aurils, desc){
  if(tipo==='gasto'){
    if(!podePagar(c, aurils)) return toast('Tesouro insuficiente!');
    debitar(c, aurils);
  } else creditar(c, aurils);
  dados.transacoes.unshift({ id:uid(), charId:c.id, tipo, aurils, desc, data:Date.now() });
  render();
  toast((tipo==='ganho'?'Ganho de ':'Gasto de ')+fmtA(aurils)+' registrado.');
}

document.getElementById('txList').addEventListener('click', e=>{
  const b = e.target.closest('[data-desfazer]'); if(!b) return;
  const t = dados.transacoes.find(x=>x.id===b.dataset.desfazer);
  const c = dados.personagens.find(p=>p.id===t.charId);
  if(c){
    if(t.tipo==='ganho'){
      if(!podePagar(c,t.aurils)) return toast('Não há moedas suficientes para desfazer.');
      debitar(c,t.aurils);
    } else creditar(c,t.aurils);
  }
  dados.transacoes = dados.transacoes.filter(x=>x.id!==t.id);
  render(); toast('Transação desfeita.');
});

document.getElementById('itemList').addEventListener('click', e=>{
  const b = e.target.closest('[data-comprar],[data-vender]'); if(!b) return;
  const c = dados.personagens.find(p=>p.id===document.getElementById('mercadoChar').value);
  if(!c) return toast('Escolha um personagem no topo do mercado.');
  if(b.dataset.comprar) aplicar(c,'gasto', round2(+b.dataset.comprar), 'Compra: '+b.dataset.nome);
  else aplicar(c,'ganho', round2(+b.dataset.vender), 'Venda: '+b.dataset.nome);
});

document.getElementById('buscaItem').addEventListener('input', renderItens);

document.getElementById('formItem').addEventListener('submit', e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  dados.itens.push({ id:uid(), nome:f.get('nome').trim(), preco:parseFloat(f.get('preco'))||0,
    moeda:f.get('moeda'), cat:f.get('cat'), icone:f.get('icone')||'✨' });
  e.target.reset(); document.getElementById('itemMoeda').value='auril';
  render(); toast('Item adicionado ao mercado.');
});

['convVal','convMoeda'].forEach(id=>document.getElementById(id).addEventListener('input', renderConv));

document.getElementById('btnExport').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(dados,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'aurils-campanha-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('Backup exportado.');
});
document.getElementById('btnImport').addEventListener('click', ()=>document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if(!d.personagens) throw 0;
      dados = { personagens:d.personagens||[], transacoes:d.transacoes||[], itens:d.itens||[] };
      render(); toast('Campanha importada!');
    }catch(err){ toast('Arquivo inválido.'); }
  };
  r.readAsText(file); e.target.value='';
});
document.getElementById('btnReset').addEventListener('click', ()=>{
  if(confirm('Apagar toda a campanha? Isso não pode ser desfeito.')){
    dados = { personagens:[], transacoes:[], itens:[] };
    render(); toast('Campanha recomeçada.');
  }
});

render();
