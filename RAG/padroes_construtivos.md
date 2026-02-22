# RAG - Padrões Construtivos (LIGHT) - ULTIMATE ENGINEERING REFERENCE

Esta é a versão definitiva do RAG, consolidando metadados técnicos, normas de segurança, conformidade ambiental e diretrizes de integração BIM.

---

## ⚡ Catálogo de Condutores e Dimensionamento

| Tipo | Bitola ($mm^2$) | Ampacidade ($A$) | QDT Máx % |
| :--- | :--- | :--- | :--- |
| **MT Compacta** | 50 / 95 / 150 | 185 / 270 / 360 | 3% (Tronco) |
| **BT Mult.** | 35 / 70 / 120 | 115 / 181 / 250 | 5% (Total) |

---

## 🏗️ Matriz de Equipamentos

### 🔌 Transformadores & Demanda

* **Regra de Ouro**: Reservar 15% de margem (Limite 85% kVA).
* **Ratings**: 15, 30, 45, 75, 112.5, 150, 225, 300 kVA.

### 📐 Postes e Esforços

* **Engastamento**: $E = (L/10) + 0,60$.
* **Esforço Crítico**: Ângulos $> 6^\circ$ exigem verificação de tração e possível uso de postes de 1000daN+.

---

## �️ Segurança e Afastamentos (Clearances)

Valores mínimos para conformidade em cruzamentos e passagens:

| Cenário | MT (13.8 kV) | BT (380/220V) |
| :--- | :--- | :--- |
| **Rodovias Federais** | 7,50 m | 6,00 m |
| **Ruas e Avenidas** | 6,00 m | 5,50 m |
| **Calçadas/Pedestres** | 5,00 m | 4,50 m |
| **Entrada de Veículos** | 6,00 m | 5,00 m |

> [!IMPORTANT]
> Se o afastamento horizontal de edificações for $< 1,5m$, é obrigatório o uso de **Braço Afastador** (Estruturas tipo `B1A`, `B2A`, etc.).

---

## 🌳 Conformidade Ambiental (Poda)

Códigos SAP para serviços de manejo de vegetação:

* `PA/CR`: Poda de árvore com recolhimento (Urbano denso).
* `PA/SR`: Poda de árvore sem recolhimento (Áreas rurais/vazias).
* `PODA_LV`: Poda em Linha Viva (Alta complexidade).
* **Distância de Segurança**: Manter corredor de 2,0m livre de vegetação para redes compactas.

---

## 🎨 Integração BIM (Layers)

| Elemento | Layer CAD | Atributo Principal |
| :--- | :--- | :--- |
| **Poste** | `EQUIP_POSTE` | `pole_id`, `daN` |
| **Transf.** | `EQUIP_TRANSF` | `kva_rating` |
| **Rede MT** | `RED_MT` | `conductor_sap` |
| **Ferragens** | `ACESS_FERRAGEM` | `kit_code` |

---

## � Dicas Estratégicas (Estagiário "Fora da Caixa")

1. **Compartilhamento**: Sempre que instalar poste novo, prever espaço para 1 ocupante de telecom (norma 0,5m abaixo da BT).
2. **Poluição Visual**: Em centros históricos, priorizar estruturas compactas (`CE`) sobre convencionais (`CA`).
3. **Manutenibilidade**: Evitar cruzar redes sobre telhados, mesmo que a altura seja legal; priorizar o logradouro público.

---
*Última atualização: 2026-02-22*
*Status: ULTIMATE REFERENCE (Stage 5)*
