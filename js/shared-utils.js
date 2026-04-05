/*
 * shared-utils.js — utilitários compartilhados entre todas as páginas
 * Incluir APÓS firebase-config.js
 */

/* Escapa HTML para evitar XSS em interpolações de innerHTML */
window.esc = function(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
};

/* Navegação robusta — funciona em GitHub Pages e subdiretórios */
window.irPara = function(arquivo) {
  var href = window.location.href.split('?')[0].split('#')[0];
  var base = href.substring(0, href.lastIndexOf('/') + 1);
  window.location.replace(base + arquivo);
};

/* Máscara de moeda brasileira */
window.mascaraMoeda = function(el) {
  var v = el.value.replace(/\D/g,'');
  v = (parseInt(v || '0', 10) / 100).toFixed(2) + '';
  v = v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  el.value = v;
};

/* Formata número como moeda */
window.fmtMoeda = function(v) {
  return Number(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/* Debounce — evita chamadas excessivas em eventos de input */
window.debounce = function(fn, delay) {
  var t;
  return function() {
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(this, args); }, delay);
  };
};

/* Toast de notificação */
window.toast = function(msg, tipo) {
  tipo = tipo || 'info';
  var box = document.getElementById('toastBox');
  if (!box) return;
  var t = document.createElement('div');
  t.className = 'toast ' + tipo;
  var icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' };
  t.innerHTML = '<i class="fas ' + (icons[tipo] || icons.info) + '"></i> ' + esc(msg);
  box.appendChild(t);
  setTimeout(function() { t.remove(); }, 3500);
};

/* Valida e-mail */
window.validarEmail = function(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* Valida CPF */
window.validarCPF = function(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  var s = 0;
  for (var i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  var r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  s = 0;
  for (var i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
};

/* Formata CPF: 00000000000 → 000.000.000-00 */
window.formatCPF = function(cpf) {
  return String(cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/* Popula um <select> com atendentes buscados do Firebase
 * Uso: await populateAtendentesSelect('meuSelectId')
 * Requer que o Firebase já esteja inicializado na página
 */
window.populateAtendentesSelect = async function(selectId, selectedValue) {
  var el = document.getElementById(selectId);
  if (!el) return;
  try {
    var r = await fetch('https://clinica-pirituba-default-rtdb.firebaseio.com/admin/atendentes.json');
    var d = await r.json();
    var lista = d ? Object.values(d).map(function(a) { return a.apelido || a.nome; }).sort() : [];
    var prev = el.options[0] ? el.options[0].textContent : 'Selecione...';
    el.innerHTML = '<option value="">' + prev + '</option>';
    lista.forEach(function(nome) {
      var opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      if (selectedValue && nome === selectedValue) opt.selected = true;
      el.appendChild(opt);
    });
  } catch(e) {
    console.warn('[populateAtendentesSelect] Erro ao buscar atendentes:', e.message);
  }
};

/* Carrega logo do Firebase com cache em sessionStorage */
window.carregarLogoGlobal = async function(seletores) {
  try {
    var cached = sessionStorage.getItem('logoDataUrl');
    var cachedVer = sessionStorage.getItem('logoVersao');
    if (!cached) {
      var r = await fetch('https://clinica-pirituba-default-rtdb.firebaseio.com/admin/logo.json');
      var d = await r.json();
      if (d && d.dataUrl) {
        var ver = d.versao || d.atualizadoEm || '';
        if (cachedVer !== ver) {
          sessionStorage.setItem('logoDataUrl', d.dataUrl);
          sessionStorage.setItem('logoVersao', ver);
        }
        cached = d.dataUrl;
      }
    }
    if (cached) {
      (seletores || ['.logo-icon img','#headerLogo','#logoPreviewAdmin']).forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(img) { img.src = cached; });
      });
    }
  } catch(e) {
    console.warn('[carregarLogoGlobal]:', e.message);
  }
};
