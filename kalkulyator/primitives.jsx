// Калькулятор ЗП — UI primitives
// Building blocks shared by all screens.

const { useState, useEffect, useRef } = React;

/* ---------- Icon (Lucide via CDN, tinted to cream) ---------- */
function Icon({ name, size = 16, color }) {
  return (
    <img
      src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`}
      width={size}
      height={size}
      alt=""
      style={{
        filter: color
          ? undefined
          : 'invert(95%) sepia(8%) saturate(40%) hue-rotate(340deg) brightness(105%)',
        opacity: 0.85,
        flexShrink: 0,
      }}
    />
  );
}

/* ---------- Eyebrow / Micro ---------- */
function Eyebrow({ tone = 'mute', children }) {
  const color = tone === 'warm' ? 'var(--orange-300)' : 'var(--text-3)';
  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      fontSize: 11, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color,
    }}>{children}</div>
  );
}
function Micro({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      fontSize: 10, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--text-3)',
      ...style,
    }}>{children}</div>
  );
}

/* ---------- Button ---------- */
function Button({ variant = 'primary', size = 'md', icon, children, ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...rest}>
      {icon ? <span className="btn-icon"><Icon name={icon} size={16} /></span> : null}
      <span>{children}</span>
    </button>
  );
}

/* ---------- Field + Input ---------- */
function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span> : null}
    </label>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? (value === '' || value == null ? '' : String(value))
    : (value === '' || value == null ? '' : fmtMoney(value));
  return (
    <input
      className="input"
      value={display}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const raw = e.target.value.replace(/[^\d.,-]/g, '').replace(',', '.');
        onChange(raw === '' ? '' : Number(raw));
      }}
    />
  );
}

function TextInput({ value, onChange, placeholder, icon, ...rest }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', pointerEvents: 'none', opacity: 0.6,
        }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        className="input"
        style={{ paddingLeft: icon ? 38 : 14 }}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}

/* ---------- Chip (pill) ---------- */
function Chip({ tone, dot, children }) {
  const cls = `chip${tone ? ' chip-' + tone : ''}`;
  return (
    <span className={cls}>
      {dot && <span className="chip-dot" />}
      {children}
    </span>
  );
}

/* ---------- Money (display) ---------- */
function Money({ value, size = 'md', tone = 'cream' }) {
  const colors = {
    cream:   'var(--cream)',
    orange:  'var(--orange-300)',
    success: 'var(--success)',
    error:   'var(--error)',
    mute:    'var(--text-3)',
  };
  const sizes = {
    sm:   { fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 500 },
    md:   { fontSize: 18, fontFamily: 'var(--font-sans)', fontWeight: 500 },
    lg:   { fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.012em' },
    xl:   { fontSize: 48, fontFamily: 'var(--font-display)', fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1 },
  };
  return (
    <span style={{
      color: colors[tone],
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      ...sizes[size],
    }}>
      {fmtMoney(value)}
    </span>
  );
}

/* ---------- GlassCard ---------- */
function GlassCard({ elevated = false, children, style, className = '' }) {
  return (
    <div className={`glass ${elevated ? 'glass-elevated' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ---------- Orb (brand mark, CSS-rendered) ---------- */
function Orb({ size = 180 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #F4C9CC 0%, #E0463B 14%, #C1121F 42%, #4A0A10 78%, #060203 100%)',
      boxShadow: `0 0 ${size * 0.4}px rgba(193,18,31,.38), 0 0 ${size * 0.85}px rgba(102,155,188,.2)`,
      position: 'relative',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: '18%', left: '24%',
        width: '34%', height: '18%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 70%)',
        transform: 'rotate(-15deg)',
      }} />
    </div>
  );
}

/* ---------- Plural ---------- */
function plural(n, forms) {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

Object.assign(window, {
  Icon, Eyebrow, Micro, Button, Field, MoneyInput, TextInput,
  Chip, Money, GlassCard, Orb, plural,
});
