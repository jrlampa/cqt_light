# RAG - Padrões Construtivos (LIGHT) - OPERATIONAL MASTER

Este documento é a referência técnica operacional para o sistema, integrando metadados de engenharia, catálogos de materiais e diretrizes de integração BIM.

---

## ⚡ Catálogo de Condutores (MT/BT)

Utilize estes valores para cálculos de ampacidade e queda de tensão ($R/X$).

| Tipo | Condutor | Bitola ($mm^2$) | Ampacidade ($A$) | SAP Sugerido |
| :--- | :--- | :--- | :--- | :--- |
| **MT** | Cabo Spacer | 53 / 185 | 185 / 355 | `cab_53_spacer` |
| **MT** | Cabo CAA | 21 / 53 | 120 / 180 | `cab_21_caa` |
| **BT** | Multiplex | 35 / 70 / 120 | 115 / 181 / 250 | `mult_70` |
| **BT** | Rede Nua | 4 / 2 / 1/0 AWG | 95 / 130 / 190 | `cab_1_0awg` |

---

## 🏗️ Dimensionamento e Estruturas

### 🔌 Transformadores (Ratings kVA)

O sistema deve sugerir o transformador superior mais próximo, respeitando o limite de **85%** de carga.
**Ratings Padrão:** 15, 30, 45, 75, 112.5, 150, 225, 300.
*Exemplo: Carga de 65 kVA $\rightarrow$ Instalar 75 kVA.*

### 📐 Matriz de Postes (Concreto)

Fórmula de Engastamento: $L/10 + 0,60$.

| Altura ($m$) | Esforço ($daN$) | SAP/ID |
| :--- | :--- | :--- |
| 9 | 300 / 600 / 1000 | `P19300B` |
| 11 | 300 / 600 / 1000 / 1500 | `P111300B` |
| 12 | 600 / 1000 / 2000 | `P112600B` |

---

## 🎨 Mapeamento "Half-way BIM" (CAD/DXF)

Para exportação de metadados integrada ao Civil 3D/Revit:

| Elemento | Camada (Layer) Sugerida | Atributos Obrigatórios |
| :--- | :--- | :--- |
| **Poste** | `EQUIP_POSTE` | SAP, Altura, Esforço, Engastamento |
| **Rede MT** | `RED_MT_COMPACTA` | SAP Cabo, Bitola, Fase, QDT % |
| **Trafo** | `EQUIP_TRANSF` | SAP, kVA, Carregamento % |
| **Ferragens** | `ACESS_FERRAGEM` | SAP, Descrição, Kit Associado |

---

## 🚨 Códigos de Erro (Troubleshoot)

| Código | Erro | Ação Recomendada |
| :--- | :--- | :--- |
| **Erro 03** | Temperatura > 90.1°C | Aumentar seção do cabo (Ampacidade insuficiente). |
| **Erro 01** | QDT > 5% | Redistribuir carga ou aproximar o Trafo. |
| **Erro 08** | Limite 70.1°C | Revisar materiais sensíveis no trecho. |

---

## 🛠️ Instruções para o AI Assistant (Antigravity)

1. **Cálculo Automático**: Calcule a bitola mínima baseada na carga informada e na tabela de ampacidade acima.
2. **Validação Geométrica**: Vãos $> 40m$ em rede compacta devem disparar aviso de violação normativa.
3. **Geração de BOM**: Use os SAPs definidos na `tabela_sheet_full` para exportações Excel.

---
*Última atualização: 2026-02-22*
*Base: kits.json, poles.json, calculation_logic.json, final_technical_discovery.json, Configurator.jsx.*
