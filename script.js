document.addEventListener("DOMContentLoaded", function() {
  // 1. Formatação do campo "Valor da conta" para moeda brasileira (BRL)
  const valorInput = document.getElementById('valor');
  valorInput.addEventListener('input', function () {
    let value = this.value.replace(/\D/g, '');
    if (value === '') {
      this.value = '';
      return;
    }
    const numericValue = parseInt(value, 10);
    this.value = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue / 100);
  });

  // 2. Formatação automática para CPF/CNPJ
  const cpfCnpjInput = document.getElementById('cnpj');
  cpfCnpjInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (!value) {
      e.target.value = '';
      return;
    }
    if (value.length <= 11) {
      value = value.substring(0, 11);
      value = value.replace(/^(\d{3})(\d)/, '$1.$2');
      value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    } else {
      value = value.substring(0, 14);
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
    }
    e.target.value = value;
  });

  // ---------- NOVAS FUNÇÕES PARA MONTAR O NOME DO ARQUIVO ----------

  // (A) Pegar iniciais do nome do solicitante
  function getInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    // Pega a primeira letra de cada parte e converte para maiúsculo
    const initials = parts.map(p => p[0].toUpperCase()).join('');
    return initials;
  }

  // (B) Formatar data "yyyy-mm-dd" em "dd-mm-yyyy" 
  function formatDateIsoToWindows(isoDate) {
    const [yyyy, mm, dd] = isoDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  // (C) Montar o nome do arquivo final
  function montarNomeArquivo() {
    const nomeSolicitante = document.getElementById("nome").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const valor = document.getElementById("valor").value.trim();
    const dataVenc = document.getElementById("data").value; // "yyyy-mm-dd"

    const iniciais = getInitials(nomeSolicitante);
    const dataWindowsFriendly = formatDateIsoToWindows(dataVenc);
    const nomeArquivo = `${iniciais} - AUTORIZACAO DE PAGAMENTO - ${categoria.toUpperCase()} - ${valor} - ${dataWindowsFriendly}.pdf`;
    return nomeArquivo;
  }
  // ------------------------------------------------------------------

  // 3. Atualiza os campos adicionais de pagamento
  document.getElementById("pagamento").addEventListener("change", function() {
    let selected = this.value;
    let paymentDetails = document.getElementById("paymentDetails");
    let notaFiscalContainer = document.getElementById("notaFiscalContainer");
    paymentDetails.innerHTML = "";
    notaFiscalContainer.style.display = "none";
  
    if (selected === "pix") {
      paymentDetails.innerHTML = `
        <label for="chavePix">Chave Pix:</label>
        <input type="text" id="chavePix" placeholder="Digite sua chave Pix" required>
      `;
    } else if (selected === "Transferência Bancária") {
      paymentDetails.innerHTML = `
        <label for="agencia">Agência:</label>
        <input type="text" id="agencia" placeholder="Digite a agência" required>
        <label for="conta">Conta:</label>
        <input type="text" id="conta" placeholder="Digite a conta" required>
      `;
    } else if (selected === "Guia") {
      paymentDetails.innerHTML = `
        <label for="codigoGuia">Código da Guia:</label>
        <input type="text" id="codigoGuia" placeholder="Digite o código da guia" required>
      `;
    } else if (selected === "Adiantamento") {
      notaFiscalContainer.style.display = "block";
      let todayStr = new Date().toISOString().split("T")[0];
      document.getElementById("notaFiscalDate").value = todayStr;
      document.getElementById("notaFiscalDate").disabled = true;
    }
  });

  // 4. Função para gerar a pré-visualização
  function gerarPrevia() {
    let nome = document.getElementById("nome").value.trim();
    let valor = document.getElementById("valor").value.trim();
    let favorecido = document.getElementById("favorecido").value.trim();
    let cnpj = document.getElementById("cnpj").value.trim();
    let dataVenc = document.getElementById("data").value;
    
    // Converte para maiúsculo os campos desejados
    let pagamento = document.getElementById("pagamento").value.trim().toUpperCase();
    let setor = document.getElementById("setor").value.trim().toUpperCase();
    let categoria = document.getElementById("categoria").value.trim().toUpperCase();
    
    let relato = document.getElementById("relato").value.trim();

    // Validações
    if (nome.length < 11) {
      alert("O campo 'Nome do solicitante' deve ter no mínimo 11 caracteres.");
      return;
    }
    if (favorecido.length < 11) {
      alert("O campo 'Nome do Favorecido' deve ter no mínimo 11 caracteres.");
      return;
    }
    if (relato.length < 50) {
      alert("O campo 'Relato' deve ter no mínimo 50 caracteres.");
      return;
    }
    if (cnpj.replace(/\D/g, '').length < 11 || cnpj.replace(/\D/g, '').length > 14) {
      alert("O campo 'CNPJ/CPF' deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).");
      return;
    }

    let dueDate = new Date(dataVenc);
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      alert("A data de vencimento não pode ser anterior à data atual.");
      return;
    }

    let diffTime = dueDate.getTime() - today.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Define a cor de fundo
    let bgColor;
    if (diffDays > 10) {
      bgColor = "#99ccff"; // Azul claro
    } else if (diffDays > 5) {
      bgColor = "#99ff99"; // Verde claro
    } else {
      bgColor = "#ff9999"; // Vermelho claro
    }

    // Monta a pré-visualização
    let previewContent = `
      <div style="text-align:center; margin-bottom:1rem;">
        <img src="https://pedilar.com.br/wp-content/uploads/2021/08/pedilar-logo-c.png"
             style="max-height: 3rem;" alt="Pedilar Domiciliar">
      </div>
      <h2 style="text-align:center; margin-bottom:1rem;"></h2>
      <p><strong>Nome do Solicitante:</strong> ${nome}</p>
      <p><strong>Valor da Conta:</strong> ${valor}</p>
      <p><strong>Nome do Favorecido:</strong> ${favorecido}</p>
      <p><strong>CNPJ/CPF:</strong> ${cnpj}</p>
      <p><strong>Data de Vencimento:</strong> ${dataVenc}</p>
      <p><strong>Método de Pagamento:</strong> ${pagamento}</p>
      <p><strong>Nome do Setor:</strong> ${setor}</p>
      <p><strong>Categoria:</strong> ${categoria}</p>
      <p style="white-space: pre-wrap;"><strong>Relato:</strong><br>${relato}</p>
    `;

    // Adiciona campos adicionais de pagamento, se presentes
    let paymentDetailsDiv = document.getElementById("paymentDetails");
    if (paymentDetailsDiv) {
      let chavePix = document.getElementById("chavePix");
      let agencia = document.getElementById("agencia");
      let contaField = document.getElementById("conta");
      let codigoGuia = document.getElementById("codigoGuia");
      if (chavePix) {
        previewContent += `<p><strong>Chave Pix:</strong> ${chavePix.value.trim()}</p>`;
      }
      if (agencia) {
        previewContent += `<p><strong>Agência:</strong> ${agencia.value.trim()}</p>`;
      }
      if (contaField) {
        previewContent += `<p><strong>Conta:</strong> ${contaField.value.trim()}</p>`;
      }
      if (codigoGuia) {
        previewContent += `<p><strong>Código da Guia:</strong> ${codigoGuia.value.trim()}</p>`;
      }
    }

    // Nota Fiscal (para Adiantamento)
    let notaFiscalContainer = document.getElementById("notaFiscalContainer");
    if (notaFiscalContainer && notaFiscalContainer.style.display !== "none") {
      let notaFiscalFile = document.getElementById("notaFiscalFile").files[0]
        ? document.getElementById("notaFiscalFile").files[0].name
        : "Nenhum arquivo selecionado";
      let notaFiscalDate = document.getElementById("notaFiscalDate").value;
      previewContent += `<p><strong>Nota Fiscal:</strong> ${notaFiscalFile}</p>`;
      previewContent += `<p><strong>Data da Nota Fiscal:</strong> ${notaFiscalDate}</p>`;
    }

    // Insere o conteúdo de pré-visualização e aplica a cor de fundo
    document.getElementById("printPreview").innerHTML = previewContent;
    document.getElementById("preview-container").style.backgroundColor = bgColor;
  }

  // Botão "Visualizar Arquivo"
  document.getElementById("baixarArquivo").addEventListener("click", function (event) {
    event.preventDefault();
    gerarPrevia();
  });

  // Botão "Imprimir"
  document.getElementById("printButton").addEventListener("click", function (event) {
    event.preventDefault();
    window.print();
  });

  // ---------- FUNÇÕES DE MONTAGEM DE NOME DE ARQUIVO ----------

  function getInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts.map(p => p[0].toUpperCase()).join('');
  }

  function formatDateIsoToWindows(isoDate) {
    // "2025-03-14" → "14-03-2025"
    const [yyyy, mm, dd] = isoDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  function montarNomeArquivo() {
    const nomeSolicitante = document.getElementById("nome").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const valor = document.getElementById("valor").value.trim();
    const dataVenc = document.getElementById("data").value; // "yyyy-mm-dd"

    const iniciais = getInitials(nomeSolicitante);
    const dataWindows = formatDateIsoToWindows(dataVenc);
    return `${iniciais} - AUTORIZACAO DE PAGAMENTO - ${categoria.toUpperCase()} - ${valor} - VENC ${dataWindows}.pdf`;
  }

  // 5. Botão "Mesclar Arquivo" - utiliza PDF-lib para mesclar PDFs
  document.getElementById("mesclarArquivo").addEventListener("click", async function (event) {
    event.preventDefault();
    const fileInput = document.getElementById("pdfFiles");
    const files = fileInput.files;
    if (!files.length) {
      alert("Por favor, selecione ao menos um PDF para mesclar.");
      return;
    }
    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Gera o nome final do arquivo
      const nomeArquivoFinal = montarNomeArquivo();

      document.getElementById("mergeResult").innerHTML = `
        <a href="${url}" download="${nomeArquivoFinal}" class="button">
          Baixar PDF Mesclado
        </a>
      `;
    } catch (error) {
      console.error("Erro ao mesclar PDFs:", error);
      alert("Ocorreu um erro ao mesclar os PDFs.");
    }
  });
});
