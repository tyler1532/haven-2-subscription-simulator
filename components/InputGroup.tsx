
import React from 'react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  description?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, min, max, step = 1, unit, description }) => {
  return (
    <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 text-right px-2 py-1 text-sm border rounded bg-slate-50 font-mono"
          />
          <span className="text-xs text-slate-500 font-medium">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      {description && <p className="text-[10px] text-slate-400 mt-1">{description}</p>}
    </div>
  );
};

export default InputGroup;
