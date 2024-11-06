import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Label,
  NumberInput,
  Select,
  TextInput,
  Check,
} from '../../popup/Popup';
import { Highlight } from './Highlight';
import { CHATGPT_WS_OPTIONS } from '../../constants';

function camelCaseToTitle(camelCase: string) {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

export interface OptionsFormProps {
  options: Partial<CHATGPT_WS_OPTIONS>;
  currentValues: { [key: string]: any };
  onChange: (newValues: { [key: string]: any }) => void;
  searchTerms?: string[];
}

export const OptionsForm: React.FC<OptionsFormProps> = React.memo(
  ({ options, currentValues, onChange, searchTerms }) => {
    const [localValues, setLocalValues] = useState(currentValues);
    const [setShowDescription, showDescription] = useState('font');

    useEffect(() => {
      setLocalValues(currentValues);
    }, [currentValues]);

    const handleInputChange = useCallback(
      (optionId: string, value: any) => {
        setLocalValues((prevValues) => {
          const newValues = { ...prevValues, [optionId]: value };
          onChange(newValues);
          return newValues;
        });
      },
      [onChange],
    );

    const renderOption = useCallback(
      (option: any, key: string) => {
        if (!option || typeof option !== 'object') {
          return null;
        }

        const { name, defaultValue, schema, description } = option;
        const currentValue = localValues[key] ?? defaultValue;

        const optTitle = (
          <Highlight
            text={camelCaseToTitle(name ?? key)}
            searchTerms={searchTerms ?? []}
          />
        );

        const optionType = schema?.type || typeof defaultValue;

        if (
          option.hasOwnProperty('defaultValue') &&
          typeof defaultValue === 'boolean'
        ) {
          return (
            <div key={key} className="ws-py-[3px]">
              <Label htmlFor={key}>
                <Check
                  checked={!!currentValue}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  id={key}
                  aria-labelledby={`${key}-label`}
                />
                <span>{optTitle}</span>
              </Label>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
          );
        }

        if (!schema || typeof schema !== 'object') {
          return null;
        }

        switch (optionType) {
          case 'boolean':
            return (
              <div key={key} className="ws-py-[3px]">
                <Label htmlFor={key}>
                  <Check
                    checked={!!currentValue}
                    onChange={(e) => handleInputChange(key, e.target.checked)}
                    id={key}
                    aria-labelledby={`${key}-label`}
                  />
                  <span>{optTitle}</span>
                </Label>
                {schema.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {schema.description}
                  </p>
                )}
              </div>
            );
          case 'number':
          case 'integer':
            return (
              <div key={key} className="ws-py-[3px]">
                <Label htmlFor={key} className="ws-text-sm ws-font-semibold">
                  {optTitle}
                </Label>
                <NumberInput
                  value={currentValue}
                  onChange={(e) =>
                    handleInputChange(key, parseFloat(e.target.value))
                  }
                  id={key}
                  min={schema.minimum}
                  max={schema.maximum}
                  aria-labelledby={`${key}-label`}
                />
                {schema.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {schema.description}
                  </p>
                )}
              </div>
            );
          case 'string':
            if (Array.isArray(schema.enum)) {
              return (
                <div key={key} className="ws-py-[3px]">
                  <Label htmlFor={key} className="ws-text-sm ws-font-semibold">
                    {optTitle}
                  </Label>
                  <Select
                    value={currentValue}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    id={key}
                    aria-labelledby={`${key}-label`}
                  >
                    {schema.enum.map((value: string) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                  {schema.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {schema.description}
                    </p>
                  )}
                </div>
              );
            } else {
              return (
                <div key={key} className="ws-py-[3px]">
                  <Label htmlFor={key} className="text-lg font-semibold">
                    {optTitle}
                  </Label>
                  <TextInput
                    value={currentValue}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    id={key}
                    aria-labelledby={`${key}-label`}
                  />
                  {schema.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {schema.description}
                    </p>
                  )}
                </div>
              );
            }
          default:
            return null;
        }
      },
      [localValues, handleInputChange, searchTerms],
    );

    const renderOptions = useCallback(
      (opts: any) => {
        return Object.entries(opts).map(([key, value]) => {
          if (
            value &&
            typeof value === 'object' &&
            !('type' in value) &&
            !('defaultValue' in value)
          ) {
            return (
              <fieldset key={key} className="ws-py-[3px]">
                <legend className="text-lg font-semibold">
                  <Highlight
                    text={camelCaseToTitle(key)}
                    searchTerms={searchTerms ?? []}
                  />
                </legend>
                {renderOptions(value)}
              </fieldset>
            );
          } else {
            return renderOption(value, key);
          }
        });
      },
      [renderOption, searchTerms],
    );

    const memoizedForm = useMemo(() => {
      if (!options || typeof options !== 'object') {
        return (
          <div className="text-red-500">Error: Invalid options provided</div>
        );
      }

      return <>{renderOptions(options)}</>;
    }, [options, renderOptions]);

    return memoizedForm;
  },
);

export default OptionsForm;
