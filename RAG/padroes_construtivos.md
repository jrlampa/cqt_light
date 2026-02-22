# RAG - Padrões Construtivos (LIGHT) - ULTRA REFERENCE

Este documento é a base de conhecimento inteligente para o sistema, integrando normas técnicas da LIGHT, lógica de engenharia e composições de materiais (BOM).

## 📂 Localização da Fonte

**Repositório Oficial:** `C:\Users\jonat\OneDrive - IM3 Brasil\LIGHT\Padrões construtivos`

---

## ⚡ Regras de Engenharia (Smart Logic)

Baseado em `data/rules/calculation_logic.json`:

### 🏗️ Mecânica e Estruturas

- **Engastamento de Postes**: Fórmula $L/10 + 0,60$ metros.
- **Limite de Ângulo**: Até 6.0º sem necessidade de verificação de tração adicional.
- **Vão Máximo (Span)**:
  - Rede Compacta (Spacer): **40m**
  - Rede Convencional (Nua): **80m**

### 🔌 Elétrica e Carregamento

- **Limite de Carga (Trafo)**: Máximo **85%** de carregamento nominal.
- **Queda de Tensão**:
  - Rede Secundária: Máximo **5%**.
  - Ramal de Ligação: Máximo **1,5%**.
- **Ratings de Transformador (kVA)**: 15, 30, 45, 75, 112.5, 150, 225, 300.

---

## 🏗️ Dicionário de Estruturas (Kits Técnicos)

| Sigla | Descrição Funcional | Tipo de Rede |
| :--- | :--- | :--- |
| **S1 / SI1** | Alinhamento Reto | Convencional / Multiplexada |
| **SI3.SI3** | Ângulos Acentuados (> 50º) | Exige ancoragem dupla |
| **SI4** | Ancoragem Dupla / Fim de Rede | Finais de linha |
| **13CE1** | Alinhamento em Tangente | Rede Compacta (MT) |
| **13CE3** | Estrutura Fim de Rede | Rede Compacta (MT) |
| **MBNM-B1** | Beco Alinhamento | Rede Blindada (Antifurto) |
| **SIV1 / SIV3** | Padrão Vila (Alinhamento/Ancoragem)| Áreas Restritas |

---

## 📦 Composição de Materiais (Golden Patterns)

Amostras de composição extraídas de `data/kits/kits.json`:

| Kit | Componente Principal (SAP) | Função do Componente |
| :--- | :--- | :--- |
| **13B1** | 309112 | Chave Fusível 34,5kV 200A |
| **13CE2** | 309392 | Para-raios Silicone 15kV |
| **SI1** | 335053 | Grampo de Ancoragem / Terminal |
| **SIV1** | 121998 | Poste P675200 (Especial Vila) |

---

## 🔩 Simbologia de Ferragens (Quick Search)

- **F-10/**: Cinta para Poste Circular
- **O-80/**: Conector Perfurante (BT)
- **O-12/**: Conector Cunho (Ampact MT)
- **M1/**: Alça Preformada
- **A-30/02**: Suporte para Transformador

---

## ⚡ Constantes Elétricas (Condutores)

Valores de resistência ($R$) e reatância ($X$) em $\Omega/km$ para cálculos de queda de tensão:

| Condutor | $R$ ($\Omega/km$) | $X$ ($\Omega/km$) | Coef. Queda |
| :--- | :--- | :--- | :--- |
| **33 AA** | 1.0903 | 0.4034 | 0.2402 |
| **53 AA** | 0.7059 | 0.3705 | 0.1647 |
| **107 A** | 0.3225 | 0.2968 | 0.0906 |
| **53 QX** | 0.6641 | 0.1311 | 0.1399 |
| **70 MMX** | 0.5697 | 0.1260 | 0.1206 |
| **185 MMX** | 0.2149 | 0.1178 | 0.0506 |

---

## 🛠️ Instruções para o AI Assistant (Antigravity)

- **Cálculos**: Use a fórmula de engastamento ($L/10 + 0,60$) e as constantes elétricas acima para validações.
- **Validação**: Verifique se vãos não superam os limites (40m/80m) e se a queda de tensão está dentro dos limites nominais (5% / 1,5%).
- **Smart Backend**: Utilize os metadados SAP e composições de kit para gerar listas de materiais precisas.

---
*Última atualização: 2026-02-22*
*Base: kits.json, calculation_logic.json, final_technical_discovery.json.*
