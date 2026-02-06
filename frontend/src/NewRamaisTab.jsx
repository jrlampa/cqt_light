import React, { useState, useEffect } from 'react';
import { Plus, Minus, User, Save, MapPin, Star } from 'lucide-react';

const ConsumerButton = ({ ct, onClick, isPopular }) => (
  <button
    onClick={onClick}
    style={{
      padding: '20px 10px',
      borderRadius: '15px',
      border: isPopular ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
      background: isPopular ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255,255,255,0.03)',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    {isPopular && <Star size={10} style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--accent-blue)' }} fill="currentColor" />}
    <Plus size={24} color="var(--accent-green)" />
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{ct.name}</span>
    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ct.default_kva} kVA</span>
  </button>
);

const NewRamaisTab = ({ segments }) => {
  const [consumerTypes, setConsumerTypes] = useState([]);
  const [selectedPole, setSelectedPole] = useState(null);
  const [poleConsumers, setPoleConsumers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter segments that are probably poles (e.g., have sequential names or are just segments)
  const poles = segments;

  const fetchConsumerTypes = () => {
    fetch('http://localhost:5000/api/consumer-types')
      .then(res => res.json())
      .then(data => setConsumerTypes(data));
  };

  useEffect(() => {
    fetchConsumerTypes();
  }, []);

  useEffect(() => {
    if (selectedPole) {
      setLoading(true);
      fetch(`http://localhost:5000/api/poles/${encodeURIComponent(selectedPole)}/consumers`)
        .then(res => res.json())
        .then(data => {
          setPoleConsumers(data);
          setLoading(false);
        });
    }
  }, [selectedPole]);

  const updateQuantity = (typeId, delta) => {
    setPoleConsumers(prev => {
      const existing = prev.find(p => p.id === typeId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(p => p.id !== typeId);
        return prev.map(p => p.id === typeId ? { ...p, quantity: newQty } : p);
      } else if (delta > 0) {
        const type = consumerTypes.find(t => t.id === typeId);
        return [...prev, { id: type.id, name: type.name, quantity: 1, default_kva: type.default_kva }];
      }
      return prev;
    });
  };

  const saveChanges = async () => {
    if (!selectedPole) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/poles/${encodeURIComponent(selectedPole)}/consumers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumers: poleConsumers })
      });
      fetchConsumerTypes(); // Refresh popularity list
      alert('Salvo com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalKva = poleConsumers.reduce((acc, curr) => acc + (curr.quantity * curr.default_kva), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 300px', gap: '20px', height: '100%', overflow: 'hidden' }}>

      {/* 1. Pole Selector (Big Buttons) */}
      <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>ESCOLHA O POSTE</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {poles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPole(p.name)}
              style={{
                padding: '20px 15px',
                borderRadius: '15px',
                border: '1px solid',
                borderColor: selectedPole === p.name ? 'var(--accent-blue)' : 'var(--glass-border)',
                background: selectedPole === p.name ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              <MapPin size={20} color={selectedPole === p.name ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: selectedPole === p.name ? 'bold' : 'normal' }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Consumer Type Grid (Quick Add) */}
      <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>ADICIONAR CONSUMIDORES</h3>
        {!selectedPole && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Selecione um poste primeiro
          </div>
        )}
        {selectedPole && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Highly Used Section */}
            {consumerTypes.filter(ct => ct.usage_count > 0).length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Mais Usados</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                  {consumerTypes.filter(ct => ct.usage_count > 0).map(ct => (
                    <ConsumerButton key={ct.id} ct={ct} onClick={() => updateQuantity(ct.id, 1)} isPopular />
                  ))}
                </div>
              </div>
            )}

            {/* Others Section */}
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>Todos os Tipos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                {consumerTypes.map(ct => (
                  <ConsumerButton key={ct.id} ct={ct} onClick={() => updateQuantity(ct.id, 1)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Summary & Actions */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>RESUMO DO POSTE</h3>

        {selectedPole ? (
          <>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>{selectedPole}</div>
            <div style={{ color: 'var(--accent-blue)', fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>
              {totalKva.toFixed(2)} <small style={{ fontSize: '0.8rem' }}>kVA</small>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {poleConsumers.map(pc => (
                <div key={pc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem' }}>{pc.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{pc.quantity} un × {pc.default_kva} kVA</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => updateQuantity(pc.id, -1)}
                      style={{ padding: '5px', borderRadius: '5px', border: 'none', background: 'rgba(255,100,100,0.1)', color: 'white', cursor: 'pointer' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{pc.quantity}</span>
                    <button
                      onClick={() => updateQuantity(pc.id, 1)}
                      style={{ padding: '5px', borderRadius: '5px', border: 'none', background: 'rgba(0,255,0,0.1)', color: 'white', cursor: 'pointer' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={saveChanges}
              disabled={loading}
              style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Save size={18} /> SALVAR
            </button>
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
            Aguardando seleção...
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRamaisTab;
