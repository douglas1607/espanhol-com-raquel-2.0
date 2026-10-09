import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9spDOctgt3Q80ZEabR_B03VtvOc0SlYM",
  authDomain: "espanhol-com-raquel.firebaseapp.com",
  projectId: "espanhol-com-raquel",
  storageBucket: "espanhol-com-raquel.firebasestorage.app",
  messagingSenderId: "8766361156",
  appId: "1:8766361156:web:ca9c5e102c618be3cf3611",
  measurementId: "G-H44N647V8Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Inicializa o Player Plyr
const player = new Plyr('#player', {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
  captions: { active: false, update: false },
  settings: ['quality', 'speed'],
  quality: {
    default: 1080,
    options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240]
  },
  youtube: {
    noCookie: true,
    rel: 0,
    modestbranding: 1,
    iv_load_policy: 3,
    vq: 'hd1080'
  }
});

// Elementos HTML
const telaLogin = document.getElementById("tela-login");
const areaAluno = document.getElementById("area-aluno");
const formAuth = document.getElementById("form-auth");
const campoApelido = document.getElementById("campo-apelido");
const apelidoInput = document.getElementById("apelido");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const btnSubmit = document.getElementById("btn-submit");
const tituloForm = document.getElementById("titulo-form");
const msgBox = document.getElementById("mensagem");
const trocarModoBtn = document.getElementById("trocar-modo");

const userDisplayName = document.getElementById("user-display-name");
const userAvatar = document.getElementById("user-avatar");
const btnSair = document.getElementById("btn-sair");

const btnMenuMobile = document.getElementById("btn-menu-mobile");
const sidebar = document.getElementById("sidebar");
const menuOverlay = document.getElementById("menu-overlay");

const modulos = document.querySelectorAll(".modulo");
const semanas = document.querySelectorAll(".semana");
const itensAula = document.querySelectorAll(".lista-aulas li");
const tituloAula = document.getElementById("titulo-aula");
const descAula = document.getElementById("desc-aula");
const btnDownloadPdf = document.getElementById("btn-download-pdf");

const formComentario = document.getElementById("form-comentario");
const textoComentario = document.getElementById("texto-comentario");
const listaComentarios = document.getElementById("lista-comentarios");

// Elementos do Certificado
const cardGerarCertificado = document.getElementById("card-gerar-certificado");
const btnEmitirCertificado = document.getElementById("btn-emitir-certificado");
const inputNomeCertificado = document.getElementById("nome-certificado");
const certNomeAluno = document.getElementById("cert-nome-aluno");
const certDataEmissao = document.getElementById("cert-data-emissao");

let usuarioAtual = null;
let modoCadastro = false;
let aulaAtualId = "8TBQCKVAYaU";
let unsubscribeComentarios = null;

// Carrega o histórico de aulas visualizadas do aluno salvo no navegador
const aulasConcluidas = JSON.parse(localStorage.getItem("aulasVisualizadas") || "[]");

// Marca na interface as aulas que já foram concluídas previamente
itensAula.forEach(item => {
  const titulo = item.getAttribute("data-titulo");
  if (aulasConcluidas.includes(titulo)) {
    item.classList.add("visualizada");
  }
});

// Alterna entre Login e Cadastro
trocarModoBtn.addEventListener("click", () => {
  modoCadastro = !modoCadastro;
  if (modoCadastro) {
    tituloForm.textContent = "Cadastrar Aluno";
    btnSubmit.textContent = "Criar Conta";
    trocarModoBtn.textContent = "Já tem conta? Faça Login";
    campoApelido.style.display = "block";
    apelidoInput.setAttribute("required", "true");
  } else {
    tituloForm.textContent = "Login do Aluno";
    btnSubmit.textContent = "Entrar";
    trocarModoBtn.textContent = "Não tem conta? Cadastre-se";
    campoApelido.style.display = "none";
    apelidoInput.removeAttribute("required");
  }
  msgBox.textContent = "";
});

// Formulário de Login/Cadastro
formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgBox.textContent = "";

  try {
    if (modoCadastro) {
      const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, senhaInput.value);
      await updateProfile(userCredential.user, {
        displayName: apelidoInput.value.trim()
      });
      atualizarInterfaceUsuario(userCredential.user);
    } else {
      await signInWithEmailAndPassword(auth, emailInput.value, senhaInput.value);
    }
  } catch (error) {
    msgBox.textContent = "Erro: " + error.message;
  }
});

function atualizarInterfaceUsuario(user) {
  usuarioAtual = user;
  const nomeExibicao = user.displayName || user.email.split("@")[0];
  if (userDisplayName) userDisplayName.textContent = nomeExibicao;
  if (userAvatar) userAvatar.textContent = nomeExibicao.charAt(0).toUpperCase();
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    telaLogin.style.display = "none";
    areaAluno.style.display = "flex";
    atualizarInterfaceUsuario(user);
    carregarComentariosEmTempoReal(aulaAtualId);
  } else {
    telaLogin.style.display = "flex";
    areaAluno.style.display = "none";
  }
});

btnSair.addEventListener("click", () => signOut(auth));

// Menu Mobile
function toggleMenuMobile() {
  if (sidebar) sidebar.classList.toggle("aberto");
  if (menuOverlay) menuOverlay.classList.toggle("ativo");
}

if (btnMenuMobile) btnMenuMobile.addEventListener("click", toggleMenuMobile);
if (menuOverlay) menuOverlay.addEventListener("click", toggleMenuMobile);

// Accordion de Módulos (Níveis)
modulos.forEach(modulo => {
  const btnHeader = modulo.querySelector(".modulo-btn");
  if (btnHeader) {
    btnHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      modulo.classList.toggle("ativo");
    });
  }
});

// Accordion de Semanas
semanas.forEach(semana => {
  const btnSemana = semana.querySelector(".semana-btn");
  if (btnSemana) {
    btnSemana.addEventListener("click", (e) => {
      e.stopPropagation();
      semana.classList.toggle("ativo");
    });
  }
});

// Troca de Aulas, Vídeos, PDFs, Marcação de Concluídas e Comentários
itensAula.forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    itensAula.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");

    const tituloAulaAtual = item.getAttribute("data-titulo");
    item.classList.add("visualizada");

    if (!aulasConcluidas.includes(tituloAulaAtual)) {
      aulasConcluidas.push(tituloAulaAtual);
      localStorage.setItem("aulasVisualizadas", JSON.stringify(aulasConcluidas));
    }

    const videoId = item.getAttribute("data-video");
    const pdfUrl = item.getAttribute("data-pdf");

    aulaAtualId = videoId;

    if (tituloAula) tituloAula.textContent = item.getAttribute("data-titulo");
    if (descAula) descAula.textContent = item.getAttribute("data-desc");
    if (btnDownloadPdf && pdfUrl) btnDownloadPdf.setAttribute("href", pdfUrl);

    // Controle de exibição do card de Certificado
    if (item.id === "item-gerar-certificado" || (tituloAulaAtual && tituloAulaAtual.includes("Projeto Final de Conclusão"))) {
      if (cardGerarCertificado) cardGerarCertificado.style.display = "block";
      if (inputNomeCertificado && usuarioAtual) {
        inputNomeCertificado.value = usuarioAtual.displayName || "";
      }
    } else {
      if (cardGerarCertificado) cardGerarCertificado.style.display = "none";
    }

    player.source = {
      type: 'video',
      sources: [
        {
          src: videoId,
          provider: 'youtube',
        },
      ],
    };

    carregarComentariosEmTempoReal(aulaAtualId);

    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("aberto")) {
      toggleMenuMobile();
    }
  });
});

// Salvar comentário no Firebase Firestore
if (formComentario) {
  formComentario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = textoComentario.value.trim();
    if (!texto) return;

    const nomeAutor = usuarioAtual ? (usuarioAtual.displayName || usuarioAtual.email.split("@")[0]) : "Aluno";

    try {
      await addDoc(collection(db, "comentarios"), {
        aulaId: aulaAtualId,
        autor: nomeAutor,
        texto: texto,
        criadoEm: serverTimestamp()
      });
      textoComentario.value = "";
    } catch (error) {
      console.error("Erro ao salvar comentário:", error);
      alert("Erro ao enviar dúvida. Verifique sua conexão.");
    }
  });
}

// Carregar comentários salvos no Firebase em tempo real
function carregarComentariosEmTempoReal(aulaId) {
  if (unsubscribeComentarios) {
    unsubscribeComentarios();
  }

  const q = query(
    collection(db, "comentarios"),
    where("aulaId", "==", aulaId),
    orderBy("criadoEm", "desc")
  );

  unsubscribeComentarios = onSnapshot(q, (snapshot) => {
    listaComentarios.innerHTML = "";

    if (snapshot.empty) {
      listaComentarios.innerHTML = `<p style="font-size: 13px; color: #666;">Nenhuma dúvida cadastrada nesta aula ainda. Seja o primeiro a perguntar!</p>`;
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const dataFormatada = data.criadoEm
        ? new Date(data.criadoEm.toDate()).toLocaleDateString('pt-BR')
        : "Agora";

      const card = document.createElement("div");
      card.classList.add("comentario-item");
      card.innerHTML = `
        <div class="comentario-header">
          <strong>${data.autor}</strong>
          <span class="data-comentario">${dataFormatada}</span>
        </div>
        <p class="texto-comentario-conteudo">${data.texto}</p>
      `;
      listaComentarios.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao escutar comentários:", error);
  });
}

// Emissão e Download do Certificado em PDF
if (btnEmitirCertificado) {
  btnEmitirCertificado.addEventListener("click", () => {
    const nome = inputNomeCertificado.value.trim() || (usuarioAtual ? usuarioAtual.displayName : "Aluno");
    
    certNomeAluno.textContent = nome;
    certDataEmissao.textContent = new Date().toLocaleDateString('pt-BR');

    const elemento = document.getElementById("certificado-template");

    const opcoes = {
      margin: 0,
      filename: `Certificado_Espanhol_com_Raquel_${nome.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opcoes).from(elemento).save();
  });
}