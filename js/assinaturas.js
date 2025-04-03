document.addEventListener('DOMContentLoaded', function() {
    // Simulação de dados do histórico de pagamentos
    const paymentHistory = [
        {
            date: '01/04/2024',
            plan: 'Plano Profissional',
            value: 'R$ 99,90',
            status: 'Pago',
            receipt: '123456'
        },
        {
            date: '01/03/2024',
            plan: 'Plano Profissional',
            value: 'R$ 99,90',
            status: 'Pago',
            receipt: '123455'
        }
    ];

    // Função para renderizar o histórico de pagamentos
    function renderPaymentHistory() {
        const tbody = document.getElementById('paymentHistory');
        tbody.innerHTML = '';

        paymentHistory.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.date}</td>
                <td>${payment.plan}</td>
                <td>${payment.value}</td>
                <td><span class="badge bg-success">${payment.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="downloadReceipt('${payment.receipt}')">
                        <i class="bi bi-download"></i> Download
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Função para simular download do comprovante
    window.downloadReceipt = function(receiptNumber) {
        alert(`Iniciando download do comprovante ${receiptNumber}`);
        // Aqui você implementaria a lógica real de download
    }

    // Função para lidar com a assinatura de planos
    document.querySelectorAll('.card button').forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.closest('.card').querySelector('.card-title').textContent;
            alert(`Iniciando processo de assinatura do ${plan}`);
            // Aqui você implementaria a lógica real de assinatura
        });
    });

    // Inicialização
    renderPaymentHistory();

    // Adicionar evento para atualizar o histórico quando necessário
    document.getElementById('paymentHistory').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn')) {
            const receiptNumber = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
            downloadReceipt(receiptNumber);
        }
    });
}); 