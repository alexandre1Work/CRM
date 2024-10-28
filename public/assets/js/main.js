
async function carregarClientes() {
  try {
    const response = await fetch("/clientes"); 
    const clientes = await response.json();
    const tabela = document.getElementById("clientes-tabela");
    tabela.innerHTML = ''


    clientes.forEach((cliente) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td class="py-2 px-1 text-center"><input type="checkbox" name="" id=""></td>
      <td class="px-4 py-2 text-center">${cliente.nome_completo}</td>
      <td class="px-4 py-2 text-center">${cliente.telefone}</td>
      <td class="px-4 py-2 text-center">${cliente.email}</td>
      <td class="px-4 py-2 text-center">${cliente.ultimo_contato} Dias</td>
      <td class="px-4 py-2 text-center" data-id="${cliente.id_cliente}" onclick="abrirModalTags(this.dataset.id)">
        <div class="listaTags">
          ${cliente.categorias
            .split(",")
            .map(
              (cat) =>
                `<span class="itemTag bg-blue-100 text-blue-800 px-2 py-1 rounded-full cursor-pointer">${cat}</span>`
            )
            .join("")}
        </div>
      </td>
    `;
      tabela.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

function abrirModalTags(clienteId) {
  console.log("Abrindo modal para o cliente ID:", clienteId); // Debug: verifique o ID aqui
  document.getElementById("tags-modal").classList.remove("hidden");
  carregarTags(); // Carrega tags existentes no select do modal

  // Atualiza a função de atribuição com o ID do cliente
  const atribuirTagButton = document.getElementById("atribuir-tag-button");
  atribuirTagButton.onclick = () => {
    console.log("Atribuindo tag para o cliente ID:", clienteId); // Debug: verifique o ID antes de atribuir
    atribuirTag(clienteId);
  };
}

function fecharModal() {
  document.getElementById("tags-modal").classList.add("hidden");
}

async function carregarTags() {
  try {
    const response = await fetch("/tags");
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const tags = await response.json();
    const select = document.getElementById("tagsExistentes");
    select.innerHTML = ""; // Limpa o select

    tags.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag.id_categoria; // ID da tag
      option.textContent = tag.nome_categoria; // Nome da tag
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar tags:", error);
  }
}

async function addTag() {
  const novaTag = document.getElementById("novaTag").value;
  if (!novaTag) return alert("Digite o nome da nova tag!");

  try {
    await fetch("/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome_categoria: novaTag }),
    });
    document.getElementById("novaTag").value = "";
    carregarTags();
  } catch (error) {
    console.error("Erro ao adicionar tag:", error);
  }
}

async function atribuirTag(clienteId) {
  const tagId = document.getElementById("tagsExistentes").value;
  if (!tagId) return alert("Selecione uma tag para atribuir!");

  try {
    const response = await fetch(`/clientes/${clienteId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_categoria: tagId }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atribuir tag: ${response.status}`);
    }

    fecharModal(); // Fecha o modal após a atribuição
    carregarClientes(); // Recarrega a tabela de clientes para atualizar as tags
  } catch (error) {
    console.error("Erro ao atribuir tag:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
});