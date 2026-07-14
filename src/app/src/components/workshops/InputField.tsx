import { AlertCircle } from 'lucide-react';

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: React.ReactNode;
  type?: 'text' | 'email' | 'tel' | 'password';
  required?: boolean;
}

export function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
  icon,
  type = 'text',
  required = false,
}: InputFieldProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-gray-700 mb-2">
          {label}
          {required && <span className="text-gray-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-11 px-4 border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors ${
            icon ? 'pl-12' : 'pl-4'
          } ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle size={20} />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
