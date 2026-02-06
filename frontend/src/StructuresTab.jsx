import React, { useState, useEffect } from 'react';
import { Search, Package, ShoppingCart, Info, CheckCircle } from 'lucide-react';

const StructuresTab = () => {
  const [kits, setKits] = useState({});
  const [catalog, setCatalog] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKitId, setSelectedKitId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kitsRes, catalogRes] = await Promise.all([
          fetch('http://localhost:5000/api/kits'),
          fetch('http://localhost:5000/api/catalog/materials')
        ]);
        const kitsData = await kitsRes.json();
        const catalogData = await catalogRes.json();
        setKits(kitsData);
        setCatalog(catalogData);
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredKits = Object.keys(kits).filter(id => {
    const term = searchTerm.toLowerCase();
    const idMatch = id.toLowerCase().includes(term);
    const nameMatch = (kits[id].name || '').toLowerCase().includes(term);
    // Optional: Search in materials too?
    return idMatch || nameMatch;
  }).slice(0, 50);

  const getMaterialDetails = (sap) => {
    return catalog[sap] || { description: "Item não encontrado", unit: "-", price: 0 };
  };

  const calculateTotal = (materials) => {
    return materials.reduce((acc, curr) => {
      const details = getMaterialDetails(curr.sap);
      return acc + (curr.qty * details.price);
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '20px', height: '100%', overflow: 'hidden' }}>

      {/* 1. Kit Selector */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <h3 style={{ marginBottom: '15px' }}>Kits e Materiais</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Buscar Kits (ex: 13N1, CE1...)"
              className="input-field"
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Carregando Kits...</div>
          ) : filteredKits.map(id => (
            <button
              key={id}
              onClick={() => setSelectedKitId(id)}
              style={{
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid',
                borderColor: selectedKitId === id ? 'var(--accent-blue)' : 'var(--glass-border)',
                background: selectedKitId === id ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedKitId === id ? 'var(--accent-blue)' : 'white' }}>{id}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{kits[id].name}</span>
            </button>
          ))}
          {!loading && filteredKits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>Nenhum kit encontrado</div>
          )}
        </div>
      </div>

      {/* 2. Details & Cost Breakdown */}
      <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedKitId ? (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <Package size={20} color="var(--accent-blue)" />
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedKitId}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{kits[selectedKitId].name}</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

              {/* MATERIAL SECTION */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Materiais</h4>
                {kits[selectedKitId].materials.map((m, idx) => {
                  const details = getMaterialDetails(m.sap);
                  return (
                    <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem' }}>{details.description || m.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SAP: {m.sap}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{m.qty} {details.unit}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>R$ {(m.qty * (details.price || 0)).toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.9rem', color: 'var(--accent-green)' }}>
                  Total Materiais: <strong>R$ {calculateTotal(kits[selectedKitId].materials).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* LABOR SECTION (Placeholder) */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mão de Obra</h4>
                {/* Logic: Check if any items are labor. For now, empty list */}
                <div style={{ padding: '15px', background: 'rgba(255, 193, 7, 0.05)', borderRadius: '8px', border: '1px dashed rgba(255, 193, 7, 0.3)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhum item de Mão de Obra vinculado a esta estrutura.</span>
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.9rem', color: 'var(--accent-warning)' }}>
                  Total Mão de Obra: <strong>R$ 0,00</strong>
                </div>
              </div>

              {/* Alert Example */}
              <div style={{ padding: '15px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'start' }}>
                <Info size={18} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  <strong>Atenção:</strong> Adicionar Mão de Obra sem Estrutura vinculada pode gerar inconsistências no relatório final.
                </div>
              </div>

            </div>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CUSTO TOTAL (MAT + MO)</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>
                  R$ {calculateTotal(kits[selectedKitId].materials).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '10px' }}>
            <Package size={48} style={{ opacity: 0.2 }} />
            <p>Selecione um Kit para ver o detalhamento.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default StructuresTab;
