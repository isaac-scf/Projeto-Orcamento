import { useEffect, useState, type FormEvent } from 'react'
import {
  fazerLogin,
  buscarProdutos,
  criarOrcamento,
  buscarOrcamentosPendentes,
  aprovarOrcamento,
  importarProdutos,
  type Usuario,
  type Produto,
  type OrcamentoPendente,
  type ResultadoImportacao,
} from './services/api';
import {
  LayoutDashboard,
  Package,
  FileText,
  ClipboardCheck,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  Zap,
  Menu,
  X,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  ChevronRight,
  LogOut,
  RefreshCw,
  Trash2,
  Minus,
} from 'lucide-react'
import './App.css'

type Page = 'Dashboard' | 'Produtos' | 'Orçamentos' | 'Aprovações'

type ItemOrcamentoTela = {
  produto: Produto
  quantidade: number
  descontoPercentual: number
}

const navigation = [
  { name: 'Dashboard' as Page, icon: LayoutDashboard },
  { name: 'Produtos' as Page, icon: Package },
  { name: 'Orçamentos' as Page, icon: FileText },
  { name: 'Aprovações' as Page, icon: ClipboardCheck },
]

function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const salvo = sessionStorage.getItem('usuario')
      return salvo ? (JSON.parse(salvo) as Usuario) : null
    } catch {
      sessionStorage.removeItem('usuario')
      return null
    }
  })

  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('token')
  )

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Pesquisa de produtos
  const [termoProduto, setTermoProduto] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)
  const [erroProdutos, setErroProdutos] = useState('')
  const [pesquisouProdutos, setPesquisouProdutos] = useState(false)

  // Importação de produtos
  const [arquivoImportacao, setArquivoImportacao] = useState<File | null>(null)
  const [carregandoImportacao, setCarregandoImportacao] = useState(false)
  const [erroImportacao, setErroImportacao] = useState('')
  const [resultadoImportacao, setResultadoImportacao] =
    useState<ResultadoImportacao | null>(null)

  // Criação de orçamento
  const [clienteOrcamento, setClienteOrcamento] = useState('')
  const [termoItem, setTermoItem] = useState('')
  const [resultadosItem, setResultadosItem] = useState<Produto[]>([])
  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamentoTela[]>([])
  const [carregandoItens, setCarregandoItens] = useState(false)
  const [salvandoOrcamento, setSalvandoOrcamento] = useState(false)
  const [erroOrcamento, setErroOrcamento] = useState('')
  const [sucessoOrcamento, setSucessoOrcamento] = useState('')

  // Aprovações
  const [pendentes, setPendentes] = useState<OrcamentoPendente[]>([])
  const [carregandoPendentes, setCarregandoPendentes] = useState(false)
  const [erroPendentes, setErroPendentes] = useState('')
  const [mensagemAprovacao, setMensagemAprovacao] = useState('')
  const [aprovandoId, setAprovandoId] = useState<number | null>(null)

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroLogin('')
    setCarregando(true)

    try {
      const resultado = await fazerLogin(email, senha)

      sessionStorage.setItem('token', resultado.token)
      sessionStorage.setItem('usuario', JSON.stringify(resultado.usuario))

      setToken(resultado.token)
      setUsuario(resultado.usuario)
      setSenha('')
    } catch (erro) {
      setErroLogin(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível realizar o login.'
      )
    } finally {
      setCarregando(false)
    }
  }

  function sair() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
    setSenha('')
    setEmail('')
    setErroLogin('')
    setPage('Dashboard')
    setPendentes([])
    setMensagemAprovacao('')
    setErroPendentes('')
  }

  async function pesquisarProdutos(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroProdutos('')
    setCarregandoProdutos(true)
    setPesquisouProdutos(true)

    try {
      const resultado = await buscarProdutos(termoProduto.trim(), token!)
      setProdutos(resultado)
    } catch (erro) {
      setProdutos([])
      setErroProdutos(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível carregar os produtos.'
      )
    } finally {
      setCarregandoProdutos(false)
    }
  }

  async function enviarImportacao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroImportacao('')
    setResultadoImportacao(null)

    if (!arquivoImportacao) {
      setErroImportacao('Selecione um arquivo CSV ou Excel.')
      return
    }

    setCarregandoImportacao(true)

    try {
      const resultado = await importarProdutos(arquivoImportacao, token!)
      setResultadoImportacao(resultado)
      setArquivoImportacao(null)
    } catch (erro) {
      setErroImportacao(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível importar os produtos.'
      )
    } finally {
      setCarregandoImportacao(false)
    }
  }

  async function pesquisarItensOrcamento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroOrcamento('')
    setSucessoOrcamento('')
    setCarregandoItens(true)

    try {
      const resultado = await buscarProdutos(termoItem.trim(), token!)
      setResultadosItem(resultado)
    } catch (erro) {
      setResultadosItem([])
      setErroOrcamento(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível pesquisar os produtos.'
      )
    } finally {
      setCarregandoItens(false)
    }
  }

  function adicionarProduto(produto: Produto) {
    setItensOrcamento((atuais) => {
      const existente = atuais.find(
        (item) => item.produto.id === produto.id
      )

      if (existente) {
        return atuais.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }

      return [...atuais, { produto, quantidade: 1, descontoPercentual: 0 }]
    })

    setErroOrcamento('')
    setSucessoOrcamento('')
  }

  function alterarQuantidade(produtoId: number, quantidade: number) {
    const quantidadeValida = Math.max(
      1,
      Math.floor(Number(quantidade) || 1)
    )

    setItensOrcamento((atuais) =>
      atuais.map((item) =>
        item.produto.id === produtoId
          ? { ...item, quantidade: quantidadeValida }
          : item
      )
    )
  }

  function removerProduto(produtoId: number) {
    setItensOrcamento((atuais) =>
      atuais.filter((item) => item.produto.id !== produtoId)
    )
  }

  function alterarDescontoProduto(produtoId: number, descontoPercentual: number) {
    const descontoValido = Number.isFinite(descontoPercentual)
      ? Math.min(100, Math.max(0, descontoPercentual))
      : 0

    setItensOrcamento((atuais) =>
      atuais.map((item) =>
        item.produto.id === produtoId
          ? { ...item, descontoPercentual: descontoValido }
          : item
      )
    )
  }

  const subtotalOrcamento = itensOrcamento.reduce(
    (total, item) =>
      total + Number(item.produto.precoTabela) * item.quantidade,
    0
  )

  const valorDesconto = itensOrcamento.reduce(
    (total, item) =>
      total +
      Number(item.produto.precoTabela) *
        item.quantidade *
        (item.descontoPercentual / 100),
    0
  )

  const totalEstimado = subtotalOrcamento - valorDesconto

  async function salvarNovoOrcamento() {
    setErroOrcamento('')
    setSucessoOrcamento('')

    if (!clienteOrcamento.trim()) {
      setErroOrcamento('Informe o nome do cliente.')
      return
    }

    if (itensOrcamento.length === 0) {
      setErroOrcamento('Adicione pelo menos um produto ao orçamento.')
      return
    }

    const descontoInvalido = itensOrcamento.some(
      (item) =>
        !Number.isFinite(item.descontoPercentual) ||
        item.descontoPercentual < 0 ||
        item.descontoPercentual > 100
    )

    if (descontoInvalido) {
      setErroOrcamento('Cada desconto deve estar entre 0% e 100%.')
      return
    }

    setSalvandoOrcamento(true)

    try {
      await criarOrcamento(
        { 
          cliente: clienteOrcamento.trim(),
          itens: itensOrcamento.map((item) => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            descontoPercentual: item.descontoPercentual,
          })),
        },
        token!
      )

      setSucessoOrcamento('Orçamento criado com sucesso!')
      setClienteOrcamento('')
      setTermoItem('')
      setResultadosItem([])
      setItensOrcamento([])
    } catch (erro) {
      setErroOrcamento(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível criar o orçamento.'
      )
    } finally {
      setSalvandoOrcamento(false)
    }
  }

  // Carrega os orçamentos pendentes da API
  async function carregarPendentes() {
    if (!token) return

    setCarregandoPendentes(true)
    setErroPendentes('')

    try {
      const dados = await buscarOrcamentosPendentes(token)
      setPendentes(dados)
    } catch (erro) {
      setPendentes([])
      setErroPendentes(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível carregar os orçamentos pendentes.'
      )
    } finally {
      setCarregandoPendentes(false)
    }
  }

  useEffect(() => {
    if (
      page === 'Aprovações' &&
      (usuario?.cargo === 'SUPERVISOR' || usuario?.cargo === 'GERENTE')
    ) {
      void carregarPendentes()
    }
  }, [page, token, usuario])

  async function confirmarAprovacao(id: number) {
    if (!token) return

    setAprovandoId(id)
    setErroPendentes('')
    setMensagemAprovacao('')

    try {
      await aprovarOrcamento(id, token)
      setMensagemAprovacao(`Orçamento #${id} aprovado com sucesso!`)
      await carregarPendentes()
    } catch (erro) {
      setErroPendentes(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível aprovar o orçamento.'
      )
    } finally {
      setAprovandoId(null)
    }
  }

  const pageDescriptions: Record<Page, string> = {
    Dashboard: 'Acompanhe a operação em um só lugar.',
    Produtos: 'Consulte e importe seu catálogo de produtos.',
    Orçamentos: 'Crie e gerencie orçamentos comerciais.',
    Aprovações: 'Revise os orçamentos que aguardam aprovação.',
  }

  function navigate(nextPage: Page) {
    setPage(nextPage)
    setMenuOpen(false)
  }

  function iniciais(nome: string) {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase()
  }

  function formatarMoeda(valor: number) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  if (!token || !usuario) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={entrar}>
          <div className="brand-icon">
            <Zap size={26} fill="currentColor" />
          </div>

          <h1>Bem-vindo de volta</h1>
          <p>Entre na plataforma Projeto-Orçamento.</p>

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />

          {erroLogin && (
            <p className="login-error" role="alert">
              {erroLogin}
            </p>
          )}

          <button
            className="primary-button login-submit"
            type="submit"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar na plataforma'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Zap size={23} fill="currentColor" />
          </div>

          <div>
            <strong>ORÇAMENTO<span>.</span></strong>
            <small>BUSINESS PLATFORM</small>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation
            .filter(
              ({ name }) =>
                name !== 'Aprovações' ||
                usuario.cargo === 'SUPERVISOR' ||
                usuario.cargo === 'GERENTE'
            )
            .map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`nav-item ${page === name ? 'active' : ''}`}
                onClick={() => navigate(name)}
              >
                <Icon size={19} />
                <span>{name}</span>
                {page === name && <span className="active-indicator" />}
              </button>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <strong>API do sistema</strong>
              <small>Interface conectada</small>
            </div>
          </div>

          <div className="profile">
            <div className="avatar">{iniciais(usuario.nome)}</div>

            <div className="profile-info">
              <strong>{usuario.nome}</strong>
              <small>{usuario.cargo}</small>
            </div>

            <button
              className="profile-menu"
              onClick={sair}
              title="Sair da plataforma"
              aria-label="Sair da plataforma"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>{page}</strong>
          </div>

          <div className="topbar-actions">
            <div className="system-badge">
              <span /> Sistema de orçamentos
            </div>

            <button className="icon-button" aria-label="Notificações">
              <Bell size={19} />
              <i />
            </button>

            <div className="top-avatar">{iniciais(usuario.nome)}</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span /> PAINEL DE CONTROLE
              </div>

              <h1>{page === 'Dashboard' ? 'Visão geral' : page}</h1>
              <p>{pageDescriptions[page]}</p>
            </div>

            <button
              className="primary-button"
              onClick={() => navigate('Orçamentos')}
            >
              <Plus size={18} />
              Novo orçamento
            </button>
          </section>

          {page === 'Dashboard' ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-tag">
                    <Zap size={14} /> CENTRAL DE OPERAÇÕES
                  </div>

                  <h2>
                    Decisões melhores.
                    <br />
                    <span>Orçamentos inteligentes.</span>
                  </h2>

                  <p>
                    Gerencie produtos, monte propostas comerciais e
                    acompanhe aprovações em um só ambiente.
                  </p>

                  <button
                    className="hero-button"
                    onClick={() => navigate('Orçamentos')}
                  >
                    Criar orçamento <ArrowUpRight size={17} />
                  </button>
                </div>

                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />

                  <div className="orbit-core">
                    <Zap size={43} fill="currentColor" />
                  </div>

                  <div className="float-card float-card-top">
                    <span className="float-icon">
                      <CircleDollarSign size={17} />
                    </span>
                    <div>
                      <small>GESTÃO COMERCIAL</small>
                      <strong>Mais controle</strong>
                    </div>
                  </div>

                  <div className="float-card float-card-bottom">
                    <span className="float-icon green">
                      <CheckCircle2 size={17} />
                    </span>
                    <div>
                      <small>FLUXO DE TRABALHO</small>
                      <strong>Processos organizados</strong>
                    </div>
                  </div>
                </div>

                <div className="hero-grid" />
              </section>

              <section className="section-heading">
                <div>
                  <h3>Resumo da operação</h3>
                  <p>Indicadores disponíveis no sistema</p>
                </div>
                <span className="period-label">VISÃO GERAL</span>
              </section>

              <section className="metrics-grid">
                <article className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon purple">
                      <FileText size={20} />
                    </span>
                    <span className="metric-label">ORÇAMENTOS</span>
                  </div>
                  <div className="metric-value">—</div>
                  <div className="metric-foot">Aguardando integração de dados</div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon blue">
                      <Package size={20} />
                    </span>
                    <span className="metric-label">PRODUTOS</span>
                  </div>
                  <div className="metric-value">—</div>
                  <div className="metric-foot">Consulte o catálogo cadastrado</div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon orange">
                      <Clock3 size={20} />
                    </span>
                    <span className="metric-label">PENDENTES</span>
                  </div>
                  <div className="metric-value">{usuario.cargo === 'SUPERVISOR' || usuario.cargo === 'GERENTE' ? pendentes.length : '—'}</div>
                  <div className="metric-foot">
                    {usuario.cargo === 'SUPERVISOR' || usuario.cargo === 'GERENTE'
                      ? 'Pendências carregadas na última consulta'
                      : 'Acesso restrito a supervisores e gerentes'}
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon green">
                      <CircleDollarSign size={20} />
                    </span>
                    <span className="metric-label">VALOR TOTAL</span>
                  </div>
                  <div className="metric-value">—</div>
                  <div className="metric-foot">Disponível após integração</div>
                </article>
              </section>

              <section className="bottom-grid">
                <article className="panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Acesso rápido</h3>
                      <p>Vá direto ao que precisa</p>
                    </div>
                    <span className="panel-heading-icon">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>

                  <button className="quick-link" onClick={() => navigate('Produtos')}>
                    <span className="quick-icon"><Package size={19} /></span>
                    <span>
                      <strong>Consultar produtos</strong>
                      <small>Buscar itens no catálogo</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>

                  <button className="quick-link" onClick={() => navigate('Orçamentos')}>
                    <span className="quick-icon"><FileText size={19} /></span>
                    <span>
                      <strong>Novo orçamento</strong>
                      <small>Monte uma proposta comercial</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>

                  {(usuario.cargo === 'SUPERVISOR' || usuario.cargo === 'GERENTE') && (
                    <button className="quick-link" onClick={() => navigate('Aprovações')}>
                      <span className="quick-icon"><ClipboardCheck size={19} /></span>
                      <span>
                        <strong>Central de aprovações</strong>
                        <small>Revise solicitações pendentes</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  )}
                </article>

                <article className="panel status-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Status do sistema</h3>
                      <p>Componentes da plataforma</p>
                    </div>
                    <span className="live-indicator">
                      <span /> EM CONFIGURAÇÃO
                    </span>
                  </div>

                  <div className="service-row">
                    <span className="service-symbol"><LayoutDashboard size={18} /></span>
                    <div>
                      <strong>Interface web</strong>
                      <small>Aplicação React + Vite</small>
                    </div>
                    <span className="service-state"><i /> Ativa</span>
                  </div>

                  <div className="service-row">
                    <span className="service-symbol"><Search size={18} /></span>
                    <div>
                      <strong>API de produtos</strong>
                      <small>Pesquisa e importação</small>
                    </div>
                    <span className="service-state pending">Em teste</span>
                  </div>

                  <div className="service-row">
                    <span className="service-symbol"><ClipboardCheck size={18} /></span>
                    <div>
                      <strong>Fluxo de orçamentos</strong>
                      <small>Criação e aprovação</small>
                    </div>
                    <span className="service-state pending">Em teste</span>
                  </div>
                </article>
              </section>
            </>
          ) : page === 'Produtos' ? (
            <section className="panel products-panel">
              <div className="panel-heading">
                <div>
                  <h3>Catálogo de produtos</h3>
                  <p>Pesquise os produtos cadastrados no sistema.</p>
                </div>
                <span className="panel-heading-icon"><Package size={19} /></span>
              </div>

              <form className="product-import-form" onSubmit={enviarImportacao}>
                <div>
                  <h4>Importar produtos</h4>
                  <p>Selecione uma planilha Excel ou arquivo CSV para cadastrar ou atualizar produtos.</p>
                </div>

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  aria-label="Arquivo para importar produtos"
                  onChange={(e) => {
                    setArquivoImportacao(e.target.files?.[0] ?? null)
                    setErroImportacao('')
                    setResultadoImportacao(null)
                  }}
                />

                <button
                  className="primary-button"
                  type="submit"
                  disabled={carregandoImportacao || !arquivoImportacao}
                >
                  {carregandoImportacao
                    ? <RefreshCw size={17} />
                    : <Package size={17} />}
                  {carregandoImportacao ? 'Importando...' : 'Importar produtos'}
                </button>

                {erroImportacao && (
                  <div className="product-message product-error" role="alert">
                    {erroImportacao}
                  </div>
                )}

                {resultadoImportacao && (
                  <div className="product-message" role="status">
                    <strong>Importação concluída!</strong>
                    <p>Linhas processadas: {resultadoImportacao.totalLinhas}</p>
                    <p>Produtos importados: {resultadoImportacao.importados}</p>
                    {resultadoImportacao.invalidos.length > 0 && (
                      <p>
                        Linhas inválidas: {resultadoImportacao.invalidos.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </form>

              <form className="product-search-form" onSubmit={pesquisarProdutos}>
                <div className="product-search-input">
                  <Search size={19} />
                  <input
                    type="text"
                    value={termoProduto}
                    onChange={(e) => setTermoProduto(e.target.value)}
                    placeholder="Digite o código ou a descrição..."
                    aria-label="Pesquisar produtos"
                    required
                  />
                  {termoProduto && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => setTermoProduto('')}
                      aria-label="Limpar pesquisa"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <button className="primary-button" type="submit" disabled={carregandoProdutos}>
                  {carregandoProdutos ? <RefreshCw size={17} /> : <Search size={17} />}
                  {carregandoProdutos ? 'Buscando...' : 'Pesquisar'}
                </button>
              </form>

              {erroProdutos && (
                <div className="product-message product-error" role="alert">{erroProdutos}</div>
              )}

              {carregandoProdutos ? (
                <div className="product-empty"><RefreshCw size={24} /><p>Buscando produtos...</p></div>
              ) : pesquisouProdutos && !erroProdutos && produtos.length === 0 ? (
                <div className="product-empty">
                  <Package size={28} />
                  <strong>Nenhum produto encontrado</strong>
                  <p>Tente pesquisar por outro código ou descrição.</p>
                </div>
              ) : !pesquisouProdutos ? (
                <div className="product-empty">
                  <Search size={28} />
                  <strong>Pesquise no catálogo</strong>
                  <p>Os resultados aparecerão aqui.</p>
                </div>
              ) : (
                <div className="products-table-wrapper">
                  <div className="products-results-header">
                    <strong>Resultados da pesquisa</strong>
                    <span>{produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}</span>
                  </div>
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Custo unitário</th>
                        <th>Preço de tabela</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map((produto, indice) => (
                        <tr key={produto.id ?? `${produto.codigo}-${indice}`}>
                          <td>{produto.codigo || '—'}</td>
                          <td>{produto.descricao || '—'}</td>
                          <td>{produto.categoria || '—'}</td>
                          <td>{formatarMoeda(produto.custoUnitario)}</td>
                          <td>{formatarMoeda(produto.precoTabela)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : page === 'Orçamentos' ? (
            <div className="quote-page">
              <section className="panel quote-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Novo orçamento</h3>
                    <p>Informe o cliente e monte a lista de produtos.</p>
                  </div>
                  <span className="panel-heading-icon"><FileText size={19} /></span>
                </div>

                <div className="quote-field">
                  <label htmlFor="clienteOrcamento">Nome do cliente</label>
                  <input
                    id="clienteOrcamento"
                    type="text"
                    value={clienteOrcamento}
                    onChange={(e) => setClienteOrcamento(e.target.value)}
                    placeholder="Digite o nome do cliente"
                    maxLength={200}
                  />
                </div>

                <div className="quote-subheading">
                  <div>
                    <h3>Adicionar produtos</h3>
                    <p>Pesquise pelo código ou pela descrição.</p>
                  </div>
                </div>

                <form className="product-search-form" onSubmit={pesquisarItensOrcamento}>
                  <div className="product-search-input">
                    <Search size={19} />
                    <input
                      type="text"
                      value={termoItem}
                      onChange={(e) => setTermoItem(e.target.value)}
                      placeholder="Código ou descrição do produto..."
                      aria-label="Pesquisar produto para orçamento"
                      required
                    />
                    {termoItem && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => {
                          setTermoItem('')
                          setResultadosItem([])
                        }}
                        aria-label="Limpar pesquisa"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                  <button className="primary-button" type="submit" disabled={carregandoItens}>
                    <Search size={17} />
                    {carregandoItens ? 'Buscando...' : 'Pesquisar'}
                  </button>
                </form>

                {carregandoItens && (
                  <div className="product-empty"><RefreshCw size={23} /><p>Buscando produtos...</p></div>
                )}

                {!carregandoItens && resultadosItem.length > 0 && (
                  <div className="products-table-wrapper quote-search-results">
                    <div className="products-results-header">
                      <strong>Selecione um produto</strong>
                      <span>{resultadosItem.length} encontrado(s)</span>
                    </div>
                    <table className="products-table">
                      <thead>
                        <tr><th>Código</th><th>Descrição</th><th>Preço</th><th>Ação</th></tr>
                      </thead>
                      <tbody>
                        {resultadosItem.map((produto) => (
                          <tr key={produto.id}>
                            <td>{produto.codigo}</td>
                            <td>{produto.descricao}</td>
                            <td>{formatarMoeda(produto.precoTabela)}</td>
                            <td>
                              <button
                                type="button"
                                className="primary-button quote-add-button"
                                onClick={() => adicionarProduto(produto)}
                              >
                                <Plus size={15} /> Adicionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!carregandoItens && termoItem.trim() && resultadosItem.length === 0 && (
                  <div className="product-empty">
                    <Package size={24} />
                    <p>Nenhum resultado para essa pesquisa. Clique em Pesquisar para consultar o catálogo.</p>
                  </div>
                )}
              </section>

              <section className="panel quote-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Itens do orçamento</h3>
                    <p>
                      {itensOrcamento.length}{' '}
                      {itensOrcamento.length === 1 ? 'produto adicionado' : 'produtos adicionados'}
                    </p>
                  </div>
                  <span className="panel-heading-icon"><Package size={19} /></span>
                </div>

                {itensOrcamento.length === 0 ? (
                  <div className="product-empty">
                    <Package size={28} />
                    <strong>Nenhum produto adicionado</strong>
                    <p>Pesquise e adicione produtos acima.</p>
                  </div>
                ) : (
                  <div className="products-table-wrapper">
                    <table className="products-table">
                      <thead>
                        <tr><th>Produto</th><th>Preço unitário</th><th>Desconto (%)</th><th>Quantidade</th><th>Total com desconto</th><th>Ação</th></tr>
                      </thead>
                      <tbody>
                        {itensOrcamento.map((item) => (
                          <tr key={item.produto.id}>
                            <td>
                              <strong>{item.produto.descricao}</strong>
                              <br />
                              <small>{item.produto.codigo}</small>
                            </td>
                            <td>{formatarMoeda(item.produto.precoTabela)}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                aria-label={`Desconto de ${item.produto.descricao} (%)`}
                                value={item.descontoPercentual}
                                onChange={(e) =>
                                  alterarDescontoProduto(
                                    item.produto.id,
                                    e.target.value === '' ? 0 : Number(e.target.value)
                                  )
                                }
                                style={{ width: '85px' }}
                              />
                            </td>
                            <td>
                              <div className="quote-quantity">
                                <button
                                  type="button"
                                  aria-label="Diminuir quantidade"
                                  onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                                  disabled={item.quantidade <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  aria-label={`Quantidade de ${item.produto.descricao}`}
                                  value={item.quantidade}
                                  onChange={(e) => alterarQuantidade(item.produto.id, Number(e.target.value))}
                                />
                                <button
                                  type="button"
                                  aria-label="Aumentar quantidade"
                                  onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td>
                              {formatarMoeda(
                                Number(item.produto.precoTabela) *
                                  item.quantidade *
                                  (1 - item.descontoPercentual / 100)
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="quote-remove-button"
                                aria-label={`Remover ${item.produto.descricao}`}
                                onClick={() => removerProduto(item.produto.id)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="quote-summary">
                  <div className="quote-totals">
                    <div><span>Subtotal</span><strong>{formatarMoeda(subtotalOrcamento)}</strong></div>
                    <div><span>Desconto</span><strong>{formatarMoeda(valorDesconto)}</strong></div>
                    <div className="quote-grand-total"><span>Total estimado</span><strong>{formatarMoeda(totalEstimado)}</strong></div>
                  </div>
                </div>

                <p className="quote-note">O valor final e a margem serão validados pela API ao salvar.</p>

                {erroOrcamento && (
                  <div className="product-message product-error" role="alert">{erroOrcamento}</div>
                )}

                {sucessoOrcamento && (
                  <div className="product-message" role="status" style={{ color: '#16a34a', padding: '12px', marginTop: '12px' }}>
                    <CheckCircle2 size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                    {sucessoOrcamento}
                  </div>
                )}

                <div className="quote-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setClienteOrcamento('')
                      setTermoItem('')
                      setResultadosItem([])
                      setItensOrcamento([])
                      setErroOrcamento('')
                      setSucessoOrcamento('')
                    }}
                    disabled={salvandoOrcamento}
                  >
                    Limpar formulário
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={salvarNovoOrcamento}
                    disabled={salvandoOrcamento}
                  >
                    {salvandoOrcamento ? <RefreshCw size={17} /> : <CheckCircle2 size={17} />}
                    {salvandoOrcamento ? 'Salvando...' : 'Salvar orçamento'}
                  </button>
                </div>
              </section>
            </div>
          ) : page === 'Aprovações' ? (
            <section className="panel products-panel">
              <div className="panel-heading">
                <div>
                  <h3>Orçamentos pendentes</h3>
                  <p>Revise as solicitações antes de aprová-las.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => void carregarPendentes()}
                  disabled={carregandoPendentes}
                >
                  <RefreshCw size={16} />
                  Atualizar
                </button>
              </div>

              {mensagemAprovacao && (
                <div className="product-message" role="status">
                  <CheckCircle2 size={17} style={{ display: 'inline', marginRight: 8 }} />
                  {mensagemAprovacao}
                </div>
              )}

              {erroPendentes && (
                <div className="product-message product-error" role="alert">
                  {erroPendentes}
                </div>
              )}

              {carregandoPendentes ? (
                <div className="product-empty">
                  <RefreshCw size={25} />
                  <p>Carregando orçamentos...</p>
                </div>
              ) : pendentes.length === 0 && !erroPendentes ? (
                <div className="product-empty">
                  <CheckCircle2 size={30} />
                  <strong>Nenhuma aprovação pendente</strong>
                  <p>Quando houver solicitações, elas aparecerão aqui.</p>
                </div>
              ) : (
                <div className="products-table-wrapper">
                  <div className="products-results-header">
                    <strong>Solicitações aguardando aprovação</strong>
                    <span>
                      {pendentes.length}{' '}
                      {pendentes.length === 1 ? 'orçamento' : 'orçamentos'}
                    </span>
                  </div>

                  <div className="approval-cards">
                    {pendentes.map((orcamento) => {
                      const subtotal = orcamento.itens.reduce(
                        (total, item) =>
                          total + Number(item.precoUnitario) * item.quantidade,
                        0
                      );

                      const custoTotal = orcamento.itens.reduce(
                        (total, item) =>
                          total + Number(item.custoUnitario) * item.quantidade,
                        0
                      );

                      return (
                        <article className="panel" key={orcamento.id}>
                          <div className="products-results-header">
                            <strong>Orçamento #{orcamento.id}</strong>
                            <span className="period-label">Pendente</span>
                          </div>

                          <p>
                            <strong>Cliente:</strong> {orcamento.cliente}
                          </p>
                          <p>
                            <strong>Vendedor:</strong>{' '}
                            {orcamento.vendedor?.nome ?? `ID ${orcamento.vendedorId}`}
                          </p>
                          <p>
                            <strong>E-mail:</strong>{' '}
                            {orcamento.vendedor?.email ?? 'Não informado'}
                          </p>

                          <h3>Produtos solicitados</h3>

                          {orcamento.itens.map((item) => (
                            <div key={item.id}>
                              <p>
                                <strong>{item.produto.descricao}</strong>{' '}
                                ({item.produto.codigo})
                              </p>
                              <p>
                                Quantidade: {item.quantidade} · Unitário:{' '}
                                {formatarMoeda(item.precoUnitario)} · Total:{' '}
                                {formatarMoeda(
                                  Number(item.precoUnitario) * item.quantidade
                                )}
                              </p>
                            </div>
                          ))}

                          <div className="products-results-header">
                            <span>Valor dos produtos</span>
                            <strong>{formatarMoeda(subtotal)}</strong>
                          </div>

                          <div className="products-results-header">
                            <span>Custo total</span>
                            <strong>{formatarMoeda(custoTotal)}</strong>
                          </div>

                          <div className="products-results-header">
                            <span>Margem bruta</span>
                            <strong>
                              {Number(orcamento.margemBruta).toLocaleString('pt-BR', {
                                style: 'percent',
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </div>

                          <button
                            className="primary-button"
                            onClick={() => void confirmarAprovacao(orcamento.id)}
                            disabled={aprovandoId !== null}
                          >
                            <CheckCircle2 size={16} />
                            {aprovandoId === orcamento.id
                              ? 'Aprovando...'
                              : 'Aprovar orçamento'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="panel placeholder-panel">
              <div className="placeholder-icon"><LayoutDashboard size={28} /></div>
              <h2>{page}</h2>
              <p>{pageDescriptions[page]}</p>
            </section>
          )}

          <footer className="footer">
            <span>
              <span className="footer-dot" /> PROJETO-ORÇAMENTO{' '}
              <span className="footer-version">v1.0</span>
            </span>
            <span>
              GESTÃO COMERCIAL <b>·</b> CONTROLE <b>·</b> PRECISÃO
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App