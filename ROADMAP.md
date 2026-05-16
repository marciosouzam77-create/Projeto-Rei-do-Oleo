# Roadmap — Rei do Óleo Santa Terezinha

Situação atual: MVP funcional com CRUD básico de clientes, veículos e serviços de troca de óleo, autenticação simples, persistência em arquivo JSON e envio manual de lembretes via WhatsApp.

---

## Fase 1 — Segurança e Estabilidade

> Objetivo: tornar o sistema seguro e confiável antes de escalar.

| Item | Descrição | Prioridade |
|---|---|---|
| **Banco de dados real** | Migrar `data.json` para SQLite (local) ou PostgreSQL (cloud). O arquivo JSON não suporta acesso concorrente e pode corromper dados. | Alta |
| **JWT na autenticação** | Substituir os tokens fixos (`"admin-token"`, `"customer-token"`) por JWT com expiração. Hoje qualquer pessoa que saiba a string tem acesso ilimitado. | Alta |
| **Validação server-side** | Adicionar validação de entrada em todas as rotas da API (placa, telefone, KM, preço). Hoje os dados chegam direto ao JSON sem qualquer verificação. | Alta |
| **Senha admin configurável** | A senha padrão `admin123` está hardcoded. Adicionar fluxo de troca obrigatória no primeiro acesso, similar ao que já existe para clientes. | Alta |
| **CORS restrito** | O servidor aceita requisições de qualquer origem. Restringir ao domínio da aplicação em produção. | Média |

---

## Fase 2 — Fluxo Operacional da Oficina

> Objetivo: digitalizar o fluxo completo de atendimento — da chegada do veículo à entrega.

### 2.1 Cadastro de Clientes

| Item | Descrição |
|---|---|
| **Formulário completo** | Cadastro com nome, CPF/CNPJ, telefone, e-mail, endereço e observações. |
| **Tipo de pessoa (PF/PJ)** | Campo obrigatório indicando se o cliente é Pessoa Física ou Pessoa Jurídica (empresa). Altera campos exibidos: CPF vs CNPJ, razão social vs nome. |
| **Busca rápida** | Localizar cliente por nome, placa ou telefone na entrada do veículo. |
| **Histórico consolidado** | Ver todos os veículos e serviços do cliente em um único lugar. |

### 2.2 Cadastro de Veículos

| Item | Descrição |
|---|---|
| **Ficha do veículo** | Placa, marca, modelo, ano, cor, chassi, combustível e KM atual. |
| **Consulta por placa** | Integração com API de consulta de placa (ex: FIPE ou Tabela Nacional) para preencher dados automaticamente. |
| **Múltiplos veículos por cliente** | Clientes com frota ou mais de um carro vinculados ao mesmo cadastro. |
| **Histórico do veículo** | Linha do tempo de todos os serviços realizados no veículo. |

### 2.3 Check-in do Veículo

| Item | Descrição |
|---|---|
| **Abertura de OS** | Ao dar entrada no veículo, criar uma Ordem de Serviço com data/hora, KM atual e relato do cliente. |
| **Checklist de fluidos e filtros** | Formulário guiado com os itens abaixo, cada um com avaliação de condição (Bom / Ruim / Não verificado): Fluido de freio, Óleo de direção, Óleo do motor, Fluido da transmissão automática, Fluido de câmbio manual, Fluido de arrefecimento, Pastilha de freio, Filtro de ar, Filtro de combustível, Filtro de cabine, Filtro de óleo. |
| **Condição Bom/Ruim** | Para cada item do checklist, registrar se está em bom estado ou precisa de atenção, gerando automaticamente a lista de serviços recomendados. |
| **Fotos no check-in** | Permitir anexar fotos do veículo na entrada (lataria, painel, odômetro, pneus) para registro do estado de recebimento. |
| **Campo de observações** | Texto livre para o técnico registrar detalhes adicionais observados na inspeção. |
| **Assinatura digital** | Coletar assinatura do cliente e do técnico responsável no momento do check-in, com registro de data/hora. |
| **Status em tempo real** | Painel com fila de veículos e status: `Aguardando → Em serviço → Pronto → Entregue`. |
| **Atribuição de mecânico** | Vincular o responsável pela execução dos serviços. |

### 2.4 Tipos de Serviços e Intervalos de Manutenção

| Item | Descrição |
|---|---|
| **Catálogo de serviços** | Tabela configurável com os serviços oferecidos pela oficina (ex: Troca de óleo, Alinhamento, Balanceamento, Troca de filtro, Revisão de freios). |
| **Preço base por serviço** | Valor padrão editável que pré-preenche o orçamento, com possibilidade de ajuste. |
| **Tempo estimado** | Duração prevista de cada serviço para gestão da fila. |
| **Categorias** | Agrupar serviços por categoria: Lubrificação, Suspensão, Elétrico, Funilaria, etc. |
| **Intervalos por tipo de óleo do motor** | Configurar o próximo retorno conforme o óleo utilizado: Convencional (5.000 km ou 6 meses), Semi-sintético (7.500 km ou 6 meses), Sintético (10.000 km ou 6 meses). |
| **Intervalos por tipo de câmbio** | Câmbio automático: 30.000 km ou 2 anos; Câmbio manual: 50.000 km ou 2 anos. |
| **Intervalos de outros fluidos** | Fluido de freio: 20.000 km ou 1 ano; Arrefecimento: 50.000 km ou 2 anos. |
| **Intervalos de filtros** | Filtro de ar e filtro de combustível: 10.000 km ou 1 ano; Filtro de cabine: uso severo 6 meses/10.000 km, uso normal 10.000 km/1 ano. |
| **Tipos de óleos selecionáveis** | No registro do serviço, técnico seleciona o tipo de óleo ou fluido utilizado; o sistema calcula automaticamente a data/KM do próximo retorno. |

### 2.5 Orçamentos

| Item | Descrição |
|---|---|
| **Criação de orçamento** | Vincular ao check-in, selecionar serviços do catálogo, adicionar peças e mão de obra avulsa. |
| **Aprovação pelo cliente** | Orçamento com status `Pendente / Aprovado / Recusado`. Admin pode registrar aprovação presencial ou enviar link. |
| **Envio via WhatsApp** | Enviar resumo do orçamento direto para o celular do cliente com link de aprovação. |
| **Geração de PDF** | Gerar PDF do orçamento com logo da oficina, dados do cliente, veículo, itens, valores e assinatura. |
| **Validade do orçamento** | Definir prazo de validade e alertar quando vencer. |

### 2.6 Check-out do Veículo

| Item | Descrição |
|---|---|
| **Fechamento da OS** | Registrar serviços efetivamente realizados, peças substituídas, KM final e observações técnicas. |
| **Serviços realizados vs não realizados** | No check-out, para cada item do checklist do check-in, indicar se o serviço foi realizado, não realizado (com motivo) ou adiado, espelhando a estrutura do check-in. |
| **Fotos no check-out** | Anexar fotos do veículo na saída para comprovar o estado de entrega. |
| **Campo de observações** | Texto livre para o técnico registrar detalhes sobre os serviços executados ou pendências identificadas. |
| **Assinatura digital** | Coletar assinatura do cliente e do técnico no momento da entrega do veículo. |
| **Registro de pagamento** | Forma de pagamento (dinheiro, cartão, Pix), valor pago e troco. |
| **Geração de recibo/nota** | PDF com resumo dos serviços, valores e dados fiscais básicos para o cliente. |
| **Atualização automática do veículo** | Check-out atualiza o KM atual, data da última troca e agenda o próximo retorno com base no tipo de óleo/fluido utilizado. |

---

## Fase 3 — Automação de Lembretes

> Objetivo: eliminar o envio manual de notificações.

| Item | Descrição |
|---|---|
| **WhatsApp automático** | Integrar com Evolution API ou Baileys para envio programático. Hoje cada lembrete abre uma aba do navegador manualmente. |
| **Agendamento automatizado** | Job agendado (node-cron) que rode diariamente e dispare notificações para veículos com manutenção próxima, com base nos intervalos configurados por tipo de óleo/fluido/filtro. |
| **Aviso de veículo pronto** | Enviar notificação automática (WhatsApp/SMS) ao cliente quando o status da OS mudar para "Pronto", eliminando a ligação manual. |
| **Tipos de aviso configuráveis** | Definir o conteúdo e o gatilho de cada tipo de mensagem: lembrete de manutenção próxima, veículo pronto para retirada, orçamento aguardando aprovação, parabéns de aniversário, etc. |
| **Controle de envio** | Registrar data/hora de cada notificação enviada para evitar repetições. |
| **Lembrete pós-orçamento** | Recontatar automaticamente clientes com orçamento não aprovado após X dias. |
| **Configuração de antecedência** | Tornar configurável o threshold de alerta por tipo de item (hoje fixo em 7 dias / 500 km para troca de óleo). |

---

## Fase 4 — Gestão e Relatórios

> Objetivo: dar ao administrador visibilidade financeira e operacional.

| Item | Descrição |
|---|---|
| **Múltiplos administradores** | Login individual por e-mail/senha e controle de permissões (recepcionista, mecânico, gerente). |
| **Meta mensal configurável** | A meta de R$ 15.000/mês está hardcoded no código. Mover para configuração editável. |
| **Dashboard financeiro** | Gráficos de faturamento, ticket médio, serviços por tipo e comparativo mensal. |
| **Relatório de OS por período** | Exportar todas as ordens de serviço em PDF ou planilha por intervalo de datas. |
| **Controle de estoque básico** | Registrar entradas e saídas de óleos e peças para calcular margem real por serviço. |
| **Taxa de conversão de orçamentos** | Percentual de orçamentos aprovados vs. recusados por período. |

---

## Fase 5 — Experiência do Cliente

> Objetivo: melhorar o portal do cliente e reduzir fricção no atendimento.

| Item | Descrição |
|---|---|
| **Acompanhamento de OS** | Cliente visualiza o status do veículo em tempo real (Aguardando / Em serviço / Pronto). |
| **Aprovação de orçamento online** | Cliente recebe link, visualiza o orçamento e aprova ou recusa sem precisar ligar. |
| **Histórico completo** | Todos os serviços anteriores com detalhes (óleo, KM, itens, valor) na área do cliente. |
| **PWA / Acesso mobile** | Configurar como Progressive Web App para instalação no celular com ícone e tela de splash. |
| **Recuperação de senha** | Redefinir senha via SMS ou WhatsApp sem precisar do admin. |

---

## Fase 6 — Infraestrutura e Deploy

> Objetivo: preparar para uso em produção com confiabilidade e escalabilidade.

| Item | Descrição |
|---|---|
| **Containerização** | `Dockerfile` e `docker-compose.yml` para deploy simplificado em qualquer VPS. |
| **Backup automático** | Job diário que exporta o banco para armazenamento externo (S3 ou Google Drive). |
| **Deploy contínuo** | Pipeline CI/CD (GitHub Actions) para deploy automático a cada push na branch `main`. |
| **Monitoramento** | Logs estruturados e alertas de erro (Sentry ou similar). |
| **Multi-filial** | Suporte a mais de uma unidade com isolamento de dados por filial e painel consolidado. |

---

## Resumo de Prioridades

```
Agora        →  Fase 1: segurança (banco de dados real + JWT + validação)
Curto prazo  →  Fase 2: fluxo operacional (check-in/out + tipos de serviço + cadastros + orçamentos com PDF)
Médio prazo  →  Fase 3: automação de lembretes WhatsApp
Médio prazo  →  Fase 4: gestão financeira e relatórios
Longo prazo  →  Fases 5 e 6: portal do cliente + infraestrutura de produção
```
