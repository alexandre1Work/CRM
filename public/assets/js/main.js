async function carregarClientes() {
  try {
    const response = await fetch("/clientes");
    const clientes = await response.json();

    const tabela = document.getElementById("clientes-tabela");
    tabela.innerHTML = ""; // Limpa a tabela antes de adicionar novos clientes
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
    ${
      cliente.categorias && cliente.categorias.trim()
        ? cliente.categorias.split(",").map((cat) => {
            const [catId, catName] = cat.split("|");
            return `
              <span class="itemTag bg-blue-100 text-blue-800 px-2 py-1 rounded-full cursor-pointer" data-id="${catId}">
                ${catName} 
                <span onclick="removerTag(event, ${cliente.id_cliente}, ${catId})" class="text-blue-500 ml-1 cursor-pointer">x</span>
              </span>`;
          }).join("")
        : `<span class="cursor-pointer bg-red-100 px-2 py-1 rounded-full" onclick="abrirModalTags(${cliente.id_cliente})">Sem Tag</span>`
    }
  </div>
</td>
      `;
      tabela.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

async function removerTag(event, clienteId, tagId) {
  event.stopPropagation();
  try {
     const response = await fetch(`/clientes/${clienteId}/tags/${tagId}`, { method: "DELETE" });
     if (!response.ok) throw new Error(`Erro ao remover tag: ${response.status}`);
     carregarClientes();
  } catch (error) { console.error("Erro ao remover tag:", error); }
}


function abrirModalTags(clienteId) {
  document.getElementById("tags-modal").classList.remove("hidden");
  carregarTags();

  const atribuirTagButton = document.getElementById("atribuir-tag-button");
  atribuirTagButton.onclick = () => {
    atribuirTag(clienteId);
  };
}

function fecharModalTags() {
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
    select.innerHTML = "";

    tags.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag.id_categoria;
      option.textContent = tag.nome_categoria;
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
    // Verifica se a tag já existe para o cliente
    const verificarTagResponse = await fetch(`/clientes/${clienteId}/tags/${tagId}`);
    if (verificarTagResponse.ok) {
      alert("Tag já atribuída ao cliente.");
      return;
    }

    const response = await fetch(`/clientes/${clienteId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_categoria: tagId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao atribuir tag: ${response.status} - ${errorText}`);
    }

    fecharModalTags();
    carregarClientes();
  } catch (error) {
    console.error("Erro ao atribuir tag:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
});