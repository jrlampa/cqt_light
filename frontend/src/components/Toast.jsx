/**
 * Toast — Componente de notificação temporária em pt-BR.
 * Exibe avisos sobre sobreposição de normas ABNT/PRODIST.
 */

import { useEffect, useState } from 'react';

const TIPOS = {
  aviso: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    icon: '⚠️',
    textColor: 'text-amber-800',
  },
  erro: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: '❌',
    textColor: 'text-red-800',
  },
  sucesso: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: '✅',
    textColor: 'text-green-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon: 'ℹ️',
    textColor: 'text-blue-800',
  },
};

/**
 * Toast component.
 * @param {object} props
 * @param {string} props.mensagem - Mensagem a exibir
 * @param {'aviso'|'erro'|'sucesso'|'info'} [props.tipo='aviso'] - Tipo do toast
 * @param {number} [props.duracao=5000] - Duração em ms (0 = permanente)
 * @param {Function} [props.onFechar] - Callback ao fechar
 */
export default function Toast({ mensagem, tipo = 'aviso', duracao = 5000, onFechar }) {
  const [visivel, setVisivel] = useState(true);
  const estilo = TIPOS[tipo] || TIPOS.aviso;

  useEffect(() => {
    if (!duracao) return;
    const timer = setTimeout(() => {
      setVisivel(false);
      onFechar?.();
    }, duracao);
    return () => clearTimeout(timer);
  }, [duracao, onFechar]);

  if (!visivel) return null;

  const handleFechar = () => {
    setVisivel(false);
    onFechar?.();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-4 right-4 z-50 max-w-sm border-l-4 rounded-lg shadow-lg p-4
        ${estilo.bg} ${estilo.border} ${estilo.textColor}`}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-lg flex-shrink-0">{estilo.icon}</span>
        <p className="text-sm flex-1">{mensagem}</p>
        <button
          onClick={handleFechar}
          aria-label="Fechar notificação"
          className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}
