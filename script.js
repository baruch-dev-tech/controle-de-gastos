const STORAGE_KEY = "gastos:transacoes";
const CATEGORIAS = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros",
];

// ---------- Elementos ----------
const form = document.getElementById("form");
const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const selectTipo = document.getElementById("tipo");
const selectCategoria = document.getElementById("categoria");
const inputData = document.getElementById("data");
const filtroMes = document.getElementById("filtro-mes");
const tituloForm = document.getElementById("titulo-form");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const canvasGrafico = document.getElementById("grafico");

const elSaldo = document.getElementById("saldo");
const elReceitas = document.getElementById("receitas");
const elDespesas = document.getElementById("despesas");
const elCategorias = document.getElementById("categorias");
const elLista = document.getElementById("lista");
const elVazio = document.getElementById("vazio");

// ---------- Estado ----------
let transacoes = carregar();
let editandoId = null; // id da transação em edição (null = criando nova)
let grafico = null; // instância do Chart.js

// ---------- Persistência ----------
function carregar() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
}

// ---------- Utilitários ----------
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// "2026-10-16" -> "16/10/2026" (sem usar Date, evita problema de fuso horário)
function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Data de hoje no fuso local, no formato YYYY-MM-DD
function hojeISO() {
  return new Date().toLocaleDateString("sv-SE");
}

// ---------- Inicialização da interface ----------
function iniciar() {
  CATEGORIAS.forEach((nome) => {
    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    selectCategoria.appendChild(opcao);
  });

  const hoje = hojeISO();
  inputData.value = hoje;
  filtroMes.value = hoje.slice(0, 7);

  render();
}

// Receita não tem categoria: desabilita o select quando o tipo é receita
selectTipo.addEventListener("change", () => {
  selectCategoria.disabled = selectTipo.value === "receita";
});

filtroMes.addEventListener("change", render);

form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valor = parseFloat(inputValor.value);
  const descricao = inputDescricao.value.trim();

  if (!descricao || !(valor > 0) || !inputData.value) return;

  const tipo = selectTipo.value;
  const dados = {
    descricao,
    valor,
    tipo,
    categoria: tipo === "despesa" ? selectCategoria.value : "Receita",
    data: inputData.value,
  };

  if (editandoId !== null) {
    transacoes = transacoes.map((t) =>
      t.id === editandoId ? { ...t, ...dados } : t
    );
  } else {
    transacoes.push({ id: Date.now(), ...dados });
  }

  salvar();

  // Se a data da transação for de outro mês, mostra esse mês
  filtroMes.value = inputData.value.slice(0, 7);

  sairDoModoEdicao();
  inputDescricao.focus();
  render();
});

btnCancelar.addEventListener("click", sairDoModoEdicao);

function sairDoModoEdicao() {
  editandoId = null;
  form.reset();
  inputData.value = hojeISO();
  selectCategoria.disabled = false;
  tituloForm.textContent = "Nova transação";
  btnSalvar.textContent = "Adicionar";
  btnCancelar.hidden = true;
}

function iniciarEdicao(t) {
  editandoId = t.id;
  inputDescricao.value = t.descricao;
  inputValor.value = t.valor;
  selectTipo.value = t.tipo;
  selectCategoria.disabled = t.tipo === "receita";
  if (t.tipo === "despesa") selectCategoria.value = t.categoria;
  inputData.value = t.data;
  tituloForm.textContent = "Editar transação";
  btnSalvar.textContent = "Salvar alterações";
  btnCancelar.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  inputDescricao.focus();
}

function excluir(id) {
  if (id === editandoId) sairDoModoEdicao();
  transacoes = transacoes.filter((t) => t.id !== id);
  salvar();
  render();
}

// ---------- Renderização ----------
function render() {
  const mes = filtroMes.value; // "YYYY-MM" (vazio = todas)
  const doMes = transacoes
    .filter((t) => t.data.startsWith(mes))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

  renderResumo(doMes);
  renderCategorias(doMes);
  renderLista(doMes);
}

function renderResumo(lista) {
  const receitas = lista
    .filter((t) => t.tipo === "receita")
    .reduce((soma, t) => soma + t.valor, 0);
  const despesas = lista
    .filter((t) => t.tipo === "despesa")
    .reduce((soma, t) => soma + t.valor, 0);
  const saldo = receitas - despesas;

  elReceitas.textContent = formatarMoeda(receitas);
  elDespesas.textContent = formatarMoeda(despesas);
  elSaldo.textContent = formatarMoeda(saldo);
  elSaldo.classList.toggle("negativo", saldo < 0);
}

function renderCategorias(lista) {
  const despesas = lista.filter((t) => t.tipo === "despesa");
  const totalDespesas = despesas.reduce((soma, t) => soma + t.valor, 0);

  elCategorias.replaceChildren();

  if (totalDespesas === 0) {
    atualizarGrafico([]);
    const p = document.createElement("p");
    p.className = "vazio";
    p.textContent = "Sem despesas neste mês.";
    elCategorias.appendChild(p);
    return;
  }

  // Soma por categoria
  const porCategoria = {};
  despesas.forEach((t) => {
    porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
  });

  const ordenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  atualizarGrafico(ordenadas);

  ordenadas.forEach(([nome, total]) => {
      const percentual = (total / totalDespesas) * 100;

      const linha = document.createElement("div");
      linha.className = "cat-linha";

      const info = document.createElement("div");
      info.className = "cat-info";

      const spanNome = document.createElement("span");
      spanNome.textContent = nome;

      const spanValor = document.createElement("span");
      spanValor.textContent = `${formatarMoeda(total)} (${percentual.toFixed(0)}%)`;

      info.append(spanNome, spanValor);

      const barra = document.createElement("div");
      barra.className = "cat-barra";
      const preenchimento = document.createElement("div");
      preenchimento.style.width = `${percentual}%`;
      barra.appendChild(preenchimento);

      linha.append(info, barra);
      elCategorias.appendChild(linha);
    });
}

const CORES = [
  "#2f6fed",
  "#d64545",
  "#1b9e5a",
  "#f5a524",
  "#8e5bd6",
  "#17a2b8",
  "#7b8794",
];

// dados: [["Alimentação", 350], ["Lazer", 120], ...]
function atualizarGrafico(dados) {
  const wrap = canvasGrafico.parentElement;

  // Se o CDN do Chart.js não carregou, só as barras são exibidas
  if (typeof Chart === "undefined") {
    wrap.hidden = true;
    return;
  }

  if (dados.length === 0) {
    if (grafico) {
      grafico.destroy();
      grafico = null;
    }
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;
  const labels = dados.map(([nome]) => nome);
  const valores = dados.map(([, total]) => total);

  if (grafico) {
    grafico.data.labels = labels;
    grafico.data.datasets[0].data = valores;
    grafico.update();
    return;
  }

  grafico = new Chart(canvasGrafico, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: valores, backgroundColor: CORES, borderWidth: 1 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatarMoeda(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderLista(lista) {
  elLista.replaceChildren();
  elVazio.hidden = lista.length > 0;

  lista.forEach((t) => {
    const li = document.createElement("li");
    li.className = "item";

    const info = document.createElement("div");
    info.className = "item-info";

    const desc = document.createElement("span");
    desc.className = "item-desc";
    desc.textContent = t.descricao;

    const meta = document.createElement("span");
    meta.className = "item-meta";
    meta.textContent = `${t.categoria} · ${formatarData(t.data)}`;

    info.append(desc, meta);

    const direita = document.createElement("div");
    direita.className = "item-direita";

    const valor = document.createElement("span");
    valor.className = `item-valor ${t.tipo}`;
    const sinal = t.tipo === "receita" ? "+" : "−";
    valor.textContent = `${sinal} ${formatarMoeda(t.valor)}`;

    const botao = document.createElement("button");
    botao.className = "btn-excluir";
    botao.type = "button";
    botao.textContent = "✕";
    botao.setAttribute("aria-label", `Excluir ${t.descricao}`);
    botao.addEventListener("click", () => excluir(t.id));

    const botaoEditar = document.createElement("button");
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.textContent = "✎";
    botaoEditar.setAttribute("aria-label", `Editar ${t.descricao}`);
    botaoEditar.addEventListener("click", () => iniciarEdicao(t));

    direita.append(valor, botaoEditar, botao);
    li.append(info, direita);
    elLista.appendChild(li);
  });
}

iniciar();
