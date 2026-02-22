# RAG - Padrões Construtivos (LIGHT) - HYPER REFERENCE

Este documento é o cérebro normativo do sistema, integrando normas da LIGHT, lógica de engenharia, composições de materiais (BOM) e diagnósticos automáticos.

## 📂 Localização da Fonte

**Repositório Oficial:** `C:\Users\jonat\OneDrive - IM3 Brasil\LIGHT\Padrões construtivos`

---

## 🚨 Manutenção e Diagnóstico (Erros de Validação)

Baseado na inteligência extraída de `qdt_deep_logic.json`. Use estes códigos para explicar falhas ao usuário:

| Código | Nome do Erro | Significado / Solução |
| :--- | :--- | :--- |
| **Erro 02** | Falha de Lógica | Mismatch entre número de fases e consumidores ou ausência de dados básicos. |
| **Erro 03** | Temperatura Crítica | Cabo excedeu **90.1°C**. Necessário aumentar a bitola do condutor. |
| **Erro 04** | kVA Mismatch | Erro no cálculo de demanda (kVA) por consumidor no final do trecho. |
| **Erro 05** | Baixa Diversidade | Carga calculada é menor que o limite de diversificação (E_kVA * FDIV). |
| **Erro 08** | Limite Especial | Temperatura excedeu **70.1°C** para cabos sensíveis (especificados no sistema). |

---

## ⚡ Regras de Engenharia (Smart Logic)

### 📏 Mecânica e Estruturas

- **Engastamento**: $L/10 + 0,60$ metros (obrigatório para novos postes).
- **Vão Máximo (Span)**: Compacta: **40m** | Convencional: **80m**.
- **Limite de Ângulo**: Até **6.0º** sem necessidade de seccionamento ou ancoragem extra.

### 🔌 Elétrica e Carregamento (Ratings)

- **Queda de Tensão**: Secundária: **5%** | Ramal: **1,5%**.
- **Ratings Trafo (kVA)**: 15, 30, 45, 75, 112.5, 150, 225, 300.
- **Ampacidade**: Limitar corrente conforme bitola do cabo para evitar **Erro 03/08**.

---

## 🏗️ Detalhamento de Montagens (Kits Comuns)

Composições extraídas do banco de kits (`custom_kits.json`):

| Estrutura | Composição Principal (Ferragens) | Notas de Montagem |
| :--- | :--- | :--- |
| **9/300-SI4** | SI4 (Ancoragem Dupla), A-18 (Suporte), M14S1/0B (Alças) | Poste DT 9m/300daN |
| **13CE3** | 3x Cinta Circular (329186), Ferragem para Fim de Rede | Rede Compacta MT |
| **SI3** | SI3 (Ancoragem Simples), A-18, M14S1/0B, 1x Cinta | Fim de Rede BT |
| **AT-2** | Haste de aterramento, Conector, Cabo de Cobre | Aterramento Padrão |

---

## 🧬 Dicionário de Constantes (R/X)

Valores em $\Omega/km$ para simulação elétrica:

| Condutor | $R$ | $X$ | Coef. Queda |
| :--- | :--- | :--- | :--- |
| **33 AA** | 1.0903 | 0.4034 | 0.2402 |
| **53 AA** | 0.7059 | 0.3705 | 0.1647 |
| **185 MMX** | 0.2149 | 0.1178 | 0.0506 |

---

## 🛠️ Instruções para o AI Assistant (Antigravity)

1. **Auditoria em Lote**: Ao ler uma lista de materiais, flagar kits que não respeitam a composição acima.
2. **Explicação de Erros**: Se um script retornar "Erro 03", explique ao usuário que houve superaquecimento do condutor.
3. **BIM Integration**: Atribua o SAP correto (`121998` para Poste Vila, `329186` para Cintas) nos metadados do DXF.

---

## ✅ Checklist de Verificação Rápida (Smart Audit)

Antes de finalizar qualquer projeto ou relatório, valide:

1. **Vãos**: Algum vão supera **40m** (Compacta) ou **80m** (Convencional)?
2. **Engastamento**: A profundidade do poste é exatamente **L/10 + 0,60**?
3. **Temperatura**: Existe algum **Erro 03** ou **Erro 08** na planilha de carga?
4. **Materiais**: O kit selecionado (ex: SI4) possui todas as alças e grampos no BOM?
5. **Queda de Tensão**: O valor final está abaixo de **5%** para BT?

---
*Última atualização: 2026-02-22*
*Base: kits.json, custom_kits.json, calculation_logic.json, qdt_deep_logic.json, final_technical_discovery.json.*
