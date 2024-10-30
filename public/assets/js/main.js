

async function carregarClientes() {
  try {
    const response = await fetch("/clientes");
    const clientes = await response.json();
    const tabela = document.getElementById("clientes-tabela");
    tabela.innerHTML = ""; 

    clientes.forEach((cliente) => {
      const row = document.createElement("tr");
      row.onclick = () => abrirModalEditar(cliente.id_cliente)
      row.classList.add('hover:bg-gray-50')
      row.innerHTML = `
        <td class="py-2 px-1 text-center cursor-pointer">
          <input type="checkbox" name="" class="cliente-checkbox" id="checkbox-${cliente.id_cliente}" data-cliente-id="${cliente.id_cliente}">
        </td>
        <td class="px-4 py-2 text-center cursor-pointer">${cliente.nome_completo}</td>
        <td class="px-4 py-2 text-center cursor-pointer">${cliente.telefone}</td>
        <td class="px-4 py-2 text-center cursor-pointer">${cliente.email}</td>
        <td class="px-4 py-2 text-center cursor-pointer">${cliente.ultimo_contato} Dias</td>
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
    atualizarListenersCheckboxes()
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

async function removerClientes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  const idsParaExcluir = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-cliente-id'));

  if (!confirm("Tem certeza que deseja excluir os clientes selecionados?")) {
      return;
  }

  try {
      const promises = idsParaExcluir.map(id_cliente => {
          return fetch(`/clientes/${id_cliente}`, {
              method: 'DELETE'
          });
      });

      // Aguarda todas as promessas de exclusão serem resolvidas
      await Promise.all(promises);

      alert("Clientes excluídos com sucesso!");
      // Atualizar a tabela de clientes, se necessário
      // Você pode chamar uma função para recarregar a lista de clientes aqui
      carregarClientes();
  } catch (error) {
      console.error("Erro ao excluir clientes:", error);
      alert("Erro ao excluir clientes");
  }
}

async function cadastrarCliente() {
  const nomeCompleto = document.getElementById("nomeCompleto").value;
  const telefone = document.getElementById("telefone").value;
  const email = document.getElementById("email").value;

  try {
      const response = await fetch('/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome_completo: nomeCompleto, telefone, email })
      });

      if (response.ok) {
          const newCliente = await response.json();
          console.log("Cliente cadastrado:", newCliente);
          alert("Cliente cadastrado com sucesso!");
          fecharModalCadastro();
          carregarClientes()
      } else {
          throw new Error('Erro ao cadastrar cliente');
      }
  } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      alert("Erro ao cadastrar cliente");
  }
}

function abrirModalCadastroCliente(){
  document.getElementById('modal-cadastro-cliente').classList.remove('hidden')
}

function fecharModalCadastro() {
  document.getElementById("modal-cadastro-cliente").classList.add("hidden");
  document.getElementById("nomeCompleto").value = '';
  document.getElementById("telefone").value = '';
  document.getElementById("email").value = '';
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

function abrirModalEditar(id_cliente) {
  fetch(`/clientes/${id_cliente}`)
      .then(response => {
          if (!response.ok) {
              throw new Error("Erro ao buscar dados do cliente.");
          }
          return response.json();
      })
      .then(cliente => {
          document.getElementById('nomeCliente').value = cliente.nome_completo;
          document.getElementById('telefoneCliente').value = cliente.telefone;
          document.getElementById('emailCliente').value = cliente.email;
          document.getElementById('idCliente').value = cliente.id_cliente; // ID do cliente
          document.getElementById('modalEditar').classList.remove('hidden'); // Exibir modal
      })
      .catch(error => {
          console.error("Erro ao buscar dados do cliente:", error);
          alert("Erro ao buscar dados do cliente.");
      });
}

function salvarEdicoes() {
  const id_cliente = document.getElementById('idCliente').value;
  const nome = document.getElementById('nomeCliente').value;
  const telefone = document.getElementById('telefoneCliente').value;
  const email = document.getElementById('emailCliente').value;

  const clienteAtualizado = { nome_completo: nome, telefone, email };

  fetch(`/clientes/${id_cliente}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(clienteAtualizado)
  })
  .then(response => {
      if (!response.ok) throw new Error('Erro ao atualizar cliente');
      return response.json();
  })
  .then(data => {
      alert("Cliente atualizado com sucesso!");
      carregarClientes(); // Atualiza a tabela de clientes
      fecharModalEditar(); // Fecha o modal
  })
  .catch(error => {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar cliente.");
  });
}

function fecharModalEditar() {
  document.getElementById('modalEditar').classList.add('hidden');
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

async function criarTemplateMensagem() {
  const titulo = document.getElementById("tituloMensagem").value;
  const corpo = document.getElementById("corpoMensagem").value;

  if (!titulo || !corpo) {
    return alert("Preencha todos os campos!");
  }

  try {
    await fetch("/mensagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, corpo }),
    });

    document.getElementById("tituloMensagem").value = "";
    document.getElementById("corpoMensagem").value = "";
    fecharModalMensagem();
  } catch (error) {
    console.error("Erro ao criar template de mensagem:", error);
  }
}

async function enviarMensagens() {
  const clientesSelecionados = Array.from(document.querySelectorAll('.cliente-checkbox:checked'))
    .map(checkbox => checkbox.getAttribute('data-cliente-id')); 

  if (clientesSelecionados.length === 0) {
    return alert("Nenhum cliente selecionado!");
  }

  const templateId = document.getElementById("templatesMensagens").value; 

  try {
    await fetch(`/mensagens/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientes: clientesSelecionados, templateId }),
    });

    alert("Mensagens enviadas com sucesso!");
    fecharModalTemplate(); 

  } catch (error) {
    console.error("Erro ao enviar mensagens:", error);
  }
}

async function abrirModalSelecaoTemplate() {
  const selectTemplate = document.getElementById("templatesMensagens");
  selectTemplate.innerHTML = ""; 

  try {
    const response = await fetch('/mensagens');
    const templates = await response.json();

    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id_mensagem;
      option.textContent = template.titulo; 
      selectTemplate.appendChild(option);
    });

    document.getElementById("select-template-modal").classList.remove("hidden");
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
  }
}
function fecharModalTemplate() {
  document.getElementById("select-template-modal").classList.add("hidden");
}

function fecharModalMensagem() {
  document.getElementById("mensagem-modal").classList.add("hidden");
}

function abrirModalMensagem() {
  document.getElementById("mensagem-modal").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
});

const atualizarListenersCheckboxes = () => {
  const checkboxes = document.querySelectorAll('.cliente-checkbox');
  const buttons = document.querySelectorAll('.botaoDisabled');

  const updateButtonState = () => {
      const anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
      buttons.forEach(button => {
          button.disabled = !anyChecked; // Habilita ou desabilita os botões
      });
  };

  // Adiciona o listener para cada checkbox
  checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateButtonState);
  });

  // Chama a função para definir o estado dos botões
  updateButtonState();
};