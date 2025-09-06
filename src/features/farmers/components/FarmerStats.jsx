import React from 'react';
import Icon from '../../../components/AppIcon';

const FarmerStats = ({ farmers = [] }) => {
  const stats = {
    total: farmers.length,
    active: farmers.filter(f => f.status === 'active').length,
    pending: farmers.filter(f => f.status === 'pending').length,
    approved: farmers.filter(f => f.status === 'approved').length,
    rejected: farmers.filter(f => f.status === 'rejected').length,
    underReview: farmers.filter(f => f.status === 'under_review').length
  };

  const totalArea = farmers.reduce((sum, farmer) => sum + (farmer.totalArea || 0), 0);
  const totalFinancing = farmers.reduce((sum, farmer) => {
    const lastAmount = farmer.lastFinancingAmount || 0;
    return sum + lastAmount;
  }, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatArea = (area) => {
    return area.toLocaleString('es-VE', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    });
  };

  const statCards = [
    {
      title: 'Total Agricultores',
      value: stats.total,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Activos',
      value: stats.active,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: 'Clock',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'En Revisión',
      value: stats.underReview,
      icon: 'Eye',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const summaryCards = [
    {
      title: 'Área Total',
      value: `${formatArea(totalArea)} ha`,
      icon: 'MapPin',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Financiamiento Total',
      value: formatCurrency(totalFinancing),
      icon: 'DollarSign',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4 hover:shadow-card-elevation micro-interaction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <Icon name={stat.icon} size={20} className={stat.color} />
            </div>
          </div>
        </div>
      ))}

      {summaryCards.map((stat, index) => (
        <div key={`summary-${index}`} className="bg-card border border-border rounded-lg p-4 hover:shadow-card-elevation micro-interaction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <Icon name={stat.icon} size={20} className={stat.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FarmerStats;