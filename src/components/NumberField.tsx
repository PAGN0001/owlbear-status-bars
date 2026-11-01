type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export default function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <input
        id={id}
        className={error ? "field__input field__input--error" : "field__input"}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
