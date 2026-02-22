# RAG - Padrões Construtivos (LIGHT) - ZENITH ENGINEERING MASTER

Esta é a especificação definitiva de engenharia para o projeto CQT LIGHT, consolidando o conhecimento das diretrizes primárias de 2016 e revisões subsequentes.

---

## ⚡ Catálogo de Condutores e Dimensionamento

| Tipo | Bitola ($mm^2$) | Ampacidade ($A$) | QDT Máx % | Uso Principal |
| :--- | :--- | :--- | :--- | :--- |
| **MT Compacta** | 50 / 95 / 150 | 185 / 270 / 360 | 3% (Tronco) | Urbano (Spacer Cable) |
| **MT Conv.** | 1/0 / 4/0 / 397 | 200 / 340 / 510 | 3% (Tronco) | Rural / Transmissão |
| **BT Mult.** | 35 / 70 / 120 / 240 | 115 / 181 / 250 / 426 | 5% (Total) | Distribuição Secundária |

---

## 🏗️ Matriz de Equipamentos e Esforços

### 🔌 Transformadores (Ratings & Loading)

* **Standard kVA**: 15, 30, 45, 75, 112.5, 150, 225, 300.
* **Fator de Carga Máximo**: 0.85 (85%) para regime nominal.
* **Padrão de Referência**: *Padrão de Equipamentos rev 01 - 2016-1.pdf*.

### 📐 Postes e Critérios Mecânicos

* **Engastamento Standard**: $E = (L/10) + 0,60$ metros.
* **Resistências Nominais (daN)**: 300, 600, 1000, 1500, 2000.
* **Threshold de Esforço**: Ângulos de deflexão $> 6^\circ$ ou vãos $> 40m$ (Compacta) exigem postes $\ge 1000daN$.
* **Referência**: *PTL0426DT 18 R1 (CÁLCULO DE ESFORÇO).pdf*.

---

## ⚡ Afastamentos e Segurança (Clearances)

Valores de referência para conformidade regulatória (Diretrizes Básicas 2016):

| Cenário | MT (13.8 kV) | BT (380/220V) | Observação |
| :--- | :--- | :--- | :--- |
| **Rodovias Federais** | 7,50 m | 6,00 m | Gabarito transporte carga |
| **Ruas e Avenidas** | 6,00 m | 6,00 m | Travessia de vias urbanas |
| **Calçadas/Pedestres** | 5,00 m | 4,50 m | Passagem segura |
| **Entrada Veículos** | 6,00 m | 6,00 m | Acesso a garagens/docas |
| **Horiz. Edificações** | 1,50 m | 1,20 m | Mínimo para janelas/sacadas |

> [!IMPORTANT]
> Se o afastamento horizontal for insuficiente ($< 1,5m$), utilizar **Braço Afastador** em estruturas MBNM ou Compacta (Ex: `B1A`, `B2A`).

---

## 🛡️ Proteção e Blindagem (MBNM)

Redes protegidas para áreas de alta interferência arbórea ou restrição de espaço:

* **Estruturas Base**: `MBNM-B1` (Tangente), `MBNM-B2` (Ângulo), `MBNM-B3` (Fim), `MBNM-B4` (Ângulo acentuado).
* **Blindagem BT**: Uso obrigatório de cabos multiplexados (`C30/50`, `C30/185`) com blindagem metálica aterrada em ambos os fins.
* **Transição**: Estruturas `MBNMRCSN` para derivação de rede convencional para blindada.

---

## 🌳 Gestão Ambiental e Manejo (PODA)

Códigos SAP mandatórios para orçamentação executiva:

* `PA/CR`: Poda de árvore **com** recolhimento (Obrigatório em centros urbanos).
* `PA/SR`: Poda de árvore **sem** recolhimento (Permitido em áreas rurais/pastos).
* `PA/BC`: Poda de Bambuzal (Especificação de lâmina de serra HT-131).
* `PODA_LV`: Poda em Linha Viva (Exige equipe especializada e SAP code 3007105).
* **Corredor de Segurança**: Livre de vegetação em raio de 2,0m (Compacta) a 3,0m (Convencional).

---

## 🎨 Metadados BIM e Civil 3D

Conjunção de layers e atributos para exportação legal:

* **Layer Principal**: `EQUIP_POSTE` (Atributos: `Pole_Type`, `Foundation_Depth`, `SAP_Code`).
* **Z-Coord**: O topo do poste no MDT deve respeitar a altura livre de projeto (Clearance + Flecha).
* **BOM Dynamic**: Exportação direta via `BomService.js` integrada aos metadados BIM.

---

## 🌾 Padrões Rurais (Monofásico/Trifásico)

* **Monofásico (MRT)**: Retorno por terra. Referência: *PADRÃO RURAL MONOFÁSICO REV 04 - 2016.pdf*.
* **Vãos Longos**: Permitidos vãos de até 150m em estruturas convencionais de alumínio nu com alma de aço (CAA).

---
*Última atualização: 2026-02-22*
*Status: ZENITH ENGINEERING MASTER (Stage 7)*
*Fontes primárias: Diretrizes Básicas LIGHT 2016, Padrão Compacta R3, Padrão Rural R4.*
