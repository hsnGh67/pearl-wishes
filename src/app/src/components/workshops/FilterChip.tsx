interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function FilterChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-4 text-sm border transition-colors ${
        selected
          ? 'text-white'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
      style={selected ? { backgroundColor: '#3D3935', borderColor: '#3D3935' } : {}}
    >
      {label}
    </button>
  );
}
