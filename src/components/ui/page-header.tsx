import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="text-center space-y-4 py-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
}