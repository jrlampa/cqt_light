# RAG - Padrões Construtivos (LIGHT) - ASCENDANT ENGINEERING MASTER

Esta versão "Ascendant" consolida o conhecimento operacional com inteligência executiva, mapeamento regional e normas de blindagem de rede.

---

## 🌎 Mapeamento de Regionais e Contratos (Executivo)

Utilize estes dados para direcionar orçamentos e fluxos de trabalho específicos por zona.

| Regional | Empresa(s) de Contrato | Foco de Projeto |
| :--- | :--- | :--- |
| **CENTRO SUL** | DÍNAMO / PARTNERSHIP | Áreas Urbanas Densas / Histórico |
| **VALE** | ELLCA / CENEGED | Expansão Industrial / Comercial |
| **OESTE** | INDICA | Expansão Residencial / Loteamentos |
| **BAIXADA** | INDICA | Normalização / Clandestinos |
| **LESTE** | ELLCA | Manutenção de Rede / Litoral |

---

## 🛡️ Padrão de Blindagem e Redes Especiais (MBNM / RCSN)

As redes de blindagem (`MBNM`) possuem requisitos mecânicos e de hardware superiores.

* **Estruturas Focais**:
  * `MBNM-B1`: Alinhamento reto em beco.
  * `MBNM-B3`: Final de linha em beco.
  * `MBNM-TRAP`: Instalação de Transformador Autoprotegido.
* **Hardware Específico**: Uso obrigatório de **Cinta de Aço para Poste Circular (220mm)** em estruturas de ancoragem.

---

## ⚡ Aterramento (Grounding) e Proteção

Regras de espaçamento e tipos padrão:

| Tipo | Aplicação | Descrição SAP |
| :--- | :--- | :--- |
| **AT-1** | Proteção Geral | Aterramento básico de rede. |
| **AT-2** | Equipamentos | Aterramento para Transformadores/Chaves. |
| **AT-3/5** | Final de Linha | Reforço de aterramento em extremidades. |

> [!IMPORTANT]
> **Regra de Espaçamento**: Deve haver um aterramento a cada **200 metros** de rede secundária, no máximo.
> **Material Base**: Haste de Aterramento 19mm x 3m (SAP `357989`).

---

## 📐 Regras de Puxada e Tração (Mecânica Avançada)

* **Ângulo de Deflexão**:
  * $< 6^\circ$: Estrutura Passante Simples.
  * $6^\circ$ a $30^\circ$: Estrutura de Ângulo com Reforço.
  * $> 30^\circ$: Ancoragem Dupla (SIV/CA3/CE3).
* **Vão Crítico**: Vãos $> 40m$ em rede compacta exigem cabo mensageiro de alta resistência (Espaçadores a cada 10m).

---

## 🎨 Simbologia e Camadas de Projeto (BIM Entry)

Camadas padronizadas para exportação Civil 3D/Revit:

* `SIMB_POSTE`: Representação gráfica 2.5D do poste.
* `SIMB_TRAFO`: Blocos dinâmicos para subestações.
* `SIMB_VÃO`: Linha de centro com metadados de tração.

---
*Última atualização: 2026-02-22*
*Status: ASCENDANT MASTER REFERENCE (Stage 6)*
*Fontes: calculation_logic.json, Regional_Leste, Roteiro_RDA, standards_index.json.*
