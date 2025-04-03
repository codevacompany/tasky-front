document.addEventListener('DOMContentLoaded', function() {
    // Dados simulados para as métricas
    const metricas = {
        totalClientes: 256,
        crescimentoClientes: 12,
        receitaMensal: 25690,
        crescimentoReceita: 8,
        chamadosAtivos: 1289,
        crescimentoChamados: -3,
        taxaRetencao: 95,
        crescimentoRetencao: 2
    };

    // Funções para manipulação de clientes
    const handleNovoCliente = () => {
        // Implementar lógica para adicionar novo cliente
        alert('Funcionalidade de adicionar novo cliente será implementada');
    };

    const handleEditarCliente = (clienteId) => {
        // Implementar lógica para editar cliente
        alert(`Editar cliente ${clienteId}`);
    };

    const handleExcluirCliente = (clienteId) => {
        // Implementar lógica para excluir cliente
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            alert(`Cliente ${clienteId} excluído`);
        }
    };

    // Funções para manipulação de planos
    const handleNovoPlano = () => {
        // Implementar lógica para adicionar novo plano
        alert('Funcionalidade de adicionar novo plano será implementada');
    };

    const handleEditarPlano = (planoId) => {
        // Implementar lógica para editar plano
        alert(`Editar plano ${planoId}`);
    };

    const handleExcluirPlano = (planoId) => {
        // Implementar lógica para excluir plano
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            alert(`Plano ${planoId} excluído`);
        }
    };

    // Função para formatar números
    const formatarNumero = (numero) => {
        return numero.toLocaleString('pt-BR');
    };

    // Função para formatar moeda
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // Função para formatar porcentagem
    const formatarPorcentagem = (valor) => {
        return valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + '%';
    };

    // Função para atualizar métricas
    const atualizarMetricas = async () => {
        try {
            const response = await fetch('http://localhost:5500/api/metrics/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar métricas');
            }

            const metricas = await response.json();

            // Atualizar valores nos elementos HTML
            document.getElementById('totalClientesAtivos').textContent = formatarNumero(metricas.totalClientesAtivos);
            document.getElementById('crescimentoClientesAtivos').textContent = formatarPorcentagem(metricas.crescimentoClientesAtivos);

            document.getElementById('novosClientes').textContent = formatarNumero(metricas.novosClientes);
            document.getElementById('crescimentoNovosClientes').textContent = formatarPorcentagem(metricas.crescimentoNovosClientes);

            document.getElementById('clientesInativos').textContent = formatarNumero(metricas.clientesInativos);
            document.getElementById('crescimentoClientesInativos').textContent = formatarPorcentagem(metricas.crescimentoClientesInativos);

            document.getElementById('totalCancelamentos').textContent = formatarNumero(metricas.totalCancelamentos);
            document.getElementById('crescimentoCancelamentos').textContent = formatarPorcentagem(metricas.crescimentoCancelamentos);

            document.getElementById('taxaChurn').textContent = formatarPorcentagem(metricas.taxaChurn);
            document.getElementById('crescimentoChurn').textContent = formatarPorcentagem(metricas.crescimentoChurn);

            document.getElementById('receitaMensal').textContent = formatarMoeda(metricas.receitaMensal);
            document.getElementById('crescimentoReceita').textContent = formatarPorcentagem(metricas.crescimentoReceita);

            // Atualizar ícones e cores baseado no crescimento
            document.querySelectorAll('.card-body p').forEach(p => {
                const crescimento = parseFloat(p.querySelector('span').textContent);
                const icon = p.querySelector('i');
                
                if (crescimento > 0) {
                    p.className = 'mb-0 text-success';
                    icon.className = 'bi bi-arrow-up';
                } else if (crescimento < 0) {
                    p.className = 'mb-0 text-danger';
                    icon.className = 'bi bi-arrow-down';
                } else {
                    p.className = 'mb-0 text-muted';
                    icon.className = 'bi bi-dash';
                }
            });

        } catch (erro) {
            console.error('Erro ao atualizar métricas:', erro);
        }
    };

    // Atualizar métricas a cada 5 minutos
    setInterval(atualizarMetricas, 300000);

    // Controle de Recursos
    const recursos = {
        chamados: {
            nome: 'Limite de Chamados',
            icone: 'telephone',
            cor: 'primary',
            valores: {
                basico: { valor: '100', tipo: 'quantidade', periodo: 'mês' },
                profissional: { valor: '500', tipo: 'quantidade', periodo: 'mês' },
                empresarial: { valor: 'Ilimitado', tipo: 'quantidade', periodo: 'mês' }
            },
            status: 'ativo'
        },
        usuarios: {
            nome: 'Usuários Simultâneos',
            icone: 'people',
            cor: 'success',
            valores: {
                basico: { valor: '5', tipo: 'quantidade' },
                profissional: { valor: '20', tipo: 'quantidade' },
                empresarial: { valor: 'Ilimitado', tipo: 'quantidade' }
            },
            status: 'ativo'
        },
        armazenamento: {
            nome: 'Armazenamento',
            icone: 'cloud-arrow-up',
            cor: 'info',
            valores: {
                basico: { valor: '5', tipo: 'gb' },
                profissional: { valor: '20', tipo: 'gb' },
                empresarial: { valor: '100', tipo: 'gb' }
            },
            status: 'ativo'
        },
        relatorios: {
            nome: 'Relatórios Avançados',
            icone: 'graph-up',
            cor: 'warning',
            valores: {
                basico: { valor: 'false', tipo: 'boolean' },
                profissional: { valor: 'true', tipo: 'boolean' },
                empresarial: { valor: 'true', tipo: 'boolean' }
            },
            status: 'ativo'
        },
        backup: {
            nome: 'Backup Automático',
            icone: 'shield-check',
            cor: 'primary',
            valores: {
                basico: { valor: '24', tipo: 'horas' },
                profissional: { valor: '12', tipo: 'horas' },
                empresarial: { valor: '6', tipo: 'horas' }
            },
            status: 'ativo'
        }
    };

    // Função para formatar valor do recurso
    const formatarValorRecurso = (valor, tipo, periodo = '') => {
        if (tipo === 'boolean') {
            return valor === 'true' ? 
                '<i class="bi bi-check-circle text-success"></i>' : 
                '<i class="bi bi-x-circle text-danger"></i>';
        }

        if (valor === 'Ilimitado') return valor;

        let formatado = valor;
        if (tipo === 'gb') formatado += 'GB';
        if (tipo === 'mb') formatado += 'MB';
        if (tipo === 'horas') {
            formatado = valor === '24' ? 'Diário' : 
                       valor === '12' ? '12/12h' : 
                       valor === '6' ? '6/6h' : 
                       `${valor}h`;
        }
        if (periodo) formatado += `/${periodo}`;

        return formatado;
    };

    // Função para carregar recursos na tabela
    const carregarRecursos = () => {
        const tbody = document.querySelector('#tabelaRecursos tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        Object.entries(recursos).forEach(([key, recurso]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-${recurso.icone} text-${recurso.cor} me-2"></i>
                        ${recurso.nome}
                    </div>
                </td>
                <td>${formatarValorRecurso(recurso.valores.basico.valor, recurso.valores.basico.tipo, recurso.valores.basico.periodo)}</td>
                <td>${formatarValorRecurso(recurso.valores.profissional.valor, recurso.valores.profissional.tipo, recurso.valores.profissional.periodo)}</td>
                <td>${formatarValorRecurso(recurso.valores.empresarial.valor, recurso.valores.empresarial.tipo, recurso.valores.empresarial.periodo)}</td>
                <td><span class="badge bg-${recurso.status === 'ativo' ? 'success' : 'danger'}">${recurso.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarRecurso('${key}')" data-bs-toggle="modal" data-bs-target="#modalRecursos">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Função para editar recurso
    window.editarRecurso = (key) => {
        const recurso = recursos[key];
        if (!recurso) return;

        document.getElementById('nomeRecurso').value = recurso.nome;
        
        // Plano Básico
        document.getElementById('valorBasico').value = recurso.valores.basico.valor;
        document.getElementById('tipoBasico').value = recurso.valores.basico.tipo;

        // Plano Profissional
        document.getElementById('valorPro').value = recurso.valores.profissional.valor;
        document.getElementById('tipoPro').value = recurso.valores.profissional.tipo;

        // Plano Empresarial
        document.getElementById('valorEmpresarial').value = recurso.valores.empresarial.valor;
        document.getElementById('tipoEmpresarial').value = recurso.valores.empresarial.tipo;

        document.getElementById('statusRecurso').value = recurso.status;
    };

    // Event listener para salvar recurso
    document.getElementById('btnSalvarRecurso')?.addEventListener('click', () => {
        // Aqui você implementaria a lógica para salvar as alterações
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalRecursos'));
        modal.hide();
        
        // Recarregar a tabela
        carregarRecursos();
    });

    // Carregar recursos ao iniciar
    carregarRecursos();
}); 