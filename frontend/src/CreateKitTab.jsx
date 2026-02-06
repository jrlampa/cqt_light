import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Search, Edit3, X, DollarSign } from 'lucide-react';

const CreateKitTab = () => {
  const [kitId, setKitId] = useState('');
  const [kitName, setKitName] = useState('');
  const [poleId, setPoleId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [poles, setPoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [existingKits, setExistingKits] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [kitMaterials, setKitMaterials] = useState([]);
  const [kitLabor, setKitLabor] = useState([]);

  const refreshData = () => {
    fetch('http://localhost:5000/api/poles').then(res => res.json()).then(setPoles);
    fetch('http://localhost:5000/api/catalog/materials').then(res => res.json()).then(setCatalog);
    fetch('http://localhost:5000/api/kits').then(res => res.json()).then(data => {
      setExistingKits(data);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const loadKit = (id) => {
    const k = existingKits[id];
    if (!k) return;
    setKitId(id);
    setKitName(k.name);
    setKitMaterials(k.materials.map(m => ({
      ...m,
      manual_price: m.manual_price || '' // Ensure field exists
    })));
    // Pole ID isn't strictly stored in kit structure currently, maybe needs addition?
    // Assuming backend data model doesn't strictly link pole_id in JSON yet, 
    // but the UI 'pole_id' state was for helpful suggestion. 
    // If we saved it, we should load it. The previous saveKit didn't effectively use it in backend structure?
    // Let's ensure save structure has it.
    setPoleId(k.pole_id || '');
    setKitLabor(k.labor || []);
    setIsEditing(true);
  };

  const clearForm = () => {
    setKitId('');
    setKitName('');
    setPoleId('');
    setKitMaterials([]);
    setKitLabor([]);
    setIsEditing(false);
  };

  const deleteKit = async () => {
    if (!confirm(`Tem certeza que deseja excluir o kit ${kitId}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/kits/custom/${kitId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert("Kit excluído!");
        clearForm();
        refreshData();
      } else {
        alert("Erro: " + data.error);
      }
    } catch (e) { alert("Erro de conexão: " + e); }
  };

  const addMaterial = (sap) => {
    if (kitMaterials.find(m => m.sap === sap)) return;
    const mat = catalog[sap];
    setKitMaterials([...kitMaterials, {
      sap: sap,
      description: mat.description,
      qty: 1,
      manual_price: ''
    }]);
  };

  const removeMaterial = (sap) => {
    setKitMaterials(kitMaterials.filter(m => m.sap !== sap));
  };

  const updateMatField = (sap, field, value) => {
    setKitMaterials(kitMaterials.map(m =>
      m.sap === sap ? { ...m, [field]: value } : m
    ));
  };

  const addLaborItem = () => {
    setKitLabor([...kitLabor, { description: "Serviço Extra", cost: 0 }]);
  };

  const updateLabor = (idx, field, value) => {
    const newLabor = [...kitLabor];
    // Keep as string to allow typing decimals; parse on save/calc
    newLabor[idx][field] = value;
    setKitLabor(newLabor);
  };

  const removeLabor = (idx) => {
    setKitLabor(kitLabor.filter((_, i) => i !== idx));
  };

  const saveKit = async () => {
    if (!kitId || !kitName) {
      alert("ID e Descrição são obrigatórios.");
      return;
    }

    const newKit = {
      id: kitId,
      name: kitName,
      pole_id: poleId,
      materials: kitMaterials.map(m => ({
        sap: m.sap,
        description: m.description,
        qty: parseFloat(m.qty) || 0,
        manual_price: m.manual_price ? parseFloat(m.manual_price) : null
      })),
      labor: kitLabor.map(l => ({
        description: l.description,
        cost: parseFloat(l.cost) || 0
      }))
    };
    // ... (rest of saveKit) ...

    try {
      const res = await fetch('http://localhost:5000/api/kits/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKit)
      });
      const data = await res.json();
      if (data.success) {
        alert("Kit salvo com sucesso!");
        refreshData();
      } else {
        alert("Erro ao salvar: " + data.error);
      }
    } catch (e) {
      alert("Erro de conexão: " + e.message);
    }
  };

  const filteredCatalog = Object.keys(catalog).filter(sap =>
    sap.includes(searchTerm) ||
    catalog[sap].description.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20);

  const [kitSearchTerm, setKitSearchTerm] = useState('');
  const [showKitDropdown, setShowKitDropdown] = useState(false);
  const [showPoleDropdown, setShowPoleDropdown] = useState(false);

  // Keyboard Navigation State
  const [kitSelectedIndex, setKitSelectedIndex] = useState(0);
  const [poleSelectedIndex, setPoleSelectedIndex] = useState(0);

  // Filter kits for the "Load Kit" dropdown
  const filteredKitsForLoad = Object.keys(existingKits).filter(k =>
    k.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    (existingKits[k].name && existingKits[k].name.toLowerCase().includes(kitSearchTerm.toLowerCase()))
  );

  // Filter poles
  const filteredPoles = poles.filter(p =>
    p.id.toLowerCase().includes(poleId.toLowerCase()) ||
    p.name.toLowerCase().includes(poleId.toLowerCase())
  );

  // Keyboard Handlers
  const handleKitKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKitSelectedIndex(prev => Math.min(prev + 1, filteredKitsForLoad.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKitSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredKitsForLoad[kitSelectedIndex]) {
        loadKit(filteredKitsForLoad[kitSelectedIndex]);
        setKitSearchTerm('');
        setShowKitDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowKitDropdown(false);
    }
  };

  const handlePoleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPoleSelectedIndex(prev => Math.min(prev + 1, filteredPoles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPoleSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPoles[poleSelectedIndex]) {
        setPoleId(filteredPoles[poleSelectedIndex].id);
        setShowPoleDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowPoleDropdown(false);
    }
  };

  // Reset index when search changes - Moved to onChange handlers to avoid useEffect cascade


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', height: '100%', paddingBottom: '20px' }}>

      {/* LEFT: FORM Form Builder */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isEditing ? 'Editar Kit' : 'Criar Novo Kit'}</h3>

          {/* Custom Searchable Dropdown for Loading Kits */}
          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                className="input-field"
                placeholder="Buscar Kit Existente..."
                value={kitSearchTerm}
                onChange={(e) => {
                  setKitSearchTerm(e.target.value);
                  setShowKitDropdown(true);
                  setKitSelectedIndex(0); // Reset index on type
                }}
                onKeyDown={handleKitKeyDown}
                onFocus={() => setShowKitDropdown(true)}
                style={{ width: '100%', paddingRight: '30px' }}
              />
              <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />

              {showKitDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', zIndex: 100,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)', marginTop: '5px'
                }}>
                  {filteredKitsForLoad.length === 0 ? (
                    <div style={{ padding: '10px', color: '#888', fontSize: '0.8rem' }}>Nenhum kit encontrado.</div>
                  ) : (
                    filteredKitsForLoad.map((k, idx) => (
                      <div
                        key={k}
                        onClick={() => {
                          loadKit(k);
                          setKitSearchTerm('');
                          setShowKitDropdown(false);
                        }}
                        className="dropdown-item"
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          background: idx === kitSelectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent', // Highlight selected
                          display: 'flex', flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; setKitSelectedIndex(idx); }}
                        onMouseLeave={(e) => { if (idx !== kitSelectedIndex) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{k}</span>
                        <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{existingKits[k].name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Overlay to close dropdown when clicking outside */}
            {showKitDropdown && (
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                onClick={() => setShowKitDropdown(false)}
              />
            )}

            <button className="btn-secondary" onClick={clearForm} title="Limpar" style={{ zIndex: 95 }}>
              <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Código (ID)</label>
            <input
              className="input-field"
              value={kitId}
              onChange={e => setKitId(e.target.value)}
              disabled={isEditing}
              placeholder="Ex: KIT-01"
            />
          </div>

          <div className="input-group" style={{ flex: 2 }}>
            <label>Descrição</label>
            <input
              className="input-field"
              value={kitName}
              onChange={e => setKitName(e.target.value)}
              placeholder="Descrição do Kit"
            />
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '10px', position: 'relative' }}>
          <label>Poste Associado</label>
          <div style={{ position: 'relative' }}>
            <input
              className="input-field"
              placeholder="Selecione ou busque um poste..."
              value={poleId}
              onChange={e => {
                setPoleId(e.target.value);
                setShowPoleDropdown(true);
                setPoleSelectedIndex(0); // Reset index on type
              }}
              onKeyDown={handlePoleKeyDown}
              onFocus={() => setShowPoleDropdown(true)}
              style={{ width: '100%', paddingRight: '30px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />

            {showPoleDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', zIndex: 100,
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', marginTop: '5px'
              }}>
                {filteredPoles.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => { setPoleId(p.id); setShowPoleDropdown(false); }}
                    className="dropdown-item"
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      background: idx === poleSelectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent', // Highlight selected
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; setPoleSelectedIndex(idx); }}
                    onMouseLeave={(e) => { if (idx !== poleSelectedIndex) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{p.id}</span>
                    <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Overlay to close */}
          {showPoleDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowPoleDropdown(false)} />}
        </div>

        {/* MATERIALS LIST */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-green)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} /> LISTA DE MATERIAIS
          </h4>

          {kitMaterials.length === 0 ? (
            <div style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
              Adicione materiais do catálogo ao lado.
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kitMaterials.map(m => (
              <div key={m.sap} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{m.sap}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.description}</div>
                  {catalog[m.sap]?.price > 0 && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Ref: R$ {catalog[m.sap].price.toFixed(2)}</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase' }}>Qtd</label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '70px', padding: '8px', textAlign: 'center' }}
                    value={m.qty}
                    onChange={e => updateMatField(m.sap, 'qty', e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase' }}>R$ (Manual)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Auto"
                    style={{ width: '90px', padding: '8px', textAlign: 'center', borderColor: m.manual_price ? 'var(--accent-green)' : '' }}
                    value={m.manual_price}
                    onChange={e => updateMatField(m.sap, 'manual_price', e.target.value)}
                  />
                </div>

                <button onClick={() => removeMaterial(m.sap)} className="btn-icon-danger" title="Remover" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '8px' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LABOR LIST */}
        <div style={{ flex: 0.8, overflowY: 'auto', background: 'rgba(255, 193, 7, 0.05)', borderRadius: '10px', padding: '15px', border: '1px dashed rgba(255, 193, 7, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-warning)', margin: 0 }}>MÃO DE OBRA (Adicional)</h4>
            <button className="btn-secondary" onClick={addLaborItem} style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}>
              + Adicionar Serviço
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kitLabor.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="input-field"
                  style={{ flex: 1 }}
                  value={item.description}
                  onChange={e => updateLabor(idx, 'description', e.target.value)}
                  placeholder="Descrição do serviço"
                />
                <div style={{ position: 'relative', width: '100px' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.8rem' }}>R$</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '30px' }}
                    value={item.cost}
                    onChange={e => updateLabor(idx, 'cost', e.target.value)}
                  />
                </div>
                <button onClick={() => removeLabor(idx)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><X size={18} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isEditing && (
            <button className="btn-secondary" onClick={deleteKit} style={{ borderColor: '#ff4444', color: '#ff4444' }}>
              <Trash2 size={18} /> EXCLUIR
            </button>
          )}
          <button className="btn-primary" onClick={saveKit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Save size={18} /> {isEditing ? 'ATUALIZAR' : 'SALVAR'} KIT
          </button>
        </div>
      </div>

      {/* RIGHT: Material Search */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h4>Catálogo de Materiais</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <Search size={20} style={{ color: '#aaa' }} />
          <input
            className="input-field"
            placeholder="Buscar SAP ou Descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && filteredCatalog.length > 0) {
                addMaterial(filteredCatalog[0]); // Add top result logic
                setSearchTerm(''); // Optional: clear search after adding
              }
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredCatalog.map((sap, idx) => (
            <div key={sap} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx === 0 && searchTerm ? 'rgba(0, 255, 100, 0.05)' : 'transparent' }}>
              <div>
                <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.9rem' }}>{sap}</div>
                <div style={{ fontSize: '0.8rem' }}>{catalog[sap].description}</div>
              </div>
              <button
                onClick={() => addMaterial(sap)}
                style={{
                  background: 'rgba(0,255,100,0.1)',
                  border: '1px solid var(--accent-green)',
                  color: 'var(--accent-green)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CreateKitTab;
