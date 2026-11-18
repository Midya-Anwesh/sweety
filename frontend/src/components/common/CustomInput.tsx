import React, { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

export type SelectOptions = {
  value: string;
  label: string;
}[];

export interface RadioOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  sub?: string;
  testId?: string;
}

export type CustomInputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'select'
  | 'color'
  | 'switch'
  | 'image'
  | 'textarea'
  | 'file'
  | 'radio';

export interface ICustomInputTypeConfig {
  inptType?: CustomInputType;
}

export interface CustomInputProps<T extends FieldValues = FieldValues> {
  control?: Control<T>;
  name?: Path<T>;
  fieldName: string;
  inptType?: CustomInputType;
  placeholder?: string;
  className?: string;
  selectOptions?: SelectOptions;
  radioOptions?: RadioOption[];
  FieldBadgeIcon?: LucideIcon;
  fieldBadgeAction?: () => void;
  withLabel?: boolean;
  disabled?: boolean;
  imgAlt?: string;
  imgAltCls?: string;
  imgAltAlign?: 'center' | 'end';
  orientation?: 'verticle' | 'horizontal';
  leftNode?: React.ReactNode;
  label?: string;
  hint?: string;
  hintTestId?: string;
  id?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  testId?: string;
  valueAsNumber?: boolean;
}

function formatLabel(fieldName: string) {
  return fieldName
    .replace(/(?<![A-Z])([A-Z][a-z])/g, ' $1')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function CustomInput<T extends FieldValues = FieldValues>({
  control,
  name,
  fieldName,
  inptType = 'text',
  placeholder,
  className,
  selectOptions,
  radioOptions,
  FieldBadgeIcon,
  fieldBadgeAction,
  imgAlt,
  imgAltCls,
  withLabel = true,
  disabled = false,
  orientation,
  leftNode,
  label,
  hint,
  hintTestId,
  id,
  autoComplete,
  autoFocus,
  maxLength,
  min,
  max,
  step,
  inputMode,
  testId,
  valueAsNumber,
}: CustomInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = inptType === 'password' || name === 'password';
  const labelText = label ?? formatLabel(fieldName);
  const inputId = id ?? fieldName;
  const inputName = (name ?? (fieldName as Path<T>)) as Path<T>;

  return (
    <div
      className={`field input-non-oriented ${['verticle', undefined].includes(orientation) ? 'flex-col' : 'text-nowrap items-center! justify-center!'}`}
    >
      {withLabel && (
        <label htmlFor={inputId} className="field-label input-label">
          {labelText}{' '}
          {FieldBadgeIcon && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fieldBadgeAction?.();
              }}
            >
              <FieldBadgeIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      )}
      <div className="w-full flex gap-2">
        {leftNode}
        <Controller
          name={inputName}
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const fieldValue = value ?? '';

            const renderInputContent = () => {
              switch (inptType) {
                case 'select':
                  return (
                    <select
                      disabled={disabled}
                      id={inputId}
                      name={fieldName}
                      value={fieldValue}
                      onChange={(event) => onChange(event.target.value)}
                      className={`input input-field select-input-style ${error ? 'input-error' : 'input-valid'} ${className ?? ''}`}
                      data-testid={testId}
                    >
                      {selectOptions?.map((selectOption) => (
                        <option value={selectOption.value} key={selectOption.value}>
                          {selectOption.label}
                        </option>
                      ))}
                    </select>
                  );

                case 'color':
                  return (
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        disabled={disabled}
                        id={inputId}
                        name={fieldName}
                        value={fieldValue}
                        onChange={onChange}
                        className={className ?? `rounded-color-input ${error ? 'input-error' : 'input-valid'}`}
                        data-testid={testId}
                      />
                    </div>
                  );

                case 'switch':
                  return (
                    <input
                      type="checkbox"
                      role="switch"
                      disabled={disabled}
                      id={inputId}
                      name={fieldName}
                      checked={Boolean(value)}
                      onChange={(e) => onChange(e.target.checked)}
                      className={`switch-input ${className ?? ''}`}
                      data-testid={testId}
                    />
                  );

                case 'image':
                  return (
                    <div className="image-input-container">
                      <input
                        type="file"
                        accept="image/*"
                        id={inputId}
                        name={fieldName}
                        disabled={disabled}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file ?? null);
                        }}
                        className="hidden"
                        data-testid={testId}
                      />
                      <label htmlFor={inputId} className={`cursor-pointer ${imgAltCls ?? ''}`}>
                        {(value as unknown) instanceof File ? (
                          <img
                            src={URL.createObjectURL(value as unknown as File)}
                            alt={imgAlt ?? 'Uploaded preview'}
                            className="h-21 w-21 object-contain"
                          />
                        ) : (
                          <span>{imgAlt ?? 'Upload image'}</span>
                        )}
                      </label>
                    </div>
                  );

                case 'textarea':
                  return (
                    <textarea
                      disabled={disabled}
                      id={inputId}
                      name={fieldName}
                      placeholder={placeholder}
                      value={fieldValue}
                      onChange={onChange}
                      aria-invalid={!!error || undefined}
                      className={`input input-field min-h-20 overflow-y-auto ${className ?? ''} ${error ? 'input-error' : ''}`}
                      data-testid={testId}
                    />
                  );

                case 'file':
                  return (
                    <>
                      <label
                        htmlFor={inputId}
                        className={`flex h-11 w-full cursor-pointer items-center overflow-hidden rounded-[7px] border border-input-field-border bg-white text-sm ${
                          disabled ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      >
                        <span className="flex h-full items-center border-r border-input-field-border bg-table-head px-3 text-black-text">
                          Choose File
                        </span>
                        <span className="px-3 text-muted">
                          {Array.isArray(value) && value.length > 0
                            ? `${value.length} ${value.length === 1 ? 'file' : 'files'} chosen`
                            : 'No file chosen'}
                        </span>
                      </label>
                      <input
                        type="file"
                        id={inputId}
                        name={fieldName}
                        disabled={disabled}
                        multiple
                        className="hidden"
                        data-testid={testId}
                        onChange={(event) => {
                          const fileList = event.target.files;
                          const prev = (value ? [...value] : []) as File[];
                          const files = Array.from(fileList ?? []);
                          const uniqueFiles = files.filter((file) =>
                            prev.every((prevFile) => prevFile.name !== file.name),
                          );
                          onChange(prev.concat(uniqueFiles));
                        }}
                      />
                    </>
                  );

                case 'radio':
                  return (
                    <div className={className ?? 'role-picker'} role="radiogroup">
                      {radioOptions?.map((opt) => {
                        const Icon = opt.icon;
                        const isChecked = fieldValue === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`${className?.includes('slot-picker') ? 'slot-option' : 'role-option'} ${isChecked ? 'is-on' : ''} ${opt.disabled ? 'is-taken' : ''}`}
                          >
                            <input
                              type="radio"
                              name={fieldName}
                              value={opt.value}
                              disabled={disabled || opt.disabled}
                              checked={isChecked}
                              onChange={() => onChange(opt.value)}
                              data-testid={opt.testId}
                            />
                            {Icon && <Icon size={18} aria-hidden />}
                            <span>{opt.label}</span>
                            {opt.sub && <small>{opt.sub}</small>}
                          </label>
                        );
                      })}
                    </div>
                  );

                case 'password':
                  return (
                    <div className="pw-wrap relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={disabled}
                        id={inputId}
                        name={fieldName}
                        placeholder={placeholder ?? '......'}
                        value={fieldValue}
                        onChange={onChange}
                        autoComplete={autoComplete}
                        autoFocus={autoFocus}
                        maxLength={maxLength}
                        aria-invalid={!!error || undefined}
                        className={`input input-field ${error ? 'input-error' : 'input-valid'} ${className ?? ''}`}
                        data-testid={testId}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="pw-toggle absolute inset-y-0 right-3 flex items-center text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                        data-testid="button-toggle-password"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} color="gray" /> : <Eye size={17} color="gray" />}
                      </button>
                    </div>
                  );

                case 'text':
                case 'email':
                case 'number':
                case 'date':
                default: {
                  const inputType = isPasswordField
                    ? (showPassword ? 'text' : 'password')
                    : (inptType ?? 'text');

                  return (
                    <div className={isPasswordField ? 'pw-wrap relative' : 'relative'}>
                      <input
                        type={inputType}
                        disabled={disabled}
                        id={inputId}
                        name={fieldName}
                        placeholder={placeholder ?? (isPasswordField ? '......' : undefined)}
                        value={fieldValue}
                        onChange={(e) => {
                          if (inptType === 'number' || valueAsNumber) {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            onChange(val);
                          } else {
                            onChange(e.target.value);
                          }
                        }}
                        autoComplete={autoComplete}
                        autoFocus={autoFocus}
                        maxLength={maxLength}
                        min={min}
                        max={max}
                        step={step}
                        inputMode={inputMode}
                        aria-invalid={!!error || undefined}
                        className={`input input-field ${error ? 'input-error' : 'input-valid'} ${className ?? ''}`}
                        data-testid={testId}
                      />
                      {isPasswordField && (
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="pw-toggle absolute inset-y-0 right-3 flex items-center text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                          data-testid="button-toggle-password"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={17} color="gray" /> : <Eye size={17} color="gray" />}
                        </button>
                      )}
                    </div>
                  );
                }
              }
            };

            return (
              <div className="w-full space-y-2">
                {renderInputContent()}
                {hint && !error && (
                  <p className="field-hint" id={`${inputId}-hint`} data-testid={hintTestId}>
                    {hint}
                  </p>
                )}
                {error && (
                  <p
                    className={`field-error text-sm text-rose-600 ${inptType === 'image' ? 'flex justify-center' : ''}`}
                    role="alert"
                    id={`${inputId}-error`}
                    data-testid={`error-${inputId}`}
                  >
                    {error.message}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
