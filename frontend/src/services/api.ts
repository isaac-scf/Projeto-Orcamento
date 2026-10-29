
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: 'VENDEDOR' | 'SUPERVISOR' | 'GERENTE';
}

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function fazerLogin(
  email: string,
  senha: string
): Promise<LoginResponse> {
  const resposta = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.message || dados.erro || 'E-mail ou senha inválidos.'
    );
  }

  return dados;
}

export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  custoUnitario: number;
  precoTabela: number;
  categoria: string;
}

export async function buscarProdutos(
  termo: string,
  token: string
): Promise<Produto[]> {
  const resposta = await fetch(
    `/api/produtos/busca?termo=${encodeURIComponent(termo)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.erro || dados.message || 'Erro ao buscar produtos.'
    );
  }

  return dados;
}

export interface ResultadoImportacao {
  totalLinhas: number;
  importados: number;
  invalidos: number[];
}

export async function importarProdutos(
  arquivo: File,
  token: string
): Promise<ResultadoImportacao> {
  const formulario = new FormData();
  formulario.append('arquivo', arquivo);

  const resposta = await fetch('/api/produtos/importar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formulario,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.erro || dados.message || 'Erro ao importar produtos.'
    );
  }

  return dados;
}

export interface NovoOrcamento {
  cliente: string;
  itens: {
    produtoId: number;
    quantidade: number;
    descontoPercentual: number;
  }[];
}

export async function criarOrcamento(
  orcamento: NovoOrcamento,
  token: string
) {
  const resposta = await fetch('/api/orcamentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orcamento),
  });

  const texto = await resposta.text();
  let dados: any;

  try {
    dados = JSON.parse(texto);
  } catch {
    dados = {
      erro: texto || `Erro HTTP ${resposta.status}`,
    };
  }

  console.log(
    'Resposta da API ao criar orçamento:',
    resposta.status,
    dados
  );

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        dados.message ||
        `Erro ao criar orçamento (HTTP ${resposta.status}).`
    );
  }

  return dados;
}

export interface OrcamentoPendente {
  id: number;
  vendedorId: number;
  cliente: string;
  status: string;
  margemBruta: number;

  vendedor: {
    id: number;
    nome: string;
    email: string;
  };

  itens: {
    id: number;
    produtoId: number;
    quantidade: number;
    precoUnitario: number;
    custoUnitario: number;
    produto: {
      id: number;
      codigo: string;
      descricao: string;
      custoUnitario: number;
      precoTabela: number;
      categoria: string;
    };
  }[];
}

export async function buscarOrcamentosPendentes(
  token: string
): Promise<OrcamentoPendente[]> {
  const resposta = await fetch('/api/orcamentos/pendentes', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.erro || dados.message || 'Erro ao buscar aprovações.'
    );
  }

  return dados;
}

export async function aprovarOrcamento(
  id: number,
  token: string
) {
  const resposta = await fetch(`/api/orcamentos/${id}/aprovar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.erro || dados.message || 'Erro ao aprovar orçamento.'
    );
  } 

  return dados;
}
