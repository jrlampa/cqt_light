import React from 'react';

const MaterialTable = ({ materials, onEdit }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/20 shadow-xl backdrop-blur-md bg-white/30">
      <table className="w-full text-left text-sm text-gray-200">
        <thead className="bg-white/10 text-xs uppercase text-white font-semibold">
          <tr>
            <th className="px-6 py-4">SAP Code</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4">Unit</th>
            <th className="px-6 py-4 text-center">Quantity</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {materials.map((mat, index) => (
            <tr key={index} className="hover:bg-white/10 transition-colors">
              <td className="px-6 py-4 font-medium text-white">{mat.sap_code}</td>
              <td className="px-6 py-4 text-gray-100">{mat.description}</td>
              <td className="px-6 py-4 text-gray-300">{mat.unit}</td>
              <td className="px-6 py-4 text-center text-gray-100">{mat.quantity}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit && onEdit(mat)}
                  className="text-cyan-300 hover:text-cyan-100 transition-colors font-medium hover:underline"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {materials.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                No materials found for this kit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MaterialTable;
