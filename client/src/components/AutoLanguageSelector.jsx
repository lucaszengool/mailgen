import React from 'react';
import { LanguageSelector } from 'react-auto-google-translate';

const AutoLanguageSelector = () => {
  // Custom styles for the language selector to match your design
  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '40px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #d1d5db',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dcfce7' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? '#16a34a' : '#374151',
      '&:hover': {
        backgroundColor: '#f3f4f6',
      },
    }),
  };

  return (
    <div className="notranslate">
      <LanguageSelector
        componentScale={0.9}
        customStyles={customStyles}
      />
    </div>
  );
};

export default AutoLanguageSelector;
