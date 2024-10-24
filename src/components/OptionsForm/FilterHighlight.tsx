import React, { useState, useMemo, useEffect } from 'react';
import { OptionsForm, OptionsFormProps } from './OptionsForm';

// Helper function to check if an option matches all search terms
const optionMatchesSearch = (option: any, searchTerms: string[]): boolean => {
  const fieldsToSearch = [
    'name',
    'description',
    'enumDescriptions',
    'markdownDescription',
  ];

  return searchTerms.every((term) =>
    fieldsToSearch.some((field) => {
      if (Array.isArray(option[field])) {
        return option[field].some((item: string) =>
          item.toLowerCase().includes(term.toLowerCase()),
        );
      }
      return (
        option[field] &&
        option[field].toLowerCase().includes(term.toLowerCase())
      );
    }),
  );
};

// Recursive function to filter options based on search terms
const filterOptions = (options: any, searchTerms: string[]): any => {
  if (typeof options !== 'object' || options === null) {
    return options;
  }

  const filteredOptions: any = {};

  Object.entries(options).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      if (
        'name' in value ||
        'description' in value ||
        'enumDescriptions' in value ||
        'markdownDescription' in value
      ) {
        // This is an individual option
        if (optionMatchesSearch(value, searchTerms)) {
          filteredOptions[key] = value;
        }
      } else {
        // This is a nested object of options
        const filtered = filterOptions(value, searchTerms);
        if (Object.keys(filtered).length > 0) {
          filteredOptions[key] = filtered;
        }
      }
    }
  });

  return filteredOptions;
};

export const withSearchHighlight = (
  BaseComponent: React.ComponentType<OptionsFormProps>,
) => {
  return (props: OptionsFormProps) => {
    const searchQueryInputRef = React.useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return props.options;
      const searchTerms = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 0);
      return filterOptions(props.options, searchTerms);
    }, [props.options, searchQuery]);

    const searchTerms = useMemo(
      () =>
        searchQuery
          .toLowerCase()
          .split(/\s+/)
          .filter((term) => term.length > 0),
      [searchQuery],
    );

    useEffect(() => {
      searchQueryInputRef.current?.focus();
    }, [searchQuery]);

    return (
      <div className="ws-flex ws-h-full ws-flex-col">
        <div className="ws-quick-input-container ws-w-full">
          <input
            ref={searchQueryInputRef}
            type="text"
            className="ws-quick-input-input ws-mb-[4px] ws-w-full ws-flex-grow ws-rounded ws-border-none"
            style={{ height: '24px' }}
            placeholder="Search settings (name, description, enum descriptions)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ws-flex-grow ws-overflow-auto">
          <BaseComponent
            {...props}
            searchTerms={searchTerms}
            options={filteredOptions}
          />
        </div>
      </div>
    );
  };
};

const FilterHighlight = withSearchHighlight(OptionsForm);
export default FilterHighlight;
