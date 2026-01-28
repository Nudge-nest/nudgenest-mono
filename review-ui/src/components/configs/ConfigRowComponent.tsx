import React, { useState, useCallback } from 'react';

// Types for different field configurations
interface ConfigField {
    key: string;
    value: string | number | boolean;
    description: string;
    type?:
        | 'text'
        | 'textarea'
        | 'number'
        | 'email'
        | 'password'
        | 'url'
        | 'checkbox'
        | 'select'
        | 'boolean'
        | 'image'
        | 'json'; //TODO: refactor this type at some point
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: Array<{ value: string; label: string }>;
}

interface ConfigRowProps {
    field: ConfigField;
    onFieldChange: (key: string, value: string | number | boolean, objPropName: string) => void;
    className?: string;
    objPropName: string;
}

const ConfigRowComponent: React.FC<ConfigRowProps> = ({ field, onFieldChange, className = '', objPropName }) => {
    const [localValue, setLocalValue] = useState(field.value);

    const handleValueChange = useCallback(
        (value: string | number | boolean) => {
            setLocalValue(value);
            onFieldChange(field.key, value, objPropName);
        },
        [field.key, onFieldChange, objPropName]
    );

    const formatLabel = (key: string) => {
        // Convert camelCase or snake_case to readable format
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    };

    const inputId = `config-${field.key}`;
    const descriptionId = `${inputId}-description`;

    const renderInput = () => {
        const baseClasses =
            'w-full px-3 py-2 bg-[color:var(--color-bg)] border border-gray-600 rounded-md text-[color:var(--color-text)] placeholder-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
        const disabledClasses = field.disabled ? 'opacity-50 cursor-not-allowed' : '';
        const inputClasses = `${baseClasses} ${disabledClasses}`;

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        id={inputId}
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        rows={3}
                        className={inputClasses}
                        data-testid={`textarea-${field.key}`}
                    />
                );

            case 'number':
                return (
                    <input
                        id={inputId}
                        type="number"
                        value={localValue as number}
                        onChange={(e) => handleValueChange(Number(e.target.value))}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`number-${field.key}`}
                    />
                );

            case 'email':
                return (
                    <input
                        id={inputId}
                        type="email"
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`email-${field.key}`}
                    />
                );

            case 'password':
                return (
                    <input
                        id={inputId}
                        type="password"
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`password-${field.key}`}
                    />
                );

            case 'url':
                return (
                    <input
                        id={inputId}
                        type="url"
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`url-${field.key}`}
                    />
                );

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2" role="group">
                        <input
                            id={inputId}
                            type="checkbox"
                            checked={localValue as boolean}
                            onChange={(e) => handleValueChange(e.target.checked)}
                            disabled={field.disabled}
                            required={field.required}
                            aria-describedby={descriptionId}
                            aria-required={field.required}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                            data-testid={`checkbox-${field.key}`}
                        />
                        <span
                            className="text-sm text-gray-300"
                            data-testid={`checkbox-label-${field.key}`}
                        >
                            {(localValue as boolean) ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                );

            case 'select':
                return (
                    <select
                        id={inputId}
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`select-${field.key}`}
                    >
                        {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            default: // text
                return (
                    <input
                        id={inputId}
                        type="text"
                        value={localValue as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        required={field.required}
                        aria-describedby={descriptionId}
                        aria-required={field.required}
                        className={inputClasses}
                        data-testid={`text-${field.key}`}
                    />
                );
        }
    };

    return (
        <article
            className={`grid grid-cols-3 gap-6 py-2 px-4 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-bg)] hover:bg-[color:var(--color-lighter)] transition-colors ${className}`}
            data-testid={`config-row-${field.key}`}
        >
            {/* Label Column */}
            <div className="flex items-center">
                <label
                    htmlFor={inputId}
                    className="text-[color:var(--color-text)] font-medium text-sm"
                    data-testid={`label-${field.key}`}
                >
                    {formatLabel(field.key)}
                    {field.required && (
                        <span
                            className="text-[color:var(--color-error)] ml-1"
                            aria-label="required field"
                        >
                            *
                        </span>
                    )}
                </label>
            </div>

            {/* Input Column */}
            <div
                className="flex items-center"
                data-testid={`input-container-${field.key}`}
            >
                {renderInput()}
            </div>

            {/* Description Column */}
            <div className="flex items-center">
                <p
                    id={descriptionId}
                    className="text-[color:var(--color-text)] text-sm leading-relaxed"
                    data-testid={`description-${field.key}`}
                >
                    {field.description}
                </p>
            </div>
        </article>
    );
};

export default ConfigRowComponent;