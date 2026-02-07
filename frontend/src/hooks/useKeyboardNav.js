import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for keyboard navigation and global shortcuts
 * @param {Object} actions - callback functions for specific actions { onEscape, onCopy, onCalculate }
 */
export function useKeyboardNav(actions = {}) {
  // --- Highlights for lists ---
  const [posteHighlight, setPosteHighlight] = useState(0);
  const [structureHighlight, setStructureHighlight] = useState(0);
  const [materialHighlight, setMaterialHighlight] = useState(0);
  const [mtHighlight, setMtHighlight] = useState(0);
  const [btHighlight, setBtHighlight] = useState(0);

  // --- Refs ---
  const posteInputRef = useRef(null);
  const estruturaInputRef = useRef(null);
  const materialInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // These refs are for search inputs
  const structureRef = useRef(null);
  const materialRef = useRef(null);

  // --- Focus Helpers ---
  const focusPoste = () => setTimeout(() => posteInputRef.current?.focus(), 50);
  const focusStructure = () => setTimeout(() => structureRef.current?.focus(), 50);
  const focusMaterial = () => setTimeout(() => materialRef.current?.focus(), 50);
  const focusQty = () => setTimeout(() => qtyInputRef.current?.focus(), 50);

  // --- Global Shortcuts Listener ---
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // ESC: Clear all or close modals
      if (e.key === 'Escape') {
        if (actions.onEscape) actions.onEscape();
      }

      // Ctrl+P: Copy summary
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (actions.onCopy) actions.onCopy();
      }

      // Ctrl+Enter: Calculate
      if (e.ctrlKey && e.key === 'Enter') {
        if (actions.onCalculate) actions.onCalculate();
      }

      // Ctrl+F: Focus Structure Search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        focusStructure();
      }

      // Ctrl+M: Focus Material Search
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        focusMaterial();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [actions]);

  return {
    // Refs
    posteInputRef,
    estruturaInputRef,
    materialInputRef,
    qtyInputRef,
    structureRef,
    materialRef,

    // Highlights State
    posteHighlight, setPosteHighlight,
    structureHighlight, setStructureHighlight,
    materialHighlight, setMaterialHighlight,
    mtHighlight, setMtHighlight,
    btHighlight, setBtHighlight,

    // Focus Actions
    focusPoste,
    focusStructure,
    focusMaterial,
    focusQty
  };
}
