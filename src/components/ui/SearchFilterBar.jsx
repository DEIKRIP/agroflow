import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Input from './Input';
import Select from './Select';
import Button from './Button';

const SearchFilterBar = ({ 
  onSearch, 
  onFilter, 
  filters = [], 
  searchPlaceholder = "Buscar...",
  showAdvancedFilters = true,
  className = '',
  initialValues = {}
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValues.search || '');
  const [filterValues, setFilterValues] = useState(initialValues.filters || {});
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchTimeoutRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, onSearch]);

  // Count active filters
  useEffect(() => {
    const count = Object.values(filterValues).filter(value => 
      value !== '' && value !== null && value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
    setActiveFiltersCount(count);
  }, [filterValues]);

  const handleFilterChange = (filterKey, value) => {
    const newFilterValues = {
      ...filterValues,
      [filterKey]: value
    };
    setFilterValues(newFilterValues);
    
    if (onFilter) {
      onFilter(newFilterValues);
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {};
    filters.forEach(filter => {
      clearedFilters[filter.key] = filter.multiple ? [] : '';
    });
    setFilterValues(clearedFilters);
    setSearchTerm('');
    
    if (onFilter) {
      onFilter(clearedFilters);
    }
    if (onSearch) {
      onSearch('');
    }
  };

  const renderFilter = (filter) => {
    const value = filterValues[filter.key] || (filter.multiple ? [] : '');

    switch (filter.type) {
      case 'select':
        return (
          <Select
            key={filter.key}
            label={filter.label}
            options={filter.options}
            value={value}
            onChange={(newValue) => handleFilterChange(filter.key, newValue)}
            placeholder={filter.placeholder}
            multiple={filter.multiple}
            searchable={filter.searchable}
            clearable={filter.clearable}
            className="min-w-[200px]"
          />
        );

      case 'date':
        return (
          <Input
            key={filter.key}
            type="date"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="min-w-[160px]"
          />
        );

      case 'daterange':
        return (
          <div key={filter.key} className="flex space-x-2">
            <Input
              type="date"
              label={`${filter.label} (Desde)`}
              value={value.from || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, from: e.target.value })}
              className="min-w-[140px]"
            />
            <Input
              type="date"
              label={`${filter.label} (Hasta)`}
              value={value.to || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, to: e.target.value })}
              className="min-w-[140px]"
            />
          </div>
        );

      case 'number':
        return (
          <Input
            key={filter.key}
            type="number"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            min={filter.min}
            max={filter.max}
            className="min-w-[120px]"
          />
        );

      default:
        return (
          <Input
            key={filter.key}
            type="text"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="min-w-[160px]"
          />
        );
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Search and Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent micro-interaction"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground micro-interaction"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          {showAdvancedFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              iconName="Filter"
              iconPosition="left"
              className="relative"
            >
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              iconName="X"
              iconPosition="left"
              size="sm"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && filters.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(renderFilter)}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {Object.entries(filterValues).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const filter = filters.find(f => f.key === key);
            if (!filter) return null;

            const displayValue = Array.isArray(value) 
              ? value.length > 1 ? `${value.length} seleccionados` : value[0]
              : value;

            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                <span className="font-medium">{filter.label}:</span>
                <span className="ml-1">{displayValue}</span>
                <button
                  onClick={() => handleFilterChange(key, filter.multiple ? [] : '')}
                  className="ml-1 hover:text-primary/80 micro-interaction"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;