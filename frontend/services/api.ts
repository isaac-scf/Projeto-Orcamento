
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

export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  custoUnitario: number;
  precoTabela: number;
  categoria: string;
}

export interface NovoOrcamento {
  cliente: string;
  itens: { produtoId: number; quantidade: number }[];
  descontoPercentual: number;
}

export async function fazerLogin(
  email: string,
  senha: string
): Promise<LoginResponse> {
  const resposta = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function buscarProdutos(
  termo: string,
  token: string
): Promise<Produto[]> {
  const resposta = await fetch(
    `/api/produtos/busca?termo=${encodeURIComponent(termo)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
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

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.erro || dados.message || 'Erro ao criar orçamento.'
    );
  }

  return dados;
}


export interface OrcamentoPendente {
  id: number;
  cliente: string;
  status: string;
  itens: {
    id: number;
    produtoId: number;
    quantidade: number;
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

