/**
 * firebase-diag.js — Script de diagnóstico da integração Firebase
 *
 * Como usar (no console do browser, após abrir qualquer página do sistema):
 *   1. Certifique-se de estar em uma página que já inicializou o Firebase (ex: login.html)
 *   2. Abra o DevTools → Console
 *   3. Cole e execute: import('/js/firebase-diag.js')
 *
 * O script testa: config, SDK, conexão com Realtime Database e Auth.
 */

(async function diagnostico() {
  const OK  = '[DIAG ✅]';
  const ERR = '[DIAG ❌]';
  const INF = '[DIAG ℹ️]';

  console.group('=== Firebase Diagnóstico ===');

  // ── 1. Configuração ──────────────────────────────────────────────────────
  console.group('1. Configuração');
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg) {
    console.error(ERR, 'window.FIREBASE_CONFIG não encontrado. Inclua firebase-config.js antes deste script.');
    console.groupEnd(); console.groupEnd(); return;
  }
  const camposObrigatorios = ['apiKey','authDomain','databaseURL','projectId','storageBucket','messagingSenderId','appId'];
  let cfgOk = true;
  camposObrigatorios.forEach(function(campo) {
    if (cfg[campo]) {
      console.log(OK, campo + ':', cfg[campo]);
    } else {
      console.error(ERR, campo + ' está AUSENTE na configuração.');
      cfgOk = false;
    }
  });
  if (cfgOk) console.log(OK, 'Todos os campos obrigatórios presentes.');
  console.groupEnd();

  // ── 2. SDK ───────────────────────────────────────────────────────────────
  console.group('2. SDK Firebase');
  let app, auth, db;
  try {
    const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
    app = getApps().length ? getApp() : initializeApp(cfg);
    console.log(OK, 'App inicializado. Nome:', app.name, '| Projeto:', app.options.projectId);
  } catch(e) {
    console.error(ERR, 'Falha ao inicializar Firebase App:', e.message);
    console.groupEnd(); console.groupEnd(); return;
  }

  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js');
    auth = getAuth(app);
    console.log(OK, 'Auth inicializado. Usuário atual:', auth.currentUser ? auth.currentUser.email : '(nenhum — não autenticado)');
  } catch(e) {
    console.error(ERR, 'Falha ao inicializar Auth:', e.message);
  }

  try {
    const { getDatabase } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
    db = getDatabase(app);
    console.log(OK, 'Realtime Database inicializado. URL:', db.app.options.databaseURL);
  } catch(e) {
    console.error(ERR, 'Falha ao inicializar Realtime Database:', e.message);
    console.groupEnd(); console.groupEnd(); return;
  }
  console.groupEnd();

  // ── 3. Conexão (nó .info/connected) ─────────────────────────────────────
  console.group('3. Conexão com o Realtime Database');
  try {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
    const snap = await Promise.race([
      get(ref(db, '.info/connected')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout de 5s')), 5000))
    ]);
    const online = snap.val();
    if (online) {
      console.log(OK, 'Cliente conectado ao Firebase em tempo real.');
    } else {
      console.warn(INF, 'Cliente OFFLINE. Verifique rede ou regras de segurança.');
    }
  } catch(e) {
    console.error(ERR, 'Erro ao verificar conexão:', e.message);
  }
  console.groupEnd();

  // ── 4. Leitura no Firestore (admin/clinica) ──────────────────────────────
  console.group('4. Leitura de dados (admin/clinica)');
  try {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
    const snap = await Promise.race([
      get(ref(db, 'admin/clinica')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout de 5s')), 5000))
    ]);
    if (snap.exists()) {
      console.log(OK, 'Leitura de admin/clinica OK. Dados:', snap.val());
    } else {
      console.warn(INF, 'admin/clinica existe mas está vazio (null).');
    }
  } catch(e) {
    if (e.message && e.message.includes('permission')) {
      console.error(ERR, 'permission-denied em admin/clinica. Verifique as Security Rules ou faça login primeiro.');
    } else {
      console.error(ERR, 'Erro na leitura de admin/clinica:', e.message);
    }
  }
  console.groupEnd();

  // ── 5. Estado de autenticação ────────────────────────────────────────────
  console.group('5. Autenticação');
  if (auth && auth.currentUser) {
    console.log(OK, 'Usuário autenticado:', auth.currentUser.email, '| UID:', auth.currentUser.uid);
    try {
      const token = await auth.currentUser.getIdToken();
      console.log(OK, 'Token JWT válido (primeiros 20 chars):', token.substring(0, 20) + '...');
    } catch(e) {
      console.error(ERR, 'Falha ao obter token JWT:', e.message);
    }
  } else {
    console.warn(INF, 'Nenhum usuário autenticado. Acesso a nós protegidos resultará em permission-denied.');
  }
  console.groupEnd();

  // ── Resumo ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('=== Diagnóstico concluído. Verifique os grupos acima para detalhes. ===');
  console.groupEnd();
})();
