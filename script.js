import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// Inicializa o Player Plyr permitindo a seleção de qualidade
const player = new Plyr('#player', {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
  captions: { active: false, update: false },
  settings: ['quality', 'speed'], // Ativa o menu de qualidade e velocidade
  quality: {
    default: 1080,
    options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240]
  },
  youtube: {
    noCookie: true,
    rel: 0,
    modestbranding: 1,
    iv_load_policy: 3,
    vq: 'hd1080' // Força a tentativa de carregamento inicial em HD (1080p)

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
const itensAula = document.querySelectorAll(".lista-aulas li");
const tituloAula = document.getElementById("titulo-aula");
const descAula = document.getElementById("desc-aula");

let modoCadastro = false;

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
  const nomeExibicao = user.displayName || user.email.split("@")[0];
  if (userDisplayName) userDisplayName.textContent = nomeExibicao;
  if (userAvatar) userAvatar.textContent = nomeExibicao.charAt(0).toUpperCase();
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    telaLogin.style.display = "none";
    areaAluno.style.display = "flex";
    atualizarInterfaceUsuario(user);
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

// Accordion Módulos
modulos.forEach(modulo => {
  const btnHeader = modulo.querySelector(".modulo-btn");
  if (btnHeader) {
    btnHeader.addEventListener("click", () => {
      modulo.classList.toggle("ativo");
    });
  }
});

// Troca de Aulas e Troca de Vídeo no Plyr
itensAula.forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    itensAula.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");

    const videoId = item.getAttribute("data-video");
    if (tituloAula) tituloAula.textContent = item.getAttribute("data-titulo");
    if (descAula) descAula.textContent = item.getAttribute("data-desc");

    // Atualiza a fonte do vídeo no Plyr dinamicamente
    player.source = {
      type: 'video',
      sources: [
        {
          src: videoId,
          provider: 'youtube',
        },
      ],
    };

    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("aberto")) {
      toggleMenuMobile();
    }
  });
});