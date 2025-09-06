import React from 'react';
import { Sprout, Droplets, Sun, Thermometer } from 'lucide-react';

const CropSuggestionWidget = ({ parcels = [] }) => {
  // Default suggestions if no parcels are provided
  const defaultSuggestions = [
    {
      id: 1,
      crop: 'Maíz',
      season: 'Temporada de lluvias',
      description: 'Ideal para la temporada actual con buen drenaje',
      compatibility: 'Alta',
      waterNeeds: 'Media',
      sunExposure: 'Alta',
      temperature: '18-32°C'
    },
    {
      id: 2,
      crop: 'Frijoles',
      season: 'Todo el año',
      description: 'Buena opción para rotación de cultivos',
      compatibility: 'Media',
      waterNeeds: 'Baja',
      sunExposure: 'Media',
      temperature: '15-30°C'
    },
    {
      id: 3,
      crop: 'Yuca',
      season: 'Temporada seca',
      description: 'Resistente a sequías, requiere poco mantenimiento',
      compatibility: 'Alta',
      waterNeeds: 'Baja',
      sunExposure: 'Alta',
      temperature: '25-35°C'
    }
  ];

  const displaySuggestions = parcels.length > 0 ? parcels : defaultSuggestions;

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Sugerencias de Cultivo</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Ver más
        </button>
      </div>

      <div className="space-y-4">
        {displaySuggestions.slice(0, 2).map((suggestion) => (
          <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{suggestion.crop}</h4>
                <p className="text-sm text-muted-foreground">{suggestion.season}</p>
                <p className="text-sm mt-2">{suggestion.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                suggestion.compatibility === 'Alta' 
                  ? 'bg-green-100 text-green-800' 
                  : suggestion.compatibility === 'Media'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {suggestion.compatibility}
              </span>
            </div>
            
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                <span>{suggestion.waterNeeds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sun className="h-4 w-4" />
                <span>{suggestion.sunExposure}</span>
              </div>
              <div className="flex items-center gap-1">
                <Thermometer className="h-4 w-4" />
                <span>{suggestion.temperature}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors">
        Ver todas las sugerencias
      </button>
    </div>
  );
};

export default CropSuggestionWidget;
