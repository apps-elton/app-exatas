import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import AutoRotatingGroup from './AutoRotatingGroup';
import CircumscribedSphere from './circumscribed/CircumscribedSphere';
import CircumscribedCube from './circumscribed/CircumscribedCube';
import CircumscribedCylinder from './circumscribed/CircumscribedCylinder';
import CircumscribedCone from './circumscribed/CircumscribedCone';

interface CircumscribedShapesProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function CircumscribedShapes({ params, options, style }: CircumscribedShapesProps) {
  return (
    <AutoRotatingGroup options={options} style={style}>
      <CircumscribedSphere params={params} options={options} style={style} />
      <CircumscribedCube params={params} options={options} style={style} />
      <CircumscribedCylinder params={params} options={options} style={style} />
      <CircumscribedCone params={params} options={options} style={style} />
    </AutoRotatingGroup>
  );
}