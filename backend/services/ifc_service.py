"""
CQT Light — Serviço de Exportação IFC (Half-way BIM)
Gera arquivo IFC2X3 STEP para rede elétrica de distribuição.

IFC = Industry Foundation Classes (ISO 16739) — formato aberto BIM.
Geração via texto puro (sem bibliotecas externas) → zero custo.

Entidades geradas:
  - IFCCOLUMN   → Poste de distribuição
  - IFCFLOWSEGMENT → Trecho de rede (cabo elétrico)
  - IFCELECTRICALDISTRIBUTIONELEMENT → Transformador
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Sequence

from domain.entities import Poste, TrechoRede, Transformador, RedeEletrica

# ─── IDs fixos de infraestrutura IFC (determinísticos para testes) ──────────


def _guid(seed: str) -> str:
    """Gera GUID IFC determinístico a partir de uma semente."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, seed)).upper().replace("-", "")[:22]


def _ts() -> str:
    """Timestamp ISO 8601 para o cabeçalho IFC."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


# ─── Auxiliares de escrita STEP ───────────────────────────────────────────────

def _ifc_string(value: str | None) -> str:
    if value is None:
        return "$"
    escaped = value.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def _coord(x: float, y: float) -> str:
    """Ponto 2D em metros."""
    return f"({x:.4f},{y:.4f})"


def _coord3(x: float, y: float, z: float = 0.0) -> str:
    """Ponto 3D em metros."""
    return f"({x:.4f},{y:.4f},{z:.4f})"


# ─── Gerador Principal ────────────────────────────────────────────────────────

def generate_ifc(rede: RedeEletrica) -> bytes:
    """
    Gera arquivo IFC2X3 STEP para a rede elétrica.

    Args:
        rede: modelo de rede elétrica (entidade de domínio)

    Returns:
        bytes UTF-8 do arquivo IFC2X3 STEP.
    """
    now = _ts()
    lines: List[str] = []

    def w(s: str) -> None:
        lines.append(s)

    # ── HEADER ────────────────────────────────────────────────────────────────
    w("ISO-10303-21;")
    w("HEADER;")
    w("FILE_DESCRIPTION(('CQT Light 2.5D Electrical Network','IFC2X3'),'2;1');")
    w(f"FILE_NAME('rede_eletrica.ifc','{now}',('CQT Light'),('CQT Light'),"
      f"'CQT Light IFC Generator v1.0','IFC2X3','');")
    w("FILE_SCHEMA(('IFC2X3'));")
    w("ENDSEC;")
    w("DATA;")

    # ── Infraestrutura básica IFC ─────────────────────────────────────────────
    # #1 Organização
    w("#1=IFCORGANIZATION($,'CQT Light',$,$,$);")
    # #2 Aplicação
    w("#2=IFCAPPLICATION(#1,'1.0','CQT Light IFC Exporter','CQTL');")
    # #3 Pessoa
    w("#3=IFCPERSON($,'Eng. CQT',$,$,$,$,$,$);")
    # #4 PessoaOrganização
    w("#4=IFCPERSONANDORGANIZATION(#3,#1,$);")
    # #5 OwnerHistory
    w(f"#5=IFCOWNERHISTORY(#4,#2,$,.ADDED.,$,$,$,0);")
    # #6 Direção X
    w("#6=IFCDIRECTION((1.,0.,0.));")
    # #7 Direção Z
    w("#7=IFCDIRECTION((0.,0.,1.));")
    # #8 Origem
    w("#8=IFCCARTESIANPOINT((0.,0.,0.));")
    # #9 Placement 3D
    w("#9=IFCAXIS2PLACEMENT3D(#8,#7,#6);")
    # #10 Contexto geométrico
    w("#10=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#9,$);")
    # #11 Unidades
    w("#11=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);")
    w("#12=IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);")
    w("#13=IFCSIUNIT(*,.MASSUNIT.,$,.KILOGRAM.);")
    w("#14=IFCUNITASSIGNMENT((#11,#12,#13));")
    # #15 Projeto
    proj_guid = _guid("projeto:" + rede.titulo)
    w(f"#15=IFCPROJECT('{proj_guid}',#5,{_ifc_string(rede.titulo)},$,$,$,$,(#10),#14);")
    # #16 Site
    site_guid = _guid("site:" + rede.titulo)
    w(f"#16=IFCSITE('{site_guid}',#5,'Rede Elétrica',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);")
    # #17 RelAggregate projeto→site
    ra1_guid = _guid("ra1:" + rede.titulo)
    w(f"#17=IFCRELAGGREGATES('{ra1_guid}',#5,'Projeto → Site',$,#15,(#16));")
    # #18 Building (contêiner)
    bldg_guid = _guid("bldg:" + rede.titulo)
    w(f"#18=IFCBUILDING('{bldg_guid}',#5,'Rede Distribuição',$,$,$,$,$,.ELEMENT.,$,$,$);")
    # #19 RelAggregate site→building
    ra2_guid = _guid("ra2:" + rede.titulo)
    w(f"#19=IFCRELAGGREGATES('{ra2_guid}',#5,'Site → Rede',$,#16,(#18));")
    # #20 Storey (andar — representa o nível do piso/solo)
    storey_guid = _guid("storey:" + rede.titulo)
    w(f"#20=IFCBUILDINGSTOREY('{storey_guid}',#5,'Nível Solo',$,$,$,$,$,.ELEMENT.,0.);")
    ra3_guid = _guid("ra3:" + rede.titulo)
    w(f"#21=IFCRELAGGREGATES('{ra3_guid}',#5,'Building → Storey',$,#18,(#20));")

    entity_refs: List[str] = []  # referências para RelContainedInSpatialStructure
    next_id = 22

    # ── Postes (IFCCOLUMN) ───────────────────────────────────────────────────
    poste_ref: dict[str, int] = {}  # poste_id → ifc entity #

    for poste in rede.postes:
        pt_id = next_id
        next_id += 1
        placement_id = next_id
        next_id += 1
        axis2d_id = next_id
        next_id += 1
        col_id = next_id
        next_id += 1

        # Ponto de inserção
        w(f"#{pt_id}=IFCCARTESIANPOINT(({poste.x:.4f},{poste.y:.4f},0.));")
        # Placement
        w(f"#{axis2d_id}=IFCAXIS2PLACEMENT3D(#{pt_id},#7,#6);")
        w(f"#{placement_id}=IFCLOCALPLACEMENT($,#{axis2d_id});")
        # IFCCOLUMN
        col_guid = _guid(f"poste:{poste.id}")
        label = f"P{poste.id}"
        desc = f"H={poste.altura_m}m {poste.carga_dan}daN"
        if poste.descricao:
            desc += f" - {poste.descricao}"
        w(f"#{col_id}=IFCCOLUMN('{col_guid}',#5,{_ifc_string(label)},"
          f"{_ifc_string(desc)},'Poste',#{placement_id},$,'P{poste.id}');")

        poste_ref[poste.id] = col_id
        entity_refs.append(f"#{col_id}")

        # Propriedades do poste (IFCPROPERTYSINGLEVALUE)
        pset_id = next_id
        next_id += 1
        prop_h_id = next_id
        next_id += 1
        prop_c_id = next_id
        next_id += 1
        pset_rel_id = next_id
        next_id += 1

        w(f"#{prop_h_id}=IFCPROPERTYSINGLEVALUE('AlturaPoste',$,"
          f"IFCLENGTHMEASURE({poste.altura_m:.2f}),$);")
        w(f"#{prop_c_id}=IFCPROPERTYSINGLEVALUE('CargaMecanicaDaN',$,"
          f"IFCINTEGER({int(poste.carga_dan)}),$);")
        pset_guid = _guid(f"pset:poste:{poste.id}")
        w(f"#{pset_id}=IFCPROPERTYSET('{pset_guid}',#5,'Pset_PosteEletrico',$,"
          f"(#{prop_h_id},#{prop_c_id}));")
        pset_rel_guid = _guid(f"pset_rel:poste:{poste.id}")
        w(f"#{pset_rel_id}=IFCRELDEFINESBYPROPERTIES('{pset_rel_guid}',#5,$,$,"
          f"(#{col_id}),#{pset_id});")

    # ── Transformadores (IFCELECTRICALDISTRIBUTIONELEMENT) ───────────────────
    for trafo in rede.transformadores:
        tref_poste = rede.get_poste(trafo.poste_id)
        if tref_poste is None:
            continue
        tx, ty = tref_poste.x + 0.6, tref_poste.y + 0.6  # deslocamento simbólico

        pt_id = next_id
        next_id += 1
        ax_id = next_id
        next_id += 1
        pl_id = next_id
        next_id += 1
        el_id = next_id
        next_id += 1

        w(f"#{pt_id}=IFCCARTESIANPOINT(({tx:.4f},{ty:.4f},0.));")
        w(f"#{ax_id}=IFCAXIS2PLACEMENT3D(#{pt_id},#7,#6);")
        w(f"#{pl_id}=IFCLOCALPLACEMENT($,#{ax_id});")
        el_guid = _guid(f"trafo:{trafo.id}")
        label = f"TR{trafo.id}"
        desc = f"{trafo.potencia_kva:.1f}kVA"
        w(f"#{el_id}=IFCELECTRICALDISTRIBUTIONELEMENT('{el_guid}',#5,"
          f"{_ifc_string(label)},{_ifc_string(desc)},'Transformador',"
          f"#{pl_id},$,'TR{trafo.id}');")
        entity_refs.append(f"#{el_id}")

        # Propriedade potência
        prop_kva_id = next_id
        next_id += 1
        pset_id = next_id
        next_id += 1
        pset_rel_id = next_id
        next_id += 1

        w(f"#{prop_kva_id}=IFCPROPERTYSINGLEVALUE('PotenciaKVA',$,"
          f"IFCREAL({trafo.potencia_kva:.2f}),$);")
        pset_guid = _guid(f"pset:trafo:{trafo.id}")
        w(f"#{pset_id}=IFCPROPERTYSET('{pset_guid}',#5,'Pset_TransformadorDistribuicao',$,"
          f"(#{prop_kva_id}));")
        pset_rel_guid = _guid(f"pset_rel:trafo:{trafo.id}")
        w(f"#{pset_rel_id}=IFCRELDEFINESBYPROPERTIES('{pset_rel_guid}',#5,$,$,"
          f"(#{el_id}),#{pset_id});")

    # ── Trechos de rede (IFCFLOWSEGMENT) ────────────────────────────────────
    for i, trecho in enumerate(rede.trechos):
        pa = rede.get_poste(trecho.poste_a)
        pb = rede.get_poste(trecho.poste_b)
        if pa is None or pb is None:
            continue

        mid_x = (pa.x + pb.x) / 2
        mid_y = (pa.y + pb.y) / 2

        pt_id = next_id
        next_id += 1
        ax_id = next_id
        next_id += 1
        pl_id = next_id
        next_id += 1
        seg_id = next_id
        next_id += 1

        w(f"#{pt_id}=IFCCARTESIANPOINT(({mid_x:.4f},{mid_y:.4f},0.));")
        w(f"#{ax_id}=IFCAXIS2PLACEMENT3D(#{pt_id},#7,#6);")
        w(f"#{pl_id}=IFCLOCALPLACEMENT($,#{ax_id});")
        seg_guid = _guid(f"trecho:{trecho.poste_a}:{trecho.poste_b}:{i}")
        label = f"TRECHO_{trecho.nivel}_{i + 1}"
        desc = f"{trecho.nivel} {trecho.condutor or 'SEM_CONDUTOR'}"
        w(f"#{seg_id}=IFCFLOWSEGMENT('{seg_guid}',#5,{_ifc_string(label)},"
          f"{_ifc_string(desc)},'Trecho de Rede',#{pl_id},$,'TR{i + 1}');")
        entity_refs.append(f"#{seg_id}")

        # Propriedade nível
        prop_nv_id = next_id
        next_id += 1
        pset_id = next_id
        next_id += 1
        pset_rel_id = next_id
        next_id += 1

        w(f"#{prop_nv_id}=IFCPROPERTYSINGLEVALUE('NivelTensao',$,"
          f"IFCLABEL({_ifc_string(trecho.nivel)}),$);")
        pset_guid = _guid(f"pset:trecho:{trecho.poste_a}:{trecho.poste_b}:{i}")
        w(f"#{pset_id}=IFCPROPERTYSET('{pset_guid}',#5,'Pset_TrechoRedeEletrica',$,"
          f"(#{prop_nv_id}));")
        pset_rel_guid = _guid(f"pset_rel:trecho:{trecho.poste_a}:{trecho.poste_b}:{i}")
        w(f"#{pset_rel_id}=IFCRELDEFINESBYPROPERTIES('{pset_rel_guid}',#5,$,$,"
          f"(#{seg_id}),#{pset_id});")

    # ── RelContainedInSpatialStructure (associa tudo ao Storey) ─────────────
    if entity_refs:
        rel_cont_guid = _guid("relcont:" + rede.titulo)
        refs_str = ",".join(entity_refs)
        w(f"#{next_id}=IFCRELCONTAINEDINSPATIALSTRUCTURE('{rel_cont_guid}',#5,"
          f"'Elementos da Rede',$,({refs_str}),#20);")
        next_id += 1

    w("ENDSEC;")
    w("END-ISO-10303-21;")

    return "\n".join(lines).encode("utf-8")


def validate_ifc(ifc_bytes: bytes) -> dict:
    """
    Valida um arquivo IFC2X3 STEP gerado.

    Args:
        ifc_bytes: conteúdo do arquivo IFC

    Returns:
        dict com resultado da validação
    """
    content = ifc_bytes.decode("utf-8")
    lines = content.splitlines()

    has_header = "ISO-10303-21;" in content
    has_endsec = "END-ISO-10303-21;" in content
    has_schema = "IFC2X3" in content
    has_project = "IFCPROJECT" in content

    entity_counts: dict[str, int] = {}
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("#") or "=" not in stripped:
            continue
        entity_type = stripped.split("=", 1)[1].split("(")[0].strip().upper()
        entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1

    n_postes = entity_counts.get("IFCCOLUMN", 0)
    n_trechos = entity_counts.get("IFCFLOWSEGMENT", 0)
    n_trafos = entity_counts.get("IFCELECTRICALDISTRIBUTIONELEMENT", 0)

    valid = has_header and has_endsec and has_schema and has_project

    return {
        "valid": valid,
        "schema": "IFC2X3",
        "has_header": has_header,
        "has_footer": has_endsec,
        "has_project": has_project,
        "entity_counts": entity_counts,
        "n_postes": n_postes,
        "n_trechos": n_trechos,
        "n_trafos": n_trafos,
        "total_entities": sum(entity_counts.values()),
        "warnings": [] if valid else ["Arquivo IFC inválido ou incompleto"],
    }
