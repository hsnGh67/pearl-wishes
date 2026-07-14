interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  className?: string;
}

export function WorkshopButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '' 
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500';
      case 'secondary':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50';
      case 'tertiary':
        return 'text-gray-700 hover:text-gray-900 underline disabled:opacity-50';
      default:
        return 'bg-gray-800 text-white hover:bg-gray-900';
    }
  };

  const baseStyles = 'h-11 px-6 transition-colors disabled:cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
    >
      {children}
    </button>
  );
}
