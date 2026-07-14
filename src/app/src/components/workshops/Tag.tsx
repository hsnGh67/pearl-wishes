interface TagProps {
  label: string;
  variant: 'level' | 'topic' | 'status';
}

export function Tag({ label, variant }: TagProps) {
  const getStyles = () => {
    switch (variant) {
      case 'level':
        return {
          background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
          color: '#3D3935',
          borderColor: '#DCD4CD'
        };
      case 'topic':
        return {
          background: 'linear-gradient(to right, #E9CFCA, #D0A096)',
          color: '#3D3935',
          borderColor: '#C89B8D'
        };
      case 'status':
        return {
          background: '#3D3935',
          color: '#FCEAE0',
          borderColor: '#3D3935'
        };
      default:
        return {
          background: '#FEFCFA',
          color: '#3D3935',
          borderColor: '#DCD4CD'
        };
    }
  };

  const styles = getStyles();

  return (
    <span
      className="inline-block px-4 py-1.5 text-xs tracking-wide border transition-all"
      style={{
        background: styles.background,
        color: styles.color,
        borderColor: styles.borderColor
      }}
    >
      {label}
    </span>
  );
}
